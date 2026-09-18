// Gemini client for the two assistants — the ASHA's and the woman's.
//
// Two credentials can appear in VITE_GEMINI_KEY, and they are NOT the same thing:
//
//   AIza…   a standard AI Studio API key. 39 characters. Works for both the
//           text endpoint and the Live voice socket, and does not expire.
//   AQ.…    an EPHEMERAL TOKEN, minted for the Live API. It is passed as
//           `access_token`, not `key`, it only opens a Live socket, and it
//           expires roughly half an hour after it is created.
//
// Getting these two confused is silent and confusing — the text chat returns a
// bare 403 — so the kind is detected once here and every caller is told which
// capabilities it actually has.

const LS_TOKEN = 'af.geminiToken'
const LS_MODEL = 'af.geminiModel'

/** A token pasted into Settings beats the build-time .env value. */
export function getKey() {
  let pasted = null
  try { pasted = localStorage.getItem(LS_TOKEN) } catch { /* private mode */ }
  return (pasted || import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY || '').trim()
}

export function setKey(value) {
  try {
    if (value) localStorage.setItem(LS_TOKEN, value.trim())
    else localStorage.removeItem(LS_TOKEN)
  } catch { /* private mode */ }
}

/** 'apiKey' | 'token' | 'unknown' | null */
export function keyKind(k = getKey()) {
  if (!k) return null
  if (k.startsWith('AIza')) return 'apiKey'
  if (k.startsWith('AQ.')) return 'token'
  return 'unknown'
}

/** What the credential in hand can actually do. */
export function capabilities() {
  const kind = keyKind()
  return {
    kind,
    key: getKey(),
    text: kind === 'apiKey' || kind === 'unknown',
    voice: kind !== null,
    // An ephemeral token dies mid-demo; the UI says so rather than showing a 403.
    expires: kind === 'token',
  }
}

export function hasGeminiKey() { return !!getKey() }

/* ------------------------------------------------------------------ text */

// The exact current flash model name moves; rather than pin one and break on a
// retirement, try a short list and remember whichever answers.
const MODEL_CANDIDATES = [
  import.meta.env.VITE_GEMINI_MODEL,
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
].filter(Boolean)

const rememberedModel = () => { try { return localStorage.getItem(LS_MODEL) } catch { return null } }
const rememberModel = m => { try { localStorage.setItem(LS_MODEL, m) } catch { /* ignore */ } }

function mapError(status, body) {
  if (status === 400 && /API key not valid|API_KEY_INVALID/i.test(body)) return 'INVALID_KEY'
  if (status === 400) return 'BAD_REQUEST'
  if (status === 401 || status === 403) return 'INVALID_KEY'
  if (status === 404) return 'MODEL_NOT_FOUND'
  if (status === 429) return 'RATE_LIMITED'
  if (status >= 500) return 'SERVER_ERROR'
  return 'API_ERROR'
}

/**
 * Send a message and stream the reply.
 *
 * @param {Array<{role:'u'|'a', text:string}>} history
 * @param {string} userMessage
 * @param {(soFar:string)=>void} onChunk   called with the cumulative text
 * @param {{system?:string, signal?:AbortSignal}} opts
 */
export async function chatWithGemini(history, userMessage, onChunk, opts = {}) {
  const { system, signal } = opts
  const cap = capabilities()

  if (!cap.key) throw new Error('GEMINI_KEY_MISSING')
  if (cap.kind === 'token') throw new Error('TOKEN_IS_VOICE_ONLY')

  const contents = [
    ...history.map(m => ({
      role: m.role === 'u' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  const body = JSON.stringify({
    contents,
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    generationConfig: { temperature: 0.6, topP: 0.95, maxOutputTokens: 1024 },
  })

  const order = [rememberedModel(), ...MODEL_CANDIDATES].filter(Boolean)
  const tried = new Set()
  let lastError = null

  for (const model of order) {
    if (tried.has(model)) continue
    tried.add(model)

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}` +
                `:streamGenerateContent?alt=sse&key=${encodeURIComponent(cap.key)}`

    let res
    try {
      res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal,
      })
    } catch (e) {
      if (e.name === 'AbortError') throw e
      throw new Error('NETWORK')
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const code = mapError(res.status, text)
      lastError = new Error(code)
      // Only a missing model is worth retrying with a different name.
      if (code === 'MODEL_NOT_FOUND') continue
      throw lastError
    }

    rememberModel(model)
    return await readStream(res, onChunk)
  }

  throw lastError || new Error('MODEL_NOT_FOUND')
}

async function readStream(res, onChunk) {
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = '', buffer = '', blockReason = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data || data === '[DONE]') continue
      let parsed
      try { parsed = JSON.parse(data) } catch { continue }

      const cand = parsed.candidates?.[0]
      for (const part of cand?.content?.parts || []) {
        if (part.text) { full += part.text; onChunk?.(full) }
      }
      if (parsed.promptFeedback?.blockReason) blockReason = parsed.promptFeedback.blockReason
      if (cand?.finishReason && !['STOP', 'MAX_TOKENS'].includes(cand.finishReason)) {
        blockReason = cand.finishReason
      }
    }
  }

  // A blocked or empty reply must not render as a silent empty bubble.
  if (!full) throw new Error(blockReason ? 'BLOCKED' : 'EMPTY_REPLY')
  return full
}

/** Plain words for every failure the two chat screens can hit. */
export function explainError(err) {
  switch (err?.message) {
    case 'GEMINI_KEY_MISSING':
      return 'No API key yet. Add VITE_GEMINI_KEY to .env, or paste a key under More → Settings.'
    case 'TOKEN_IS_VOICE_ONLY':
      return 'The key in .env is a Live-API ephemeral token (it starts with AQ.). It can run the voice agent, but not this text chat. For text, use an AI Studio key that starts with AIza.'
    case 'INVALID_KEY':
      return 'The key was rejected. If it starts with AQ. it is an ephemeral token and has probably expired — paste a fresh one under More → Settings.'
    case 'MODEL_NOT_FOUND':
      return 'No usable model answered. Set VITE_GEMINI_MODEL in .env to a model your key can reach.'
    case 'RATE_LIMITED':
      return 'Too many requests. Wait a moment and try again.'
    case 'BLOCKED':
      return 'The reply was withheld by the safety filter. Try asking it a different way.'
    case 'EMPTY_REPLY':
      return 'The model returned nothing. Try again.'
    case 'NETWORK':
      return 'Could not reach the server. Check the connection.'
    case 'SERVER_ERROR':
      return 'Google returned a server error. Try again in a moment.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
