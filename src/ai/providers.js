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

/* ------------------------------------------------------- key self-tests */

/** Ask each provider whether the key is good, without spending a generation. */
export async function testGemini() {
  if (hasProxy()) { await req(`${AI.proxy}/health`, { method: 'GET', ms: 8000 }); return { models: ['via proxy'] } }
  const j = await req(`https://generativelanguage.googleapis.com/v1beta/models?key=${AI.gemini.key}`,
    { method: 'GET', ms: 12000 })
  const models = (j.models || []).map(m => m.name?.replace('models/', '')).filter(Boolean)
  return { models, hasConfigured: models.includes(AI.gemini.model) }
}

export async function testGrok() {
  if (hasProxy()) { await req(`${AI.proxy}/health`, { method: 'GET', ms: 8000 }); return { models: ['via proxy'] } }
  const j = await req('https://api.x.ai/v1/models',
    { method: 'GET', headers: { Authorization: `Bearer ${AI.grok.key}` }, ms: 12000 })
  const models = (j.data || []).map(m => m.id).filter(Boolean)
  return {
    models,
    hasConfigured: models.includes(AI.grok.model),
    hasVision: models.includes(AI.grok.vision),
  }
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

/** Gemini vision reads a photographed form and returns its structure. */
export async function geminiVision({ prompt, dataUrl }) {
  if (hasProxy()) {
    const j = await post(`${AI.proxy}/ocr`, { provider: 'gemini', prompt, image: dataUrl }, {}, 45000)
    return j.text
  }
  const match = (dataUrl || '').match(/^data:([^;]+);base64,(.+)$/)
  const mimeType = match ? match[1] : 'image/jpeg'
  const base64Data = match ? match[2] : dataUrl

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI.gemini.model}:generateContent?key=${AI.gemini.key}`
  const j = await post(url, {
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        { text: prompt },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  }, {}, 45000)

  const text = j?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
  if (!text.trim()) throw new Error('gemini vision returned nothing')
  return text
}
