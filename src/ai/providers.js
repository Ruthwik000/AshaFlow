import { AI, hasProxy } from './config'

const TIMEOUT = 20000

async function post(url, body, headers = {}, ms = TIMEOUT) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(url, {
      method: 'POST', signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 180)}`)
    return await r.json()
  } finally { clearTimeout(timer) }
}

/* ---------------------------------------------------------------- Gemini */
export async function geminiChat({ system, user }) {
  if (hasProxy()) {
    const j = await post(`${AI.proxy}/chat`, { provider: 'gemini', system, user })
    return j.text
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI.gemini.model}:generateContent?key=${AI.gemini.key}`
  const j = await post(url, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
  })
  const text = j?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
  if (!text.trim()) throw new Error('gemini returned nothing')
  return text
}

/* ------------------------------------------------------------------ Grok */
export async function grokChat({ system, user }) {
  if (hasProxy()) {
    const j = await post(`${AI.proxy}/chat`, { provider: 'grok', system, user })
    return j.text
  }
  const j = await post('https://api.x.ai/v1/chat/completions', {
    model: AI.grok.model,
    temperature: 0.2, max_tokens: 700,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  }, { Authorization: `Bearer ${AI.grok.key}` })
  const text = j?.choices?.[0]?.message?.content || ''
  if (!text.trim()) throw new Error('grok returned nothing')
  return text
}

/** Grok vision reads a photographed form and returns its structure. */
export async function grokVision({ prompt, dataUrl }) {
  if (hasProxy()) {
    const j = await post(`${AI.proxy}/ocr`, { prompt, image: dataUrl }, {}, 45000)
    return j.text
  }
  const j = await post('https://api.x.ai/v1/chat/completions', {
    model: AI.grok.vision,
    temperature: 0,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
        { type: 'text', text: prompt },
      ],
    }],
  }, { Authorization: `Bearer ${AI.grok.key}` }, 45000)
  const text = j?.choices?.[0]?.message?.content || ''
  if (!text.trim()) throw new Error('grok vision returned nothing')
  return text
}
