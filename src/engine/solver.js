import { QUESTION_BANK, REMEMBERED_PATHS } from '../data/canonical'
import { derivableClosure, derivationInputs } from './derive'

/** path -> the question key that can supply it */
const PROVIDER = (() => {
  const m = {}
  for (const [key, q] of Object.entries(QUESTION_BANK)) {
    const provides = q.provides || [key]
    provides.forEach(p => { m[p] = key })
  }
  return m
})()

const ALL_ASKABLE_PATHS = Object.keys(PROVIDER)

/**
 * Fields a programme wants for THIS kind of visit.
 *
 * A field with no `for` belongs to every encounter type — identity, village,
 * date of visit, consent. A field that names encounter types appears only in
 * those. This is what makes one schema file serve six different visits without
 * a line of code per visit.
 */
export function fieldsFor(programme, encounterType) {
  return programme.fields.filter(f => !f.for || !encounterType || f.for.includes(encounterType))
}

/** Programmes that receive anything at all for this kind of visit. */
export function programmesFor(programmes, encounterType) {
  return programmes.filter(p => fieldsFor(p, encounterType).length > 0)
}

/**
 * The whole idea of the project, in one function.
 *
 * Given the programmes that must be satisfied and everything already known
 * about this household, work out the SMALLEST set of questions a human has
 * to answer. Called again after every answer, so skip logic is visible live.
 */
export function planEncounter({ programmes, facts = {}, encounterType = 'Pregnancy' }) {
  // 1. Everything the selected programmes need for THIS visit, duplicates collapsed.
  const needed = new Set()
  let baseline = 0
  for (const p of programmes) {
    const fields = fieldsFor(p, encounterType)
    baseline += fields.length
    fields.forEach(f => needed.add(f.from))
  }

  // 2. What the household already told us on an earlier visit.
  const remembered = new Set(
    REMEMBERED_PATHS.filter(p => facts[p] !== undefined && needed.has(p))
  )

  // 3. Assume every askable path can be obtained, then see what falls out
  //    of the rules for free.
  const supply = new Set([...remembered, ...ALL_ASKABLE_PATHS, ...Object.keys(facts)])
  const derivable = derivableClosure(supply, encounterType)
  const derived = new Set([...needed].filter(p => derivable.has(p) && !remembered.has(p)))

  // 4. Whatever is left has to be asked — plus the raw answers that the derived
  //    fields are computed from, which the registers never name themselves.
  const inputs = derivationInputs([...derived], supply, derivable, encounterType)
  const mustSupply = [...new Set([
    ...[...needed].filter(p => !remembered.has(p) && !derived.has(p)),
    ...[...inputs].filter(p => !remembered.has(p) && !derived.has(p)),
  ])]

  const keys = []
  for (const path of mustSupply) {
    const key = PROVIDER[path]
    if (key && !keys.includes(key)) keys.push(key)
  }
  // Ask in a human order: who she is, then her household, then the clinical part.
  keys.sort((a, b) => (QUESTION_BANK[a].order ?? 999) - (QUESTION_BANK[b].order ?? 999))

  // 5. Skip logic. A question whose gate cannot be evaluated yet stays in the
  //    plan (counted as pending) so the number never surprises the user upward.
  const questions = []
  let skipped = 0
  for (const key of keys) {
    const q = QUESTION_BANK[key]
    if (!q.applicableWhen) { questions.push(key); continue }
    const gateReady = (q.dependsOn || inferDeps(q)).every(d => facts[d] !== undefined)
    if (!gateReady) { questions.push(key); continue }
    if (q.applicableWhen(facts)) questions.push(key)
    else skipped++
  }

  const answered = questions.filter(k => isAnswered(k, facts))
  const remaining = questions.filter(k => !isAnswered(k, facts))

  return {
    encounterType,
    programmes: programmes.filter(p => fieldsFor(p, encounterType).length > 0).map(p => p.code),
    needed: [...needed],
    remembered: [...remembered],
    derived: [...derived],
    questions,
    answered,
    remaining,
    stats: {
      baseline,                       // field entries across the registers, this visit
      unique: needed.size,            // once duplicates are collapsed
      derived: derived.size,          // computed from other answers
      remembered: remembered.size,    // this household already told us
      asked: questions.length,        // what a human actually answers
      skipped,                        // removed by skip logic, live
      saved: baseline - questions.length,
    },
  }
}

function inferDeps(q) {
  // Cheap static read of the gate so we know when it can be trusted.
  const src = String(q.applicableWhen)
  const found = src.match(/f\['([^']+)'\]/g) || []
  return found.map(s => s.slice(3, -2))
}

export function isAnswered(key, facts) {
  const q = QUESTION_BANK[key]
  const provides = q.provides || [key]
  return provides.every(p => facts[p] !== undefined)
}

/** The question, with its options resolved against what is known so far. */
export function questionFor(key, facts = {}) {
  const q = QUESTION_BANK[key]
  return {
    key,
    ...q,
    q: q.qFor ? q.qFor(facts) : q.q,
    hi: q.hiFor ? q.hiFor(facts) : q.hi,
    options: q.optionsFor ? q.optionsFor(facts) : q.options,
  }
}

export { PROVIDER }
