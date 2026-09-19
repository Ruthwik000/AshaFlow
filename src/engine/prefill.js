import { runDerivations } from './derive'
import { PATH_LABELS, REMEMBERED_PATHS } from '../data/canonical'

/**
 * Build the canonical record for one person, from everything already stored:
 * the household survey, the member row, every past encounter, and anything
 * learned while filling an earlier form. Then run the derivation rules.
 */
export function buildSubjectFacts({ household, member, encounters = [], learned = {} }) {
  const facts = { ...(household?.facts || {}) }

  if (household) {
    facts['household.houseNo'] = household.houseNo
    facts['household.headName'] = household.headName
    facts['household.village'] = household.village
    facts['household.membersCount'] = household.membersCount
    facts['household.bplCard'] = household.bplCard
    facts['household.block'] = facts['household.block'] ?? 'Rampur block'
    facts['household.district'] = facts['household.district'] ?? 'Barabanki'
  }

  if (member) {
    facts['person.name'] = member.name
    facts['person.age'] = member.age
    facts['person.sex'] = member.sex
    if (member.lmp) facts['pregnancy.lmp'] = member.lmp
    if (member.dob) { facts['child.dob'] = member.dob; facts['child.sex'] = member.sex }
  }

  // newest encounter last, so later visits win
  for (const e of [...encounters].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))) {
    Object.assign(facts, e.facts || {})
  }

  Object.assign(facts, learned)
  const { facts: full, trace } = runDerivations(facts)
  return { facts: full, trace }
}

/* =========================================================================
   What a new visit may start from.

   buildSubjectFacts returns everything ever recorded about a person, which is
   right for answering a question and wrong for opening a visit: last month's
   weight, blood pressure and haemoglobin would arrive already filled in, and
   the visit exists precisely to measure them again.

   So a visit carries forward only what does not change — who she is, where she
   lives, when this pregnancy started, what a scanned form once asked her — and
   everything measured is asked fresh. The derivations then run over that, so
   ages and due dates are recomputed rather than remembered stale.
   ========================================================================= */
const STABLE = new Set(REMEMBERED_PATHS)
const carryable = k => STABLE.has(k) || k.startsWith('scan.')

export function buildCarryForwardFacts({ household, member, encounters = [], learned = {} }) {
  const stable = {}
  for (const e of [...encounters].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))) {
    for (const [k, v] of Object.entries(e.facts || {})) if (carryable(k)) stable[k] = v
  }
  for (const [k, v] of Object.entries(learned)) if (carryable(k)) stable[k] = v

  // household and member rows are stable by nature, so they pass through whole
  const { facts } = buildSubjectFacts({ household, member, encounters: [], learned: {} })
  const { facts: full, trace } = runDerivations({ ...facts, ...stable })
  return { facts: full, trace }
}

const EMPTY = v => v === undefined || v === null || v === ''

/**
 * Lay a form over the record. Every field comes back knowing where its value
 * came from, so the screen can show what was filled and ask only for the rest.
 */
export function fillForm(form, facts, trace = {}, answers = {}) {
  let known = 0, asked = 0, total = 0

  const sections = form.sections.map(sec => {
    const fields = sec.fields.map(f => {
      const manual = answers[f.from]
      const auto = facts[f.from]
      const value = !EMPTY(manual) ? manual : auto
      const source = !EMPTY(manual) ? 'entered'
        : trace[f.from] ? 'derived'
        : !EMPTY(auto) ? 'record'
        : 'missing'

      total++
      if (source === 'missing') asked++; else known++

      return {
        ...f,
        value,
        source,
        why: trace[f.from]?.why || null,
        pathLabel: PATH_LABELS[f.from] || f.from,
        blocking: source === 'missing' && f.required,
      }
    })
    return { ...sec, fields }
  })

  const missing = sections.flatMap(s => s.fields).filter(f => f.source === 'missing')

  return {
    sections,
    missing,
    blocking: missing.filter(f => f.required),
    stats: { total, known, asked, pct: total ? Math.round((known / total) * 100) : 0 },
    complete: missing.filter(f => f.required).length === 0,
  }
}

/** Flatten a filled form into the payload that gets stored. */
export function formPayload(filled) {
  const rows = filled.sections.flatMap(s =>
    s.fields.map(f => ({ id: f.id, label: f.label, path: f.from, value: f.value ?? null, source: f.source }))
  )
  return Object.fromEntries(rows.map(r => [r.id, r]))
}
