/* One place that knows what is configured. Every screen asks here rather than
   reading import.meta.env directly, so the "not configured" path is uniform. */

const env = import.meta.env || {}

export const AI = {
  proxy: (env.VITE_AI_PROXY || '').replace(/\/$/, ''),
  gemini: {
    key: env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_KEY || '',
    model: env.VITE_GEMINI_MODEL || 'gemini-2.0-flash',
  },
  grok: {
    key: env.VITE_GROK_API_KEY || '',
    model: env.VITE_GROK_MODEL || 'grok-2-latest',
    vision: env.VITE_GROK_VISION_MODEL || 'grok-2-vision-1212',
  },
}

export const hasProxy = () => !!AI.proxy
export const hasGemini = () => hasProxy() || !!AI.gemini.key
export const hasGrok = () => hasProxy() || !!AI.grok.key
export const hasOCR = () => hasGrok()
export const hasAnyChat = () => hasGemini() || hasGrok()

/** What to show the user about where answers are coming from. */
export function providerStatus() {
  if (hasProxy()) return [{ id: 'proxy', label: 'Your backend', state: 'on', note: AI.proxy }]
  return [
    { id: 'gemini', label: 'Gemini', state: AI.gemini.key ? 'on' : 'off',
      note: AI.gemini.key ? `${AI.gemini.model} · first choice for chat` : 'no key in .env' },
    { id: 'grok', label: 'Grok', state: AI.grok.key ? 'on' : 'off',
      note: AI.grok.key ? `${AI.grok.model} · chat fallback, and OCR` : 'no key in .env' },
    { id: 'local', label: 'Offline engine', state: 'on',
      note: 'always available — reads her record, needs no network' },
  ]
}
