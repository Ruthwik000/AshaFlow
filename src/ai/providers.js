import { AI, hasProxy } from './config'

const TIMEOUT = 20000

async function req(url, { method = 'POST', body, headers = {}, ms = TIMEOUT } = {}) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(url, {
      method, signal: ctl.signal,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const text = await r.text()
    if (!r.ok) {
      // keep the provider's own words — explain() reads them to classify the failure
      let detail = text.slice(0, 220)
      try { const j = JSON.parse(text); detail = j.error?.message || j.error || detail } catch {}
      throw new Error(`${r.status} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`)
    }
    return text ? JSON.parse(text) : {}
  } finally { clearTimeout(timer) }
}

const post = (url, body, headers, ms) => req(url, { body, headers, ms })

const sleep = ms => new Promise(r => setTimeout(r, ms))

/* 503 and 429 are the provider being busy, not the request being wrong. The
   model is there; it is just loaded right now. Waiting a moment costs less
   than falling through to a worse model or to the offline engine. */
const isBusy = e => /\b(503|502|504|429)\b|overload|unavailable|try again later|rate.?limit/i
  .test(String(e?.message || e))

/** Retry a busy provider a couple of times, backing off. */
async function patiently(call, tries = 3) {
  let last = null
  for (let i = 0; i < tries; i++) {
    try { return await call() } catch (e) {
      if (!isBusy(e)) throw e
      last = e
      if (i < tries - 1) await sleep(600 * (i + 1))
    }
  }
  throw last
}

/* A 400 is the request, not the key and not the model — some optional field
   this model will not take. Providers differ on max_tokens vs
   max_completion_tokens, on response_format, even on temperature for some
   models. Rather than guess which, send the request again with nothing but the
   model and the messages: if that works, the answer is still correct. */
const isBadRequest = e => /\b400\b/.test(String(e?.message || e))

async function postChat(body, headers, ms) {
  try {
    return await post(`${AI.grok.base}/chat/completions`, body, headers, ms)
  } catch (e) {
    if (!isBadRequest(e)) throw e
    console.warn(`[ASHAFlow] ${AI.grok.label} refused the request — retrying with only ` +
                 `model and messages. Its words: ${e.message}`)
    return post(`${AI.grok.base}/chat/completions`,
      { model: body.model, messages: body.messages }, headers, ms)
  }
}

/* =========================================================================
   Which model to call.

   A hardcoded model name is a time bomb. Providers rename and retire them, the
   call then answers 404, and the app looks broken when nothing about it has
   changed — which is exactly what happened to gemini-2.0-flash and to the
   llama-3.x names on Groq.

   So the names are not hardcoded any more. Each provider is asked what this
   key can actually use, and the best match is chosen from that list by a
   preference order. A name that 404s is remembered as dead and the next one
   is used, so one retirement costs one wasted request, once.
   ========================================================================= */

/** Newest and cheapest first; the first live match wins. */
const PREFER = {
  gemini: [/^gemini-3\.6-flash$/, /^gemini-3\.8-flash$/, /^gemini-flash-latest$/, /^gemini-3[\d.]*-flash/, /-flash$/, /flash/, /./],
  xai:    [/^grok-[4-9]/, /^grok-3/, /^grok-2-latest$/, /^grok-2/, /grok/, /./],
  groq:   [/^openai\/gpt-oss-120b$/, /gpt-oss-120b/, /^openai\/gpt-oss-20b$/, /gpt-oss/, /qwen3\.8-27b/, /compound/, /./],
}

/** Vision is a different shortlist only where a provider separates the two. */
const PREFER_VISION = {
  gemini: PREFER.gemini,
  xai:    [/vision/, /^grok-[4-9]/, /./],
  groq:   [], // Groq account only has text/audio models
}

/** Never pick one of these for chat or for reading a form. */
const NOT_A_CHAT_MODEL =
  /whisper|tts|speech|embed|embedding|guard|moderat|rerank|imagen|veo|image-generation|-aqa$|prompt-guard/i

const seen = {}            // provider → Promise<string[]> of live ids, once per session
const dead = new Set()     // ids this key was told do not exist

async function liveModels(provider) {
  if (seen[provider]) return seen[provider]
  seen[provider] = (async () => {
    if (provider === 'gemini') {
      const j = await req(`https://generativelanguage.googleapis.com/v1beta/models?key=${AI.gemini.key}`,
        { method: 'GET', ms: 12000 })
      return (j.models || [])
        .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
        .map(m => String(m.name || '').replace(/^models\//, ''))
        .filter(Boolean)
    }
    const j = await req(`${AI.grok.base}/models`,
      { method: 'GET', headers: { Authorization: `Bearer ${AI.grok.key}` }, ms: 12000 })
    return (j.data || []).map(m => m.id).filter(Boolean)
  })().catch(e => { seen[provider] = null; throw e })
  return seen[provider]
}

function choose(ids, prefs, configured) {
  const usable = ids.filter(id => !dead.has(id) && !NOT_A_CHAT_MODEL.test(id))
  if (configured && usable.includes(configured)) return configured
  for (const re of prefs) {
    const hit = usable.find(id => re.test(id))
    if (hit) return hit
  }
  return null
}

/**
 * The model to call now. Asks the provider what exists; falls back to the
 * configured guesses if that listing itself cannot be reached.
 */
export async function resolveModel(provider, kind = 'chat') {
  const isGemini = provider === 'gemini'
  const service = isGemini ? 'gemini' : (AI.grok.service || 'xai')
  const prefs = (kind === 'vision' ? PREFER_VISION : PREFER)[service] || PREFER.xai
  const configured = isGemini
    ? (kind === 'vision' ? AI.gemini.vision : AI.gemini.model)
    : (kind === 'vision' ? AI.grok.vision : AI.grok.model)

  try {
    const picked = choose(await liveModels(provider), prefs, configured)
    if (picked) return picked
  } catch { /* the listing failed — fall through to the configured guesses */ }

  const guesses = isGemini
    ? [AI.gemini.vision, AI.gemini.model]
    : (kind === 'vision' ? AI.grok.visionModels : AI.grok.models)
  return guesses.find(m => m && !dead.has(m)) || guesses[0]
}

const isMissingModel = e => /\b404\b|model.*(not|does not).*(found|exist)|unknown model|decommission|no longer supported/i
  .test(String(e?.message || e))

/**
 * Call with the resolved model, and if the provider says that name does not
 * exist, strike it off and try the next. Anything that is not a model problem
 * throws straight through, so a bad key still reports as a bad key.
 */
async function withModel(provider, kind, call) {
  let last = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const model = await resolveModel(provider, kind)
    if (!model) break
    try { return await call(model) } catch (e) {
      if (isBusy(e) || !isMissingModel(e)) throw e
      dead.add(model)
      last = e
    }
  }
  throw last || new Error('no usable model for this key')
}

/** Diagnostics: what the app will actually call, and what the key can see. */
export async function modelReport() {
  const out = {}
  for (const p of ['gemini', 'grok']) {
    const key = p === 'gemini' ? AI.gemini.key : AI.grok.key
    if (!key) { out[p] = { key: false }; continue }
    try {
      const ids = await liveModels(p)
      out[p] = {
        key: true, count: ids.length,
        chat: await resolveModel(p, 'chat'),
        vision: await resolveModel(p, 'vision'),
        ids,
      }
    } catch (e) { out[p] = { key: true, error: String(e.message || e).slice(0, 180) } }
  }
  return out
}

/* ------------------------------------------------------- key self-tests */

/** Ask each provider whether the key is good, without spending a generation. */
export async function testGemini() {
  if (hasProxy()) { await req(`${AI.proxy}/health`, { method: 'GET', ms: 8000 }); return { models: ['via proxy'] } }
  const j = await req(`https://generativelanguage.googleapis.com/v1beta/models?key=${AI.gemini.key}`,
    { method: 'GET', ms: 12000 })
  const models = (j.models || []).map(m => m.name?.replace('models/', '')).filter(Boolean)
  const willUseChat = await resolveModel('gemini', 'chat')
  const willUseVision = await resolveModel('gemini', 'vision')
  return { models, willUseChat, willUseVision, hasConfigured: !!willUseChat, hasVision: !!willUseVision }
}

export async function testGrok() {
  if (hasProxy()) { await req(`${AI.proxy}/health`, { method: 'GET', ms: 8000 }); return { models: ['via proxy'] } }
  const j = await req(`${AI.grok.base}/models`,
    { method: 'GET', headers: { Authorization: `Bearer ${AI.grok.key}` }, ms: 12000 })
  const models = (j.data || []).map(m => m.id).filter(Boolean)
  const willUseChat = await resolveModel('grok', 'chat')
  const willUseVision = await resolveModel('grok', 'vision')
  return {
    models, service: AI.grok.label, base: AI.grok.base,
    willUseChat, willUseVision,
    hasConfigured: !!willUseChat, hasVision: !!willUseVision,
  }
}

/* ---------------------------------------------------------------- Gemini */
export async function geminiChat({ system, user }) {
  if (hasProxy()) {
    const j = await post(`${AI.proxy}/chat`, { provider: 'gemini', system, user })
    return j.text
  }
  return withModel('gemini', 'chat', model => patiently(async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${AI.gemini.key}`
    const j = await post(url, {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    })
    const text = j?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
    if (!text.trim()) throw new Error('gemini returned nothing')
    return text
  }))
}

/* ------------------------------------------------------------------ Grok */
export async function grokChat({ system, user }) {
  if (hasProxy()) {
    const j = await post(`${AI.proxy}/chat`, { provider: 'grok', system, user })
    return j.text
  }
  return withModel('grok', 'chat', model => patiently(async () => {
    const j = await postChat({
      model,
      temperature: 0.2,
      max_completion_tokens: 700,      // max_tokens is refused by some newer models
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }, { Authorization: `Bearer ${AI.grok.key}` })
    const text = j?.choices?.[0]?.message?.content || ''
    if (!text.trim()) throw new Error(`${AI.grok.label} returned nothing`)
    return text
  }))
}

/** Split a data: URL into the parts an inline-image request needs. */
export function splitDataUrl(dataUrl) {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(String(dataUrl) || '')
  if (!m) throw new Error('that image could not be read')
  return { mime: m[1] || 'image/jpeg', base64: m[3] }
}

/** Gemini vision — the OCR fallback when Grok is unavailable. */
export async function geminiVision({ prompt, dataUrl }) {
  if (hasProxy()) {
    const j = await post(`${AI.proxy}/ocr`, { provider: 'gemini', prompt, image: dataUrl }, {}, 45000)
    return j.text
  }
  const { mime, base64 } = splitDataUrl(dataUrl)
  return withModel('gemini', 'vision', model => patiently(async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${AI.gemini.key}`
    const j = await post(url, {
      contents: [{
        role: 'user',
        parts: [{ inline_data: { mime_type: mime, data: base64 } }, { text: prompt }],
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 2400, responseMimeType: 'application/json' },
    }, {}, 45000)
    const text = j?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
    if (!text.trim()) throw new Error('gemini vision returned nothing')
    return text
  }), 2)
}

/** Grok vision reads a photographed form and returns its structure. */
export async function grokVision({ prompt, dataUrl }) {
  if (hasProxy()) {
    const j = await post(`${AI.proxy}/ocr`, { prompt, image: dataUrl }, {}, 45000)
    return j.text
  }
  return withModel('grok', 'vision', model => patiently(async () => {
    const j = await postChat({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
          { type: 'text', text: prompt },
        ],
      }],
    }, { Authorization: `Bearer ${AI.grok.key}` }, 45000)
    const text = j?.choices?.[0]?.message?.content || ''
    if (!text.trim()) throw new Error(`${AI.grok.label} vision returned nothing`)
    return text
  }), 2)
}
