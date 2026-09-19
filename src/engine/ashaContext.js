import { db, getLearned } from '../db/db'
import { buildSubjectFacts } from './prefill'
import { caseloadMatrix, memberStatus, householdSummary } from './caseload'
import { ASHA, ENROLMENTS, PROOFS, SCHEMES, REMINDERS, MEDICINE_KIT } from '../data/seed'

/* =========================================================================
   What the worker's assistant knows.

   Everything below is read out of the same local database she writes to, so
   the assistant quotes the record rather than a copy of it. Nothing here is
   fetched: this builds with no signal, which is the normal condition.
   ========================================================================= */

const dt = d => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—'
/* Calendar days, not elapsed hours: a date-only value stored at midnight must
   not read as "12 days" when the task itself says 11. */
const dayDiff = d => {
  const a = new Date(d), b = new Date()
  a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0)
  return Math.round((a - b) / 86400000)
}
const rupee = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const sameMonth = d => {
  const x = new Date(d), n = new Date()
  return x.getMonth() === n.getMonth() && x.getFullYear() === n.getFullYear()
}

/** One person, flattened to what an answer needs. */
function person(m, household, enrolments, tasks, encounters) {
  const st = memberStatus(m)
  return {
    id: m.id,
    name: m.name,
    age: m.age,
    sex: m.sex === 'F' ? 'female' : 'male',
    role: m.role,
    relation: m.relation || null,
    house: household ? `House ${household.houseNo}` : '—',
    householdId: m.householdId,
    head: household?.headName || '—',
    village: household?.village || '—',
    status: st.label,
    detail: st.detail,
    kind: st.kind,
    weeks: st.weeks ?? null,
    trimester: st.trimester ?? null,
    urgent: !!st.urgent,
    lmp: m.lmp || null,
    dob: m.dob || null,
    schemes: enrolments.filter(e => e.memberId === m.id),
    tasks: tasks.filter(t => t.memberId === m.id),
    visits: encounters.filter(e => e.memberId === m.id).length,
    lastVisit: encounters
      .filter(e => e.memberId === m.id)
      .map(e => e.createdAt || e.date)
      .sort()
      .pop() || null,
  }
}

export async function buildAshaContext() {
  const [households, members, tasks, encounters, earnings, outbox, submissions, enrolRows, medKit] =
    await Promise.all([
      db.households.toArray(), db.members.toArray(), db.tasks.toArray(),
      db.encounters.toArray(), db.earnings.toArray(), db.outbox.toArray(),
      db.formSubmissions.toArray(), db.enrolments.toArray(),
      db.medicineKit?.toArray().catch(() => []) || [],
    ])

  const enrolments = [...ENROLMENTS, ...enrolRows]
  const hById = Object.fromEntries(households.map(h => [h.id, h]))
  const mById = Object.fromEntries(members.map(m => [m.id, m]))

  // decorate the tasks first, so a person carries readable ones
  const rich = tasks.map(t => ({
    ...t,
    who: mById[t.memberId]?.name || t.title,
    where: t.house || (hById[t.householdId] ? `House ${hById[t.householdId].houseNo}` : '—'),
    inDays: dayDiff(t.due),
    when: dt(t.due),
  }))

  const people = members.map(m => person(m, hById[m.householdId], enrolments, rich, encounters))
  const byId = Object.fromEntries(people.map(p => [p.id, p]))

  const matrix = caseloadMatrix({ households, members, tasks })

  const late = rich.filter(t => t.level === 'late')
  const dueToday = rich.filter(t => t.level === 'due' && dayDiff(t.due) <= 0)
  const dueSoon = rich.filter(t => t.level === 'due' && dayDiff(t.due) > 0)
  const planned = rich.filter(t => t.level === 'info')

  const claimed = earnings.filter(e => e.claimed)
  const unclaimed = earnings.filter(e => !e.claimed)
  const money = {
    thisMonth: earnings.filter(e => sameMonth(e.date)).reduce((n, e) => n + e.amount, 0),
    paid: claimed.reduce((n, e) => n + e.amount, 0),
    pending: unclaimed.reduce((n, e) => n + e.amount, 0),
    pendingCount: unclaimed.length,
    recent: [...earnings].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5),
  }

  const blocked = enrolments
    .filter(e => e.state === 'blocked')
    .map(e => ({ ...e, who: byId[e.memberId]?.name || 'someone in your list' }))
  const proofTrouble = PROOFS
    .filter(p => p.state === 'missing' || p.state === 'mismatch')
    .map(p => ({ ...p, who: byId[p.memberId]?.name || hById[p.householdId]?.headName || '—' }))

  return {
    asha: {
      name: ASHA.name, id: ASHA.id, village: ASHA.village,
      phc: 'Rampur Primary Health Centre', block: 'Rampur block', district: 'Barabanki',
      anm: 'Kavita Singh',
    },
    matrix, households, people, byId, hById,
    tasks: { late, dueToday, dueSoon, planned, all: rich },
    money,
    sync: {
      queued: outbox.length,
      visits: encounters.length,
      forms: submissions.length,
      unsyncedForms: submissions.filter(f => !f.synced).length,
    },
    schemes: SCHEMES,
    enrolments,
    blocked,
    proofTrouble,
    medicineKit: (medKit && medKit.length) ? medKit : MEDICINE_KIT,
    reminders: REMINDERS.filter(r => r.on),
  }
}

/* --------------------------------------------------------- person lookup */

const normalise = s => String(s || '').toLowerCase().replace(/[^a-zऀ-ൿ ]/g, ' ').trim()

/** Find who a question is about. Matches a whole name, a first name, or a house number. */
export function findPeople(ctx, question) {
  const q = normalise(question)
  if (!q) return []
  const hits = []
  for (const p of ctx.people) {
    const name = normalise(p.name)
    const parts = name.split(/\s+/).filter(x => x.length > 2)
    if (q.includes(name) || parts.some(w => new RegExp(`\\b${w}\\b`).test(q))) hits.push(p)
  }
  const house = question.match(/house\s*(?:no\.?|number)?\s*(\d{1,4})/i)
  if (house) {
    const h = ctx.households.find(x => String(x.houseNo) === house[1])
    if (h) for (const p of ctx.people) if (p.householdId === h.id && !hits.includes(p)) hits.push(p)
  }
  return hits
}

/** A one-line description of one person, used in answers and in the fact sheet. */
export function describe(p) {
  const bits = [`${p.name}, ${p.age}, ${p.house} (${p.head}), ${p.village}`, p.status]
  if (p.detail) bits.push(p.detail)
  if (p.schemes.length) bits.push('on ' + p.schemes.map(s => s.label || s.scheme).join(', '))
  if (p.tasks.length) bits.push('due: ' + p.tasks.map(t => t.reason).join('; '))
  if (p.lastVisit) bits.push('last visit ' + dt(p.lastVisit))
  return bits.join(' · ')
}

/** Her full record, derived, for a question that needs the clinical numbers. */
export async function subjectFacts(memberId) {
  const member = await db.members.get(memberId)
  if (!member) return {}
  const [household, encounters, learned] = await Promise.all([
    db.households.get(member.householdId),
    db.encounters.where('memberId').equals(memberId).toArray(),
    getLearned(memberId),
  ])
  const { facts } = buildSubjectFacts({ household, member, encounters, learned })
  return facts
}

export { dt, rupee, dayDiff }
