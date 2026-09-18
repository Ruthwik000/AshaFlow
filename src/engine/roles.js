/* =========================================================================
   Who a person can be.

   Three fields describe one person — sex, relation to the head of the
   household, and status — and they are not independent. A father is not
   pregnant. A wife is not male. A three-year-old is not the elder of the
   house. Left to themselves, three separate chip rows will happily record
   all of that, and the contradiction then travels into every form the
   record fills.

   So the rules live here, once, and both intake screens apply them: an
   impossible option is shown disabled, and a choice that invalidates
   another field corrects it and says so.
   ========================================================================= */

export const SEXES = [{ v: 'F', l: 'Female' }, { v: 'M', l: 'Male' }]

export const RELATIONS = [
  { v: 'head', l: 'Head' }, { v: 'wife', l: 'Wife' }, { v: 'husband', l: 'Husband' },
  { v: 'son', l: 'Son' }, { v: 'daughter', l: 'Daughter' },
  { v: 'mother', l: 'Mother' }, { v: 'father', l: 'Father' }, { v: 'other', l: 'Other' },
]

export const STATUSES = [
  { v: 'pregnant', l: 'Pregnant' }, { v: 'mother', l: 'Mother' },
  { v: 'infant', l: 'Infant' }, { v: 'child', l: 'Child' },
  { v: 'adult', l: 'Adult' }, { v: 'elder', l: 'Elder' },
]

/** A relation that only one sex can hold. */
const RELATION_SEX = {
  wife: 'F', mother: 'F', daughter: 'F',
  husband: 'M', father: 'M', son: 'M',
  head: null, other: null,
}

/** The same relation seen from the other sex. */
const MIRROR = {
  wife: 'husband', husband: 'wife',
  mother: 'father', father: 'mother',
  daughter: 'son', son: 'daughter',
}

const LABEL = v =>
  RELATIONS.find(r => r.v === v)?.l || STATUSES.find(s => s.v === v)?.l || v

const num = a => (a === '' || a === null || a === undefined ? null : Number(a))

/* ------------------------------------------------------------- what fits */

/** Why a status cannot apply to this person, or null if it can. */
export function statusBlocked(status, { sex, relation, age }) {
  const a = num(age)
  const relSex = RELATION_SEX[relation] || null

  if (status === 'pregnant' || status === 'mother') {
    if (sex === 'M') return 'only a woman'
    if (relSex === 'M') return `not a ${LABEL(relation).toLowerCase()}`
    if (a != null && a < 12) return 'too young'
    if (status === 'pregnant' && a != null && a > 55) return 'too old'
  }
  if (status === 'infant' && a != null && a >= 2) return 'over 2 years'
  if (status === 'child' && a != null && a >= 18) return 'over 18'
  if (status === 'adult' && a != null && a < 15) return 'under 15'
  if (status === 'elder' && a != null && a < 50) return 'under 50'
  return null
}

/** Why a relation cannot apply to this person, or null if it can. */
export function relationBlocked(relation, { sex, role, age }) {
  const relSex = RELATION_SEX[relation] || null
  if (relSex && sex && relSex !== sex) return `only ${relSex === 'F' ? 'a woman' : 'a man'}`
  if ((role === 'pregnant' || role === 'mother') && relSex === 'M') return 'only a woman'
  if ((role === 'infant' || role === 'child') && ['head', 'wife', 'husband', 'mother', 'father'].includes(relation))
    return 'a child cannot be'
  const a = num(age)
  if (a != null && a < 15 && ['head', 'wife', 'husband', 'mother', 'father'].includes(relation))
    return 'too young'
  return null
}

export const allowedStatuses = p => STATUSES.filter(s => !statusBlocked(s.v, p)).map(s => s.v)
export const allowedRelations = p => RELATIONS.filter(r => !relationBlocked(r.v, p)).map(r => r.v)

/** The status age alone would suggest. */
export function statusFromAge(age, sex) {
  const a = num(age)
  if (a == null || Number.isNaN(a)) return null
  if (a < 1) return 'infant'
  if (a < 15) return 'child'
  if (a >= 60) return 'elder'
  return 'adult'
}

/** The nearest relation that still fits: the mirror first, then the one the
 *  status implies, then a plain "Other". */
function bestRelation(p, was) {
  const ok = r => r && !relationBlocked(r, p)
  const implied = (p.role === 'infant' || p.role === 'child')
    ? (p.sex === 'M' ? 'son' : 'daughter')
    : p.role === 'elder' ? (p.sex === 'M' ? 'father' : 'mother')
    : (p.sex === 'M' ? 'husband' : 'wife')
  return [MIRROR[was], implied, 'other', ...allowedRelations(p)].find(ok) || 'other'
}

/* ------------------------------------------------------------- reconcile */

/**
 * Apply one change and put the other fields right.
 *
 * The field the worker just touched is never overruled — everything else
 * moves around it — and `note` says in one line what moved, so a corrected
 * chip is never a surprise.
 */
export function reconcile(person, patch) {
  const touched = Object.keys(patch)[0]
  const p = { ...person, ...patch }
  const notes = []

  // 1. a sexed relation settles the sex
  if (touched === 'relation') {
    const want = RELATION_SEX[p.relation]
    if (want && p.sex !== want) {
      p.sex = want
      notes.push(`set the sex to ${want === 'F' ? 'female' : 'male'}`)
    }
  }

  // 2. a change of sex flips a relation that belonged to the other one
  if (touched === 'sex') {
    const relSex = RELATION_SEX[p.relation]
    if (relSex && relSex !== p.sex && MIRROR[p.relation]) {
      const was = p.relation
      p.relation = MIRROR[was]
      notes.push(`changed ${LABEL(was)} to ${LABEL(p.relation)}`)
    }
  }

  // 3. a status the worker chose herself settles the sex, before anything is
  //    repaired against a sex that is about to change
  if (touched === 'role' && (p.role === 'pregnant' || p.role === 'mother') && p.sex !== 'F') {
    p.sex = 'F'
    notes.push('set the sex to female')
  }

  // 4. the status must survive both
  if (touched !== 'role') {
    const why = statusBlocked(p.role, p)
    if (why) {
      const was = p.role
      const fallback = statusFromAge(p.age, p.sex) || (p.sex === 'F' ? 'adult' : 'adult')
      p.role = allowedStatuses(p).includes(fallback) ? fallback : (allowedStatuses(p)[0] || 'adult')
      notes.push(`moved the status off ${LABEL(was)} — ${why}`)
    }
  }

  // 5. …and so must the relation
  if (touched !== 'relation') {
    const why = relationBlocked(p.relation, p)
    if (why) {
      const was = p.relation
      p.relation = bestRelation(p, was)
      notes.push(`changed the relation from ${LABEL(was)}`)
    }
  }

  // dates only belong to the status that uses them
  if (p.role !== 'pregnant') p.lmp = ''
  if (p.role !== 'infant' && p.role !== 'child') p.dob = ''

  return { person: p, note: notes.length ? notes.join(', ') : null }
}
