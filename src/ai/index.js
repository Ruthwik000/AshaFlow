import { geminiChat, grokChat, grokVision, geminiVision } from './providers'
import { hasGemini, hasGrok, hasOCR, hasAnyChat } from './config'
import { PATH_LABELS } from '../data/canonical'

/* =========================================================================
   The fallback chain.

       chat:  Gemini  →  Grok  →  the offline engine
       OCR:   Grok vision  →  Gemini vision  →  a worked sample

   The offline engine is not a degraded mode. It reads her actual record and
   is the only path that works with no signal, which is most of the time in a
   village. A model is an enhancement on top of it, never a dependency.
   ========================================================================= */

const GUARD = `
You are a helper inside a community health app in rural India. You are speaking
to the beneficiary herself — a pregnant woman or a mother with an infant.

Rules you must not break:
- Answer ONLY from the RECORD and SCHEME FACTS given below. If the answer is
  not in them, say you cannot find it in her record and tell her to ask her ASHA.
- Never diagnose, never prescribe, never suggest a medicine or a dose.
- For anything urgent — bleeding, fits, the baby not moving, a baby not
  feeding, high fever — tell her to call 102 immediately and stop.
- Never invent a number, a date, an amount or a scheme rule.
- Short and plain. Six sentences at most. No markdown headings, no bullet
  characters other than "•". Speak the way a health worker speaks, not a form.
- Reply in the language named as REPLY LANGUAGE. If you are not fluent and
  accurate in it for health wording, reply in English instead.
`.trim()

function factSheet(ctx) {
  const L = []
  L.push(`Name: ${ctx.name}, age ${ctx.age}, ${ctx.village}, house ${ctx.house}`)
  L.push(`ASHA: ${ctx.asha} (${ctx.ashaPhone}). ANM: ${ctx.anm}. Centre: ${ctx.phc}`)
  if (ctx.mode === 'pregnant') {
    L.push(`Pregnant, about ${ctx.weeks} weeks. Expected delivery ${ctx.edd}. RCH ID ${ctx.rchId}`)
    if (ctx.hb != null) L.push(`Last haemoglobin ${ctx.hb} g/dL (under 11 is anaemia in pregnancy)`)
    if (ctx.bp) L.push(`Last blood pressure ${ctx.bp}`)
    if (ctx.weight != null) L.push(`Last weight ${ctx.weight} kg`)
    L.push(`ANC visits completed ${ctx.ancDone ?? 0}. Due dates: ${ctx.anc.filter(Boolean).join(', ')}`)
    L.push(`Td dose 1 ${ctx.tt1 ? 'given' : 'not given'}${ctx.tt2Due ? `, dose 2 due ${ctx.tt2Due}` : ''}`)
    if (ctx.ifa) L.push(`IFA tablets issued: ${ctx.ifa}`)
    if (ctx.highRisk) L.push(`Flagged high risk: ${ctx.riskReasons.join(', ')}`)
  } else {
    L.push(`Mother of ${ctx.babyName}, ${ctx.babyMonths} months, born ${ctx.babyDob}`)
    L.push(`Baby weight ${ctx.babyWeight} kg, birth weight ${ctx.babyBirthWeight} kg`)
    L.push(`Vaccine schedule from birth (weeks): ${ctx.vaccines.map(([n, w]) => `${n} at ${w}`).join('; ')}`)
  }
  L.push(`Next appointment: ${ctx.nextVisit.label} on ${ctx.nextVisit.date} at ${ctx.nextVisit.at}`)
  L.push(`Received so far ₹${ctx.paid}. Still to come ₹${ctx.owed}`)
  for (const s of ctx.schemes) {
    const stage = s.stages.find(x => x.state !== 'done')
    L.push(`Scheme ${s.short} (${s.name}): ${s.what} Amount: ${s.amount}. ` +
      (stage ? `Current step: ${stage.label}${stage.blocker ? ` — HELD UP: ${stage.blocker} FIX: ${stage.fix}` : ''}` : 'all steps complete'))
  }
  L.push(`Danger signs: ${ctx.danger.map(d => d.label).join('; ')}`)
  L.push(`Her record has ${ctx.timeline.length} entries; most recent "${ctx.timeline[0]?.title}" on ${ctx.timeline[0]?.date}`)
  return L.join('\n')
}

const LANG_NAME = { en: 'English', hi: 'Hindi', te: 'Telugu' }

/**
 * Ask a model, grounded in her record. Returns null when nothing is
 * configured or every provider fails — the caller then uses the local engine.
 */
export async function askModel(question, ctx, lang = 'en') {
  if (!hasAnyChat()) return null

  const user = [
    `REPLY LANGUAGE: ${LANG_NAME[lang] || 'English'}`,
    '', 'RECORD AND SCHEME FACTS:', factSheet(ctx),
    '', `HER QUESTION: ${question}`,
  ].join('\n')

  return runChat({ system: GUARD, user })
}

/** Gemini, then Grok, then tell the caller both refused. */
async function runChat({ system, user }) {
  const chain = [
    hasGemini() && { id: 'gemini', fn: geminiChat },
    hasGrok() && { id: 'grok', fn: grokChat },
  ].filter(Boolean)

  const tried = []
  for (const p of chain) {
    try {
      const text = await p.fn({ system, user })
      if (text && text.trim()) return { text: text.trim(), via: p.id, tried }
      tried.push({ id: p.id, error: 'empty reply' })
    } catch (e) {
      const msg = String(e.message || e)
      // the provider's own words, in the console and on the message, because
      // "unavailable" tells nobody what to change
      console.warn(`[ASHAFlow] ${p.id} could not answer: ${msg}`)
      tried.push({ id: p.id, error: msg.slice(0, 300) })
    }
  }
  return { failed: true, tried }
}

/* ================================================================ worker */

/* The worker is not the beneficiary. She is trained, she carries the register,
   and she asks two quite different kinds of question: "who is due today",
   which only her records can answer, and "how long does Aadhaar seeding take",
   which they cannot. The prompt keeps those two apart instead of refusing the
   second one. */
const ASHA_GUARD = `
You are the assistant inside ASHAFlow, an app used by an ASHA — an accredited
social health activist — in rural India. You are talking to the worker herself,
not to a patient. She is trained and she is in the field, often with one hand.

How to answer:
- Questions about HER OWN WORK — her families, a named person, who is due, her
  earnings, a stuck payment, what she has recorded — must be answered ONLY from
  the CASELOAD below. Never invent a name, a number, a date or an amount. If it
  is not there, say it is not in her records and say what would put it there.
- General questions — how a scheme works, a schedule, a definition, a procedure,
  what a form is for, or anything else she asks — answer them properly from what
  you know. Be useful. Begin such an answer with "General guidance:" and, where
  a rule varies by state or revision, say so and name where to verify it.
- Never diagnose a patient, never prescribe, never give a medicine or a dose.
  Clinical judgement is the ANM's and the doctor's.
- If a question describes a danger sign in a woman or a baby, say to refer now
  and call 102, and stop there.

How to write:
- Plain, direct, short. Six sentences at most unless she asked for a list.
- No markdown headings and no asterisks. A list uses "• " and nothing else.
- Numbers exactly as the caseload gives them.
- Reply in the language named as REPLY LANGUAGE. If you are not accurate in it
  for health wording, reply in English instead.
`.trim()

const BRIEF = `
She is listening to this answer, not reading it. Keep it under three sentences,
no lists, no numbers she cannot hold in her head. Say the single most useful
thing and stop.`.trim()

function ashaFactSheet(ctx) {
  const L = []
  const m = ctx.matrix
  L.push(`WORKER: ${ctx.asha.name} (${ctx.asha.id}), ${ctx.asha.village}, ${ctx.asha.block}, ${ctx.asha.district}. ANM ${ctx.asha.anm}. Centre ${ctx.asha.phc}. Today is ${new Date().toDateString()}.`)
  L.push(`CASELOAD: ${m.households} families, ${m.people} people, ${m.villages.length} villages (${m.villages.map(v => `${v.name} ${v.households}`).join(', ')}).`)
  L.push('COUNTS: ' + m.rows.map(r => `${r.label} ${r.n}`).join('; '))

  const t = ctx.tasks
  L.push(`OVERDUE (${t.late.length}): ` + (t.late.map(x => `${x.who} at ${x.where} — ${x.reason}, ${Math.abs(x.inDays)} days late`).join(' | ') || 'none'))
  L.push(`DUE TODAY (${t.dueToday.length}): ` + (t.dueToday.map(x => `${x.who} at ${x.where} — ${x.reason}`).join(' | ') || 'none'))
  L.push(`COMING UP: ` + (t.dueSoon.concat(t.planned).map(x => `${x.who} — ${x.reason}, ${x.when}`).join(' | ') || 'none'))

  L.push(`MONEY: earned this month ₹${ctx.money.thisMonth}; already paid ₹${ctx.money.paid}; unclaimed ₹${ctx.money.pending} over ${ctx.money.pendingCount} entries.`)
  L.push(`SYNC: ${ctx.sync.queued} visits queued, ${ctx.sync.visits} visits and ${ctx.sync.forms} forms on this phone.`)

  L.push('PEOPLE IN HER LIST:')
  for (const p of ctx.people.slice(0, 60)) L.push('  - ' + describeLine(p))
  if (ctx.people.length > 60) L.push(`  …and ${ctx.people.length - 60} more.`)

  if (ctx.blocked.length) {
    L.push('HELD-UP PAYMENTS:')
    for (const b of ctx.blocked) L.push(`  - ${b.who}: ${b.label} — ${b.phase}`)
  }
  if (ctx.proofTrouble.length) {
    L.push('DOCUMENTS MISSING OR MISMATCHED:')
    for (const p of ctx.proofTrouble) L.push(`  - ${p.who}: ${p.label} (${p.state})${p.issue ? ' — ' + p.issue : ''}`)
  }
  L.push('SCHEMES SHE WORKS WITH: ' + ctx.schemes.map(s => `${s.short} — ${s.note}`).join(' | '))
  return L.join('\n')
}

function describeLine(p) {
  const bits = [`${p.name}, ${p.age}, ${p.sex}, ${p.house} (${p.head}), ${p.village}: ${p.status}`]
  if (p.detail) bits.push(p.detail)
  if (p.schemes?.length) bits.push('schemes ' + p.schemes.map(s => `${s.label || s.scheme} [${s.phase}${s.state === 'blocked' ? ', HELD UP' : ''}]`).join(', '))
  if (p.tasks?.length) bits.push('due ' + p.tasks.map(t => t.reason).join('; '))
  return bits.join('; ')
}

/**
 * Ask a model as the worker's assistant, grounded in her caseload.
 * `brief` is set when the answer will be spoken aloud rather than read.
 */
export async function askAsha(question, ctx, lang = 'en', { brief = false } = {}) {
  if (!hasAnyChat()) return null
  if (!ctx) return null

  const user = [
    `REPLY LANGUAGE: ${LANG_NAME[lang] || 'English'}`,
    '', 'CASELOAD (her own records, the only source for anything about her work):',
    ashaFactSheet(ctx),
    '', `HER QUESTION: ${question}`,
  ].join('\n')

  return runChat({ system: brief ? ASHA_GUARD + '\n\n' + BRIEF : ASHA_GUARD, user })
}

/* ----------------------------------------------------------------- OCR */

const OCR_PROMPT = `
This is a photograph of an Indian government health form, possibly handwritten
or partly filled. Read it and return ONLY a JSON object, no prose and no code
fence, shaped exactly like this:

{
  "name": "form title as printed",
  "issuedBy": "issuing department if printed, else empty string",
  "language": "en|hi|te|other",
  "sections": [
    { "title": "section heading, or 'Details' if the form has none",
      "fields": [
        { "label": "the printed field label, verbatim",
          "type": "text|number|date|boolean|choice",
          "required": true,
          "value": "the handwritten value if one is filled in, else empty string",
          "maps": "one canonical path from the list below, or empty string if none fits",
          "confidence": 0.0 }
      ] }
  ]
}

Rules:
- Every field must be one that is actually printed on the form. Never invent one.
- "confidence" is your confidence in reading that label, 0 to 1.
- "maps" must be exactly one of these canonical paths, or empty:
CANONICAL_PATHS
`.trim()

/** A model may wrap JSON in a fence or add a sentence around it. Dig it out. */
function parseFormJson(raw) {
  const cleaned = String(raw).replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('the reply contained no JSON')
  const parsed = JSON.parse(cleaned.slice(start, end + 1))
  if (!parsed?.sections?.length) throw new Error('no fields were read from the image')
  return parsed
}

/**
 * Read a photographed form. Grok vision first, Gemini vision second.
 * Either can be the only key present — OCR works with whichever is there.
 */
export async function extractFormFromImage(dataUrl) {
  if (!hasOCR()) return { simulated: true }
  const prompt = OCR_PROMPT.replace('CANONICAL_PATHS', Object.keys(PATH_LABELS).join(', '))

  const chain = [
    hasGrok() && AI.grok.hasVision && { id: AI.grok.label, fn: grokVision },
    hasGemini() && { id: 'Gemini', fn: geminiVision },
  ].filter(Boolean)

  const tried = []
  for (const p of chain) {
    try {
      const parsed = parseFormJson(await p.fn({ prompt, dataUrl }))
      return { ...parsed, simulated: false, via: p.id, tried }
    } catch (e) {
      tried.push({ id: p.id, error: e })
    }
  }

  // every provider failed — surface the first one's reason, and note the rest
  const err = new Error(String(tried[0]?.error?.message || tried[0]?.error || 'OCR failed'))
  err.tried = tried
  err.provider = tried[0]?.id
  throw err
}

export { hasGemini, hasGrok, hasOCR, hasAnyChat }
