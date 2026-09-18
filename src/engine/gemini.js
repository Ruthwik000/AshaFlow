// Gemini API client for the ASHAFlow assistant
// Uses the VITE_GEMINI_KEY from .env

const SYSTEM_PROMPT = `You are ASHAFlow Assistant — an AI assistant built into a health-worker app used by ASHA workers in rural India.

Your role:
- Answer questions about maternal health, immunisation schedules, government health schemes (JSY, JSSK, PMMVY, etc.)
- Explain field data — why a field was calculated a certain way, what an entry means
- Help with visit planning — which households to visit, what is overdue
- Assist with NHM incentive rules and claim processes
- Read uploaded PDF forms and explain their structure

Rules:
1. Be concise — ASHA workers read on small phones in bright sunlight
2. Use simple English or Hindi as the user prefers
3. When giving medical guidance, always add "confirm with your ANM or PHC doctor"
4. Never diagnose or prescribe
5. Reference NHM/MOHFW guidelines when relevant
6. If you don't know, say so — don't make up health information`

/**
 * Send a message to Gemini and stream the response.
 * @param {Array<{role: string, text: string}>} history - conversation history
 * @param {string} userMessage - the new user message
 * @param {function} onChunk - called with each text chunk as it streams
 * @returns {Promise<string>} - full response text
 */
export async function chatWithGemini(history, userMessage, onChunk) {
  const key = import.meta.env.VITE_GEMINI_KEY
  if (!key) {
    throw new Error('GEMINI_KEY_MISSING')
  }

  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'Understood. I am the ASHAFlow Assistant ready to help ASHA workers.' }] },
    ...history.map(m => ({
      role: m.role === 'u' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${key}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) throw new Error('INVALID_KEY')
    if (res.status === 429) throw new Error('RATE_LIMITED')
    throw new Error(`API_ERROR: ${res.status} ${errBody.slice(0, 200)}`)
  }

  // Stream SSE response
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          full += text
          onChunk?.(full)
        }
      } catch {
        // skip malformed JSON chunks
      }
    }
  }

  return full
}

/**
 * Check if the Gemini API key is configured.
 */
export function hasGeminiKey() {
  return !!(import.meta.env.VITE_GEMINI_KEY)
}
