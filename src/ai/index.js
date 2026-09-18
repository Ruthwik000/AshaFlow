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

  const chain = [
    hasGemini() && { id: 'gemini', fn: geminiChat },
    hasGrok() && { id: 'grok', fn: grokChat },
  ].filter(Boolean)

  const tried = []
  for (const p of chain) {
    try {
      const text = await p.fn({ system: GUARD, user })
      return { text: text.trim(), via: p.id, tried }
    } catch (e) {
      tried.push({ id: p.id, error: String(e.message || e).slice(0, 120) })
    }
  }
  return { failed: true, tried }
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

function parseFormJson(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Empty response from vision model')
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Vision model did not return a valid JSON object')
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1))
  if (!parsed?.sections?.length) throw new Error('No fields were read from the image')
  return parsed
}

export async function extractFormFromImage(dataUrl) {
  if (!hasOCR()) return { simulated: true }
  const prompt = OCR_PROMPT.replace('CANONICAL_PATHS', Object.keys(PATH_LABELS).join(', '))

  let grokErr = null

  // 1. Try Grok Vision first if available
  if (hasGrok()) {
    try {
      const raw = await grokVision({ prompt, dataUrl })
      const parsed = parseFormJson(raw)
      return { ...parsed, simulated: false, provider: 'grok' }
    } catch (e) {
      grokErr = e
      console.warn('Grok vision OCR failed, falling back to Gemini vision:', e)
    }
  }

  // 2. Fallback to Gemini Vision if available
  if (hasGemini()) {
    try {
      const raw = await geminiVision({ prompt, dataUrl })
      const parsed = parseFormJson(raw)
      return {
        ...parsed,
        simulated: false,
        provider: 'gemini',
        fallbackFrom: grokErr ? 'grok' : null,
        grokError: grokErr?.message,
      }
    } catch (e) {
      console.warn('Gemini vision OCR failed:', e)
      if (grokErr) {
        throw new Error(`Grok failed (${grokErr.message}); Gemini fallback also failed (${e.message})`)
      }
      throw e
    }
  }

  if (grokErr) throw grokErr
  return { simulated: true }
}

export { hasGemini, hasGrok, hasOCR, hasAnyChat }
