// What the assistant is allowed to know, and how it is told.
//
// Both assistants are grounded in the record that is already on the phone. That
// is the whole reason either of them is worth asking: a generic chatbot can
// recite what PMMVY is, only this one can say that HER second instalment is held
// because her Aadhaar is not seeded to her bank account.
//
// Everything sent is listed here in one place, deliberately, so what leaves the
// phone can be read off in a few lines rather than traced through the UI.

import { ASHA, tasks, households, members, earningsHistory, WOMAN, WOMAN_TIMELINE, WOMAN_SCHEMES }
  from '../data/seed'
import programmes from '../data/programmes'
import { langFor } from './live'

const rupees = n => '₹' + n.toLocaleString('en-IN')
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/* Spoken replies are heard, not skimmed: no headings, no bullet characters,
   no markdown, and short enough to hold in the head. */
const VOICE_RULES = `
You are speaking out loud, not writing. Keep each reply to two or three short
sentences unless she asks for more. Never use markdown, bullet points, asterisks
or headings — they are read out as noise. Say numbers in words where it is
natural. If you need to list steps, say "first", "then", "after that".
Let her interrupt you; if she starts speaking, stop and listen.`

const langRule = code => {
  const l = langFor(code)
  return `Speak and reply ONLY in ${l.label}. If she switches language mid-conversation, switch with her and stay in the language she last used. Use everyday village ${l.label}, not textbook or officialese. Keep the English words people actually use — ASHA, ANM, PHC, Aadhaar, ANC, TT, IFA, BP — rather than translating them into words nobody says.`
}

/* --------------------------------------------------------------- the ASHA */

export function ashaContext() {
  const due = tasks.map(t =>
    `- ${t.title} (${t.house}): ${t.reason}. Due ${fmtDate(t.due)}. Visit type: ${t.type}. Priority: ${t.level}.`
  ).join('\n')

  const unclaimed = earningsHistory.filter(e => !e.claimed)
  const money = `She has earned ${rupees(earningsHistory.reduce((n, e) => n + e.amount, 0))} in the period on record. ` +
    `${unclaimed.length} item${unclaimed.length === 1 ? '' : 's'} worth ${rupees(unclaimed.reduce((n, e) => n + e.amount, 0))} ` +
    `${unclaimed.length === 1 ? 'is' : 'are'} still unclaimed: ` +
    unclaimed.map(e => `${e.label} on ${fmtDate(e.date)} (${rupees(e.amount)})`).join(', ') + '.'

  const houses = households.map(h => {
    const who = members.filter(m => m.householdId === h.id)
      .map(m => `${m.name} ${m.age}, ${m.role}`).join('; ')
    return `- House ${h.houseNo}, ${h.village}. Head ${h.headName}. ${who}`
  }).join('\n')

  const regs = programmes.map(p => `${p.shortName} (${p.code})`).join(', ')

  return `
WHO SHE IS
${ASHA.name}, ASHA worker, code ${ASHA.id}, village ${ASHA.village}. Today is ${fmtDate(new Date())}.

HER WORK LIST RIGHT NOW
${due}

HER HOUSEHOLDS
${houses}

HER INCENTIVE MONEY
${money}

THE APP SHE IS USING
ASHAFlow captures one household visit and generates the records for ${regs}.
Visit types: Pregnancy, Newborn (HBNC), Child vaccine, Health check (CBAC), Illness, Household survey.
It works offline; everything syncs when signal returns.`.trim()
}

export function ashaSystem({ voice = false, lang = 'en' } = {}) {
  return `
You are the assistant inside ASHAFlow, used by an ASHA worker in rural India.

${langRule(lang)}

WHAT YOU DO
Answer from her record below whenever the question is about her work: who is due,
why a field was calculated a certain way, where a payment has reached, what a
scheme requires, what a government form is asking for. Quote her actual numbers
and names rather than speaking generally.

WHAT YOU DO NOT DO
- You do not diagnose and you do not prescribe. Explain what the guidelines say
  and when to refer, then tell her to confirm with her ANM or the PHC doctor.
- You never invent a scheme amount, an eligibility rule or a due date. If it is
  not in her record and you are not sure, say you are not sure and tell her where
  to check.
- You do not change any record. You can only read and explain.
- Anything that sounds like an emergency: say plainly to refer now, or call 102.

HOW YOU SOUND
Plain words. She is reading on a small phone in bright sunlight, often standing
in someone's doorway. No preamble, no "great question". Answer first.
${voice ? VOICE_RULES : ''}

HER RECORD
${ashaContext()}`.trim()
}

/* -------------------------------------------------------------- the woman */

export function womanContext(mode) {
  const w = WOMAN[mode]
  const timeline = (WOMAN_TIMELINE[mode] || []).slice(0, 8).map(e => {
    const vals = e.values ? ' ' + e.values.map(([k, v]) => `${k} ${v}`).join(', ') + '.' : ''
    return `- ${fmtDate(e.date)}: ${e.title} (${e.by}).${vals}${e.detail ? ' ' + e.detail : ''}` +
           `${e.next ? ' Next: ' + e.next + '.' : ''}${e.amount ? ' Amount ' + rupees(e.amount) + '.' : ''}`
  }).join('\n')

  const schemes = (WOMAN_SCHEMES[mode] || []).map(s => {
    const stages = s.stages.map(st => {
      let line = `    ${st.label}: ${st.state}`
      if (st.amount) line += ` (${rupees(st.amount)})`
      if (st.blocker) line += `. HELD BECAUSE: ${st.blocker} WHAT FIXES IT: ${st.fix}`
      if (st.note) line += `. ${st.note}`
      return line
    }).join('\n')
    return `- ${s.name} (${s.short}) — ${s.amount}\n  Papers needed: ${s.needs.join(', ')}\n${stages}`
  }).join('\n')

  const baby = w.baby
    ? `Her baby: ${w.baby.name}, ${w.baby.sex === 'M' ? 'boy' : 'girl'}, born ${fmtDate(w.baby.dob)}, ` +
      `now ${w.baby.months} months. Birth weight ${w.baby.birthWeight} kg, now ${w.baby.weight} kg.`
    : `She is ${w.week} weeks pregnant. Expected delivery ${fmtDate(w.edd)}.`

  return `
WHO SHE IS
${w.name}, age ${w.age}, house ${w.houseNo}, ${w.village}. ${w.statusLine}.
RCH ID ${w.rchId}. Her ASHA is ${w.asha} (${w.ashaPhone}), her ANM is ${w.anm}, her centre is ${w.phc}.
${baby}
Today is ${fmtDate(new Date())}.

HER NEXT APPOINTMENT
${w.nextVisit.label} on ${fmtDate(w.nextVisit.date)} at ${w.nextVisit.at}.

HER RECORD, MOST RECENT FIRST
${timeline}

HER SCHEMES AND WHERE EACH ONE HAS REACHED
${schemes}`.trim()
}

export function womanSystem({ mode = 'pregnant', voice = false, lang = 'en' } = {}) {
  const w = WOMAN[mode]
  return `
You are the assistant inside ASHAFlow, talking to ${w.name} herself — a woman in a
village in India, on her own phone, about her own health record.

${langRule(lang)}

WHAT YOU DO
Answer from her record below. She can ask what her own test results mean, where a
payment has reached and why, what papers she needs, when her next visit is, and
what any scheme actually gives her. Use her real numbers and dates. When a
payment is held, say plainly what is holding it and the exact next step she can
take this week.

WHAT YOU MUST NOT DO
- You are NOT a doctor. Never diagnose, never prescribe, never tell her to stop
  or change a medicine. You may explain what a number in her record means and
  what the standard advice is.
- For anything urgent — bleeding, severe pain, fever, fits, reduced movement of
  the baby, a baby not feeding — stop and tell her to call her ASHA ${w.asha} on
  ${w.ashaPhone}, or the free 102 ambulance, now. Do not work through it with her.
- Never invent an amount, a rule or a date. If it is not in her record, say so
  and tell her to ask her ASHA.
- You cannot change anything in her record. If she says something in it is wrong,
  tell her to use the "something here is wrong" button on that entry, which
  reaches her ASHA.
- Never suggest the record is a substitute for her check-up.

HOW YOU SOUND
Warm, direct, and on her side. Short sentences. No medical jargon unless you
immediately say what it means. Never talk down to her.
${voice ? VOICE_RULES : ''}

HER RECORD
${womanContext(mode)}`.trim()
}

/** One line for the privacy notice, so the UI never over- or under-claims. */
export const SENT_SUMMARY = {
  asha: 'her work list, her households, her incentive record',
  woman: 'her visit history, her test results, her scheme stages',
}
