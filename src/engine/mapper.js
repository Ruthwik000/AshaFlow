import { runDerivations, ruleFor } from './derive'
import { REMEMBERED_PATHS, PATH_LABELS, QUESTION_BANK } from '../data/canonical'
import { NIS_SCHEDULE, DERIVATIONS } from '../data/derivations'
import { fieldsFor } from './solver'

/* A stored answer is a code ('cordPus'), never the words the ASHA saw. This
   turns it back into those words for every register and every export. */
const VALUE_LABELS = (() => {
  const m = {}
  for (const [key, q] of Object.entries(QUESTION_BANK)) {
    if (!q.options) continue
    const paths = q.provides || [key]
    for (const p of paths) {
      m[p] = m[p] || {}
      q.options.forEach(o => { m[p][String(o.v)] = o.l })
    }
  }
  m['imm.dosesGiven'] = { none: 'None given today' }
  NIS_SCHEDULE.forEach(v => { m['imm.dosesGiven'][v.code] = v.name })
  return m
})()

const label = (path, v) => VALUE_LABELS[path]?.[String(v)] ?? String(v)

/**
 * Paths whose question was removed by skip logic — not missing, just N/A.
 *
 * The answer being skipped also silences everything computed from it: no waist
 * measurement for a 24-year-old means no CBAC waist band, no score contribution
 * and no screening referral. Without this the register shows "missing" for a
 * field that was correctly never collected, which is the difference between a
 * form that looks broken and one that is right.
 */
function notApplicablePaths(facts) {
  const out = new Set()
  for (const [key, q] of Object.entries(QUESTION_BANK)) {
    if (!q.applicableWhen) continue
    let gated = false
    try { gated = !q.applicableWhen(facts) } catch { gated = false }
    if (gated) (q.provides || [key]).forEach(p => out.add(p))
  }
  // Propagate along the rules until nothing new falls out.
  const type = facts.__encounterType
  let changed = true, guard = 0
  while (changed && guard++ < 12) {
    changed = false
    for (const r of DERIVATIONS) {
      if (r.only && type && !r.only.includes(type)) continue
      if (out.has(r.out) || facts[r.out] !== undefined) continue
      if (r.needs.length && r.needs.some(n => out.has(n) && facts[n] === undefined)) {
        out.add(r.out); changed = true
      }
    }
  }
  return out
}

const fmt = (v, path) => {
  if (v === true) return 'Yes'
  if (v === false) return 'No'
  if (v === undefined || v === null || v === '') return '—'
  if (Array.isArray(v)) {
    const real = v.filter(x => x !== 'none')
    return real.length ? real.map(x => label(path, x)).join(', ') : 'None'
  }
  return label(path, v)
}

/**
 * Take one set of captured facts and produce one payload per programme.
 * Every field carries where it came from, which is what the provenance
 * screen reads.
 */
export function buildOutputs({ programmes, facts, answeredKeys = [], encounterType }) {
  const { facts: full, trace } = runDerivations(facts)
  const answeredPaths = new Set(Object.keys(facts))
  const na = notApplicablePaths(full)
  const type = encounterType || facts.__encounterType

  // Only the registers this kind of visit feeds, and only their columns for it.
  const outputs = programmes
    .filter(p => fieldsFor(p, type).length > 0)
    .map(p => {
    const rows = fieldsFor(p, type).map(f => {
      const value = full[f.from]
      const isNA = value === undefined && na.has(f.from)
      let origin = 'asked'
      if (isNA) origin = 'na'
      else if (trace[f.from]) origin = 'derived'
      else if (REMEMBERED_PATHS.includes(f.from) && answeredPaths.has(f.from)) origin = 'remembered'
      return {
        id: f.id,
        label: f.label,
        path: f.from,
        pathLabel: PATH_LABELS[f.from] || f.from,
        value: isNA ? 'Not applicable' : fmt(value, f.from),
        raw: value,
        required: f.required,
        origin,
        why: trace[f.from]?.why || ruleFor(f.from)?.why || null,
        fromPaths: trace[f.from]?.from || [],
        notApplicable: isNA,
        missing: !isNA && f.required && (value === undefined || value === null || value === ''),
      }
    })
    return {
      code: p.code, name: p.name, shortName: p.shortName,
      colour: p.colour, note: p.note, source: p.source,
      rows,
      count: rows.length,
      complete: rows.every(r => !r.missing),
    }
  })

  return { outputs, full, trace }
}

/** What each programme actually receives — the privacy screen reads this. */
export function privacyProjection(outputs) {
  const IDENTIFYING = ['person.name', 'person.husbandName', 'person.mobile',
    'person.aadhaarLast4', 'person.abhaId', 'household.houseNo', 'household.headName']
  return outputs.map(o => ({
    code: o.code,
    name: o.name,
    colour: o.colour,
    gets: o.rows.filter(r => IDENTIFYING.includes(r.path)).map(r => r.pathLabel),
    getsCount: o.rows.length,
    withheld: IDENTIFYING.filter(p => !o.rows.some(r => r.path === p))
      .map(p => PATH_LABELS[p]),
    aggregateOnly: o.code === 'HMIS',
  }))
}

export { fmt }
