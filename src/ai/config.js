/* One place that knows what is configured. Every screen asks here rather than
   reading import.meta.env directly, so the "not configured" path is uniform. */

const env = import.meta.env || {}

/** People paste keys with quotes, spaces or a trailing newline. Strip them. */
const clean = v => String(v ?? '').trim().replace(/^['"]|['"]$/g, '').trim()

export const AI = {
  proxy: clean(env.VITE_AI_PROXY).replace(/\/$/, ''),
  gemini: {
    key: clean(env.VITE_GEMINI_API_KEY),
    model: clean(env.VITE_GEMINI_MODEL) || 'gemini-2.0-flash',
  },
  grok: {
    key: clean(env.VITE_GROK_API_KEY),
    model: clean(env.VITE_GROK_MODEL) || 'grok-2-latest',
    vision: clean(env.VITE_GROK_VISION_MODEL) || 'grok-2-vision-1212',
  },
}

export const hasProxy = () => !!AI.proxy
export const hasGemini = () => hasProxy() || !!AI.gemini.key
export const hasGrok = () => hasProxy() || !!AI.grok.key
export const hasOCR = () => hasProxy() || hasGrok() || hasGemini()
export const hasAnyChat = () => hasGemini() || hasGrok()

/** Enough about a key to debug it, without printing the key. */
export function keyShape(key) {
  if (!key) return { present: false }
  return {
    present: true,
    length: key.length,
    prefix: key.slice(0, 4),
    suffix: key.slice(-4),
    looksQuoted: /^['"]|['"]$/.test(String(env.VITE_GROK_API_KEY ?? '')),
    hasSpace: /\s/.test(key),
  }
}

export function providerStatus() {
  if (hasProxy()) return [{ id: 'proxy', label: 'Your backend', state: 'on', note: AI.proxy }]
  return [
    { id: 'gemini', label: 'Gemini', state: AI.gemini.key ? 'on' : 'off',
      note: AI.gemini.key ? `${AI.gemini.model} · first choice for chat · OCR fallback` : 'no key in .env' },
    { id: 'grok', label: 'Grok', state: AI.grok.key ? 'on' : 'off',
      note: AI.grok.key ? `${AI.grok.model} · chat fallback · primary OCR` : 'no key in .env' },
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
      '3. The line must be VITE_GROK_API_KEY=xai-... with no quotes and no spaces around the =.',
      '4. Confirm the key is an API key from console.x.ai, not a team or management key, and that it has not been revoked.',
    ].join('\n'),
  }
  if (/\b429\b|rate.?limit|quota|exceeded/.test(s)) return {
    kind: 'quota', title: `${provider} is rate limiting or out of credit`,
    fix: 'Wait a moment and try again, or check the billing and usage on the provider console.',
  }
  if (/\b404\b|model.*not.*(found|exist)|unknown model|does not exist/.test(s)) return {
    kind: 'model',
    title: 'That model name is not available to this key',
    fix: 'Model names change. Set VITE_GROK_VISION_MODEL (or VITE_GROK_MODEL / VITE_GEMINI_MODEL) in .env to one your account can use, then restart the dev server.',
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
