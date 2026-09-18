import { findPeople, describe, dt, rupee } from './ashaContext'

/* =========================================================================
   The worker's offline answer engine.

   Not a language model. An intent matcher whose every answer is COMPOSED
   FROM HER CASELOAD in the local database, so the numbers it quotes are the
   numbers she recorded. This is the floor the assistant never drops below:
   with no signal it is the whole assistant, and with a model available it
   still supplies the sources and the follow-on actions.

   Adding an answer means adding one entry to KB.
   ========================================================================= */

const list = (xs, f) => xs.map(f).join('\n')
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

/** Documents a scheme needs. Programme rules, not personal data. */
const DOCS = {
  PMMVY: {
    name: 'PMMVY (Pradhan Mantri Matru Vandana Yojana)',
    docs: ['Her Aadhaar card', 'Her own bank or post-office account with Aadhaar seeded to it',
           'MCP card showing the pregnancy registration', "Husband's Aadhaar"],
    note: 'The account must be in her own name. A joint or husband\'s account is the commonest reason an instalment is held.',
  },
  JSY: {
    name: 'JSY (Janani Suraksha Yojana)',
    docs: ['MCP card', 'Her Aadhaar', 'Bank passbook in her name', 'BPL or caste certificate where the state asks for it',
           'Discharge slip from the facility after delivery'],
    note: 'JSY is paid after an institutional delivery, usually before discharge.',
  },
  UWIN: {
    name: 'U-WIN immunisation',
    docs: ["Child's birth record or MCP card", "Mother's mobile number for the OTP", 'Aadhaar where the state asks for it'],
    note: 'Register the child once; every later dose is recorded against the same U-WIN id.',
  },
  ICDS: {
    name: 'Anganwadi (ICDS) supplementary nutrition',
    docs: ['MCP card or the child\'s growth card', 'Ration card', 'Aadhaar of the mother'],
    note: 'Enrolment is at the Anganwadi centre; take-home ration is issued monthly.',
  },
}

const ANC = [
  ['ANC 1', 'as soon as the pregnancy is known, before 12 weeks'],
  ['ANC 2', 'between 14 and 26 weeks'],
  ['ANC 3', 'between 28 and 34 weeks'],
  ['ANC 4', 'between 36 weeks and delivery'],
]

const VACCINES = [
  ['At birth', 'BCG, OPV-0, Hepatitis B birth dose'],
  ['6 weeks', 'Penta-1, OPV-1, Rota-1, PCV-1, fIPV-1'],
  ['10 weeks', 'Penta-2, OPV-2, Rota-2'],
  ['14 weeks', 'Penta-3, OPV-3, Rota-3, PCV-2, fIPV-2'],
  ['9 to 12 months', 'Measles-Rubella 1, PCV booster, JE-1, Vitamin A 1'],
  ['16 to 24 months', 'MR-2, DPT booster-1, OPV booster, JE-2'],
]

const DANGER = [
  'Bleeding from the vagina', 'Fits or severe headache with blurred vision',
  'High fever', 'Severe abdominal pain', 'The baby has stopped moving',
  'Water breaking before 37 weeks', 'Severe breathlessness or swelling of the face',
]

const KB = [
  /* ---------------------------------------------------------- her caseload */
  {
    id: 'caseload',
    match: /(how many|total|number of).*(famil|household|people|women|pregnan|child|under ?5|caseload)|my caseload|matrix/i,
    build: c => ({
      text: `You are responsible for ${plural(c.matrix.households, 'family', 'families')} — `
        + `${c.matrix.people} people across ${plural(c.matrix.villages.length, 'village', 'villages')}.\n\n`
        + list(c.matrix.rows, r => `• ${r.label}: ${r.n} — ${r.note}`)
        + `\n\nBy village: ` + c.matrix.villages.map(v => `${v.name} ${v.households}`).join(', ') + '.',
      sources: ['Your household and member records'],
      actions: [{ label: 'Open the caseload matrix', to: '/asha/families', icon: 'families' }],
    }),
  },
  {
    id: 'due',
    match: /(due|pending|overdue|late|today|tomorrow|this week|visit list|who.*(visit|see))/i,
    build: c => {
      const { late, dueToday, dueSoon } = c.tasks
      if (!late.length && !dueToday.length && !dueSoon.length)
        return { text: 'Nothing is due or overdue in your list right now.', sources: ['Your task list'] }
      const L = []
      if (late.length) L.push(`Overdue (${late.length}):\n` + list(late, t => `• ${t.who}, ${t.where} — ${t.reason}`))
      if (dueToday.length) L.push(`Due today (${dueToday.length}):\n` + list(dueToday, t => `• ${t.who}, ${t.where} — ${t.reason}`))
      if (dueSoon.length) L.push(`Coming up:\n` + list(dueSoon, t => `• ${t.who}, ${t.where} — ${t.reason}, ${t.when}`))
      return {
        text: L.join('\n\n') + '\n\nStart with the overdue ones — an overdue ANC is the visit that costs a woman a payment.',
        sources: ['Your task list'],
        actions: [{ label: 'Open today’s list', to: '/asha', icon: 'home' }],
      }
    },
  },
  {
    id: 'pregnant-list',
    match: /(which|who|list).*(pregnan)|pregnant women in/i,
    build: c => {
      const preg = c.people.filter(p => p.kind === 'pregnant')
      if (!preg.length) return { text: 'No pregnancy is registered in your list at the moment.', sources: ['Your member records'] }
      return {
        text: `${plural(preg.length, 'pregnancy is', 'pregnancies are')} registered with you:\n\n`
          + list(preg, p => `• ${p.name}, ${p.house} — ${p.status}${p.detail ? `, ${p.detail}` : ''}`)
          + `\n\n${preg.filter(p => p.trimester === 3).length} of them are in the third trimester and need a birth plan checked.`,
        sources: ['Your member records'],
        actions: [{ label: 'Filter families by pregnancy', to: '/asha/families', icon: 'families' }],
      }
    },
  },
  {
    id: 'children',
    match: /(under ?5|under five|children|newborn|infant|vaccinat)/i,
    build: c => {
      const kids = c.people.filter(p => ['newborn', 'infant', 'under5'].includes(p.kind))
      if (!kids.length) return null
      return {
        text: `${kids.length} children under five are in your list — `
          + `${c.people.filter(p => p.kind === 'newborn').length} newborn, `
          + `${c.people.filter(p => p.kind === 'infant').length} under one year.\n\n`
          + list(kids.slice(0, 8), p => `• ${p.name}, ${p.house} — ${p.status}`)
          + (kids.length > 8 ? `\n…and ${kids.length - 8} more.` : ''),
        sources: ['Your member records'],
        actions: [{ label: 'See children under 5', to: '/asha/families', icon: 'families' }],
      }
    },
  },

  /* ------------------------------------------------------------- her money */
  {
    id: 'money',
    match: /(earn|money|incentive|payment|paid|claim|salary|income|kitna|paisa)/i,
    build: c => ({
      text: `You have earned ${rupee(c.money.thisMonth)} this month.\n\n`
        + `Across your whole ledger:\n`
        + `• ${rupee(c.money.paid)} already paid\n`
        + `• ${rupee(c.money.pending)} still waiting to be claimed, over ${plural(c.money.pendingCount, 'entry', 'entries')}\n\n`
        + `Most recent:\n` + list(c.money.recent.slice(0, 3), e => `• ${e.label} — ${rupee(e.amount)}, ${dt(e.date)}`)
        + `\n\nClaims go through once the proof for each visit is attached.`,
      sources: ['Your incentive ledger'],
      actions: [{ label: 'Open earnings', to: '/asha/earnings', icon: 'rupee' }],
    }),
  },
  {
    id: 'blocked',
    match: /(block|stuck|not com|nahi aaya|held|reject|why.*(payment|paisa|money))/i,
    build: c => {
      if (!c.blocked.length) return null
      return {
        text: `${plural(c.blocked.length, 'payment is', 'payments are')} held up in your list:\n\n`
          + list(c.blocked, b => `• ${b.who} — ${b.label}: ${b.phase}`)
          + `\n\nThe usual cause is the bank account: the money can only go to an account in her own name with Aadhaar seeded to it. `
          + `Take her Aadhaar card to the branch and ask for Aadhaar seeding — it clears in about a week.`,
        sources: ['Scheme enrolments', 'Proof locker'],
        actions: [{ label: 'Check the proof locker', to: '/asha/proof', icon: 'shield' }],
      }
    },
  },
  {
    id: 'proofs',
    match: /(proof|document|paper|kagaz|certificate|missing)/i,
    build: c => {
      if (!c.proofTrouble.length) return null
      return {
        text: `${plural(c.proofTrouble.length, 'document needs', 'documents need')} attention:\n\n`
          + list(c.proofTrouble, p => `• ${p.who} — ${p.label}: ${p.state}${p.issue ? ` (${p.issue})` : ''}`)
          + `\n\nPhotograph the paper once; it is attached to every claim that needs it afterwards.`,
        sources: ['Proof locker'],
        actions: [{ label: 'Open the proof locker', to: '/asha/proof', icon: 'shield' }],
      }
    },
  },

  /* ------------------------------------------------------ programme rules */
  {
    id: 'scheme-docs',
    match: /(pmmvy|matru|vandana|jsy|janani|u-?win|uwin|icds|anganwadi).*(document|paper|need|require|kagaz|apply|form)|what.*(document|paper).*(scheme|pmmvy|jsy)/i,
    build: (c, q) => {
      const code = /pmmvy|matru|vandana/i.test(q) ? 'PMMVY'
        : /jsy|janani/i.test(q) ? 'JSY'
        : /u-?win|uwin|immunis/i.test(q) ? 'UWIN'
        : /icds|anganwadi/i.test(q) ? 'ICDS' : null
      if (!code) return null
      const d = DOCS[code]
      return {
        text: `${d.name} needs:\n\n` + list(d.docs, x => `• ${x}`) + `\n\n${d.note}`,
        sources: [`${code} scheme guidelines`],
        actions: [{ label: 'Open the scheme forms', to: '/asha/forms', icon: 'doc' }],
        verify: true,
      }
    },
  },
  {
    id: 'anc-schedule',
    match: /(anc|antenatal).*(schedule|when|how many|kab)|how many anc/i,
    build: () => ({
      text: 'Four antenatal visits are the minimum under RCH:\n\n'
        + list(ANC, ([a, b]) => `• ${a} — ${b}`)
        + '\n\nAt every one: weight, blood pressure, haemoglobin, abdominal check, IFA tablets, and the Td doses. '
        + 'Register before 12 weeks — early registration is what makes the PMMVY first instalment possible.',
      sources: ['RCH antenatal care schedule'],
      verify: true,
    }),
  },
  {
    id: 'vaccine-schedule',
    match: /(vaccine|immunis|immuniz|penta|bcg|measles|tika).*(schedule|when|due|kab|list)|national schedule/i,
    build: () => ({
      text: 'The national immunisation schedule up to two years:\n\n'
        + list(VACCINES, ([w, v]) => `• ${w} — ${v}`)
        + '\n\nA dose given late is still given; the schedule is caught up, not restarted.',
      sources: ['National immunisation schedule'],
      verify: true,
    }),
  },
  {
    id: 'danger',
    urgent: true,
    match: /(danger sign|bleeding|fits|convulsion|not moving|emergency|refer|102|108)/i,
    build: c => ({
      text: 'Refer immediately, do not wait, if you see any of these:\n\n'
        + list(DANGER, d => `• ${d}`)
        + `\n\nCall 102 for the ambulance and tell the ANM (${c.asha.anm}) on the way. `
        + 'Do not give any medicine yourself.',
      sources: ['Danger signs — referral protocol'],
      tone: 'danger',
    }),
  },

  /* ------------------------------------------------------------- the app */
  {
    id: 'sync',
    match: /(sync|upload|offline|queue|internet|signal|network)/i,
    build: c => ({
      text: c.sync.queued
        ? `${plural(c.sync.queued, 'visit is', 'visits are')} waiting to sync. They are saved on this phone and go up on their own when you get signal — nothing is lost if you stay offline all day.`
        : 'Everything on this phone has synced. You can keep working with no signal; it queues and goes up later.',
      sources: ['Sync queue'],
      actions: [{ label: 'Open sync', to: '/asha/sync', icon: 'sync' }],
    }),
  },
  {
    id: 'howto-register',
    match: /(how.*(register|add).*(pregnan|famil|person|women))|new registration/i,
    build: () => ({
      text: 'To register a new pregnancy: Add → New visit, choose the family, or add the family first if she is not on your list. '
        + 'Ask her for the date of her last period — that one answer fills the delivery date, all four ANC dates, the Td schedule and the baby\'s first-year vaccine calendar.\n\n'
        + 'One capture writes the RCH register, HMIS, the eligible-couple register and the scheme forms together.',
      sources: ['How this app works'],
      actions: [{ label: 'Add a family', to: '/asha/families/new', icon: 'plus' }],
    }),
  },
  {
    id: 'capability',
    match: /(what can you|who are you|help me|what do you do|kya kar sakte)/i,
    build: c => ({
      text: `I can read your own caseload — ${c.matrix.households} families, ${c.matrix.people} people — and answer from it.\n\n`
        + '• Who is due or overdue today\n• Anyone by name: status, schemes, last visit\n'
        + '• Your earnings and what is still unclaimed\n• What a scheme needs and why a payment is stuck\n'
        + '• Schedules, danger signs and referral\n\nAsk anything else too and I will answer it as best I can, '
        + 'and say plainly when it is general guidance rather than something from your records.',
      sources: [],
    }),
  },
]

/* ------------------------------------------------------------------ answer */

/** A person question always beats a topic match — "Sunita" is more specific. */
function aboutPerson(c, q, hits) {
  const p = hits[0]
  const more = hits.length > 1 ? hits.slice(1) : []
  const L = [`${p.name} — ${p.status}${p.detail ? `, ${p.detail}` : ''}`,
             `${p.house}, ${p.head}'s household, ${p.village}. Age ${p.age}.`]
  if (p.schemes.length) {
    L.push('\nOn these schemes:\n' + list(p.schemes, s =>
      `• ${s.label || s.scheme} — ${s.phase}${s.state === 'blocked' ? ' (held up)' : ''}`))
  }
  if (p.tasks.length) L.push('\nDue:\n' + list(p.tasks, t => `• ${t.reason} — ${t.when}`))
  L.push(`\n${p.visits ? `${plural(p.visits, 'visit', 'visits')} recorded, last on ${dt(p.lastVisit)}.` : 'No visit recorded yet.'}`)
  if (more.length) L.push(`\nAlso in that household: ${more.map(x => `${x.name} (${x.status})`).join(', ')}.`)

  return {
    id: 'person',
    text: L.join('\n'),
    sources: [`${p.name}'s record`],
    actions: [{ label: `Open ${p.head}'s family`, to: `/asha/family/${p.householdId}`, icon: 'families' },
              { label: 'Record a visit', to: `/asha/visit/${p.householdId}`, icon: 'plus' }],
  }
}

export function answerAsha(question, ctx) {
  const q = (question || '').trim()
  if (!q || !ctx) return null

  const urgent = KB.find(k => k.urgent && k.match.test(q))
  if (urgent) return { id: urgent.id, ...urgent.build(ctx, q) }

  const hits = findPeople(ctx, q)
  if (hits.length) return aboutPerson(ctx, q, hits)

  let best = null
  for (const k of KB) {
    const m = q.match(k.match)
    if (!m) continue
    if (!best || m[0].length > best.len) {
      const built = k.build(ctx, q)
      if (built) best = { len: m[0].length, out: { id: k.id, ...built } }
    }
  }
  if (best) return best.out

  return {
    id: 'fallback',
    text: `I could not find that in your records. I can tell you who is due, look up anyone by name, `
      + `show your earnings, explain what a scheme needs, or why a payment is stuck.`,
    sources: [],
    actions: [{ label: 'See your caseload', to: '/asha/families', icon: 'families' }],
  }
}

/** Question chips chosen for what her caseload actually contains. */
export function ashaSuggestions(ctx) {
  if (!ctx) return []
  const out = []
  const n = ctx.tasks.late.length + ctx.tasks.dueToday.length
  if (n) out.push('Who do I need to visit today?')
  if (ctx.blocked.length) out.push(`Why is ${ctx.blocked[0].who}'s payment stuck?`)
  const preg = ctx.people.find(p => p.kind === 'pregnant')
  if (preg) out.push(`Tell me about ${preg.name.split(' ')[0]}`)
  out.push('How much have I earned this month?')
  out.push('What documents does PMMVY need?')
  return out.slice(0, 4)
}

export const ASHA_KB_SIZE = KB.length
