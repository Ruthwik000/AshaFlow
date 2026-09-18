/* One place that knows what is configured. Every screen asks here rather than
   reading import.meta.env directly, so the "not configured" path is uniform. */

const env = import.meta.env || {}

/** People paste keys with quotes, spaces or a trailing newline. Strip them. */
const clean = v => String(v ?? '').trim().replace(/^['"]|['"]$/g, '').trim()

/* -------------------------------------------------------------------------
   Two services answer to the name "grok", and they are not the same company.

     xAI   — console.x.ai,     keys begin  xai-
     Groq  — console.groq.com, keys begin  gsk_

   A Groq key sent to api.x.ai comes back "400 Incorrect API key provided",
   which reads like a bad key and is really a bad address. So the key tells us
   where to send it, and the model names follow from that.
   ------------------------------------------------------------------------- */

const FAST_KEY = clean(env.VITE_GROK_API_KEY) || clean(env.VITE_GROQ_API_KEY)

function detectService(key) {
  const forced = clean(env.VITE_GROK_PROVIDER).toLowerCase()
  if (forced === 'groq' || forced === 'xai') return forced
  if (/^gsk_/i.test(key)) return 'groq'
  if (/^xai-/i.test(key)) return 'xai'
  return key ? 'xai' : null              // unknown shape: keep the old behaviour
}

const SERVICE = detectService(FAST_KEY)

const SERVICES = {
  xai: {
    label: 'Grok (xAI)', console: 'console.x.ai', prefix: 'xai-',
    base: 'https://api.x.ai/v1',
    chat: ['grok-2-latest', 'grok-beta'],
    vision: ['grok-2-vision-1212', 'grok-vision-beta'],
  },
  groq: {
    label: 'Groq', console: 'console.groq.com', prefix: 'gsk_',
    base: 'https://api.groq.com/openai/v1',
    chat: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'groq/compound', 'llama-3.3-70b-versatile'],
    vision: [],
  },
}

/* A model name configured for one service is meaningless on the other, so an
   xAI model name is ignored when the key turns out to be a Groq key. */
const fits = (service, name) =>
  !!name && (service === 'groq' ? !/^grok-/i.test(name) : !/^(llama|meta-llama|mixtral|gemma|openai|qwen)/i.test(name))

function models(service, configured, kind) {
  const spec = SERVICES[service]
  if (!spec) return []
  const list = [...spec[kind]]
  if (fits(service, configured)) list.unshift(configured)
  return [...new Set(list)]
}

const fastConfiguredChat = clean(env.VITE_GROK_MODEL) || clean(env.VITE_GROQ_MODEL)
const fastConfiguredVision = clean(env.VITE_GROK_VISION_MODEL) || clean(env.VITE_GROQ_VISION_MODEL)
const fastSpec = SERVICE ? SERVICES[SERVICE] : null
const fastChat = models(SERVICE, fastConfiguredChat, 'chat')
const fastVision = models(SERVICE, fastConfiguredVision, 'vision')

export const AI = {
  proxy: clean(env.VITE_AI_PROXY).replace(/\/$/, ''),
  gemini: {
    key: clean(env.VITE_GEMINI_API_KEY),
    model: clean(env.VITE_GEMINI_MODEL) || 'gemini-3.6-flash',
    vision: clean(env.VITE_GEMINI_VISION_MODEL) || clean(env.VITE_GEMINI_MODEL) || 'gemini-3.6-flash',
  },
  grok: {
    key: FAST_KEY,
    service: SERVICE,
    label: fastSpec?.label || 'Grok / Groq',
    console: fastSpec?.console || 'the provider console',
    base: fastSpec?.base || SERVICES.xai.base,
    // first name is tried first; the rest are tried if it is not available
    models: fastChat,
    visionModels: fastVision,
    model: fastChat[0] || (SERVICE === 'groq' ? 'openai/gpt-oss-120b' : 'grok-2-latest'),
    vision: fastVision[0] || (SERVICE === 'groq' ? null : 'grok-2-vision-1212'),
    hasVision: SERVICE === 'xai',
    ignoredModel: SERVICE && fastConfiguredChat && !fits(SERVICE, fastConfiguredChat)
      ? fastConfiguredChat : null,
    ignoredVision: SERVICE && fastConfiguredVision && !fits(SERVICE, fastConfiguredVision)
      ? fastConfiguredVision : null,
  },
}

export const hasProxy = () => !!AI.proxy
export const hasGemini = () => hasProxy() || !!AI.gemini.key
export const hasGrok = () => hasProxy() || !!AI.grok.key
export const hasOCR = () => hasGemini() || (hasGrok() && AI.grok.hasVision)
export const hasAnyChat = () => hasGemini() || hasGrok()

/** Enough about a key to debug it, without printing the key. */
export function keyShape(key) {
  if (!key) return { present: false }
  return {
    present: true,
    length: key.length,
    prefix: key.slice(0, 4),
    suffix: key.slice(-4),
    looksQuoted: /^['"]|['"]$/.test(String(env.VITE_GROK_API_KEY ?? env.VITE_GROQ_API_KEY ?? '')),
    hasSpace: /\s/.test(key),
  }
}

export function providerStatus() {
  if (hasProxy()) return [{ id: 'proxy', label: 'Your backend', state: 'on', note: AI.proxy }]
  return [
    { id: 'gemini', label: 'Gemini', state: AI.gemini.key ? 'on' : 'off',
      note: AI.gemini.key ? `${AI.gemini.model} · chat first, OCR vision` : 'no key in .env' },
    { id: 'grok', label: AI.grok.label, state: AI.grok.key ? 'on' : 'off',
      note: AI.grok.key ? `${AI.grok.model} · ultra-fast chat (~500 tps)` : 'no key in .env' },
    { id: 'local', label: 'Offline engine', state: 'on',
      note: 'always available — reads her record, needs no network' },
  ]
}

/* ------------------------------------------------------------ diagnostics */

/** Turn a raw failure into something a person can act on. */
export function explain(provider, err) {
  const raw = String(err?.message || err || '')
  const s = raw.toLowerCase()

  if (/failed to fetch|networkerror|load failed/.test(s)) return {
    kind: 'network',
    title: 'Could not reach the server',
    fix: 'No internet, or the browser blocked the request. Check the connection and try again.',
  }
  if (/abort/.test(s)) return {
    kind: 'timeout', title: 'The request timed out',
    fix: 'The photograph may be large, or the connection slow. Try again on a better signal.',
  }
  if (/\b401\b|\b403\b|incorrect api key|invalid.?api.?key|api key not valid|unauthor|permission denied/.test(s)
      || (/\b400\b/.test(s) && /api key/.test(s))) return {
    kind: 'auth',
    title: `${provider} rejected the key`,
    fix: [
      'The code reached the server, so the wiring is fine — the key itself was refused. Check, in order:',
      '1. Restart the dev server. Vite reads .env only at startup, so a key added while it was running is not in the page yet. Stop it and run npm run dev again.',
      '2. The file must be called .env in the project root, next to package.json — not .env.txt, not inside src/.',
      '3. The line must have no quotes and no spaces around the =.',
      `4. Check which service the key belongs to. An xAI key begins xai- and comes from console.x.ai; a Groq key begins gsk_ and comes from console.groq.com. They are different companies and each rejects the other's key. This build read yours as ${AI.grok.service || 'none'} and is calling ${AI.grok.base}.`,
    ].join('\n'),
  }
  if (/\b429\b|rate.?limit|quota|exceeded/.test(s)) return {
    kind: 'quota', title: `${provider} is rate limiting or out of credit`,
    fix: 'Wait a moment and try again, or check the billing and usage on the provider console.',
  }
  if (/\b404\b|model.*not.*(found|exist)|unknown model|does not exist/.test(s)) return {
    kind: 'model',
    title: 'That model name is not available to this key',
    fix: `Model names change, and they differ between services. This build is calling ${AI.grok.label} and will try ${AI.grok.visionModels.join(', ')} for OCR. Set VITE_GROK_VISION_MODEL (or VITE_GROK_MODEL / VITE_GEMINI_MODEL) in .env to one your account can use, then restart the dev server.`,
  }
  if (/json|unexpected token|parse/.test(s)) return {
    kind: 'parse', title: 'The reply was not readable',
    fix: 'The model answered with something other than the JSON that was asked for. Try again, or use a clearer, straighter photograph.',
  }
  if (/\b5\d\d\b/.test(s)) return {
    kind: 'server', title: `${provider} had a server error`,
    fix: 'Their side, not yours. Try again in a minute.',
  }
  return { kind: 'unknown', title: `${provider} returned an error`, fix: raw.slice(0, 300) }
}
