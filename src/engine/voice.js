/* =========================================================================
   Continuous voice conversation.

   Browser SpeechRecognition + speechSynthesis, driven as a loop:
       listen → transcribe → answer → speak → listen again
   so the person can keep talking without touching the phone. Barge-in is
   supported: speaking stops the moment she starts again.

   Availability varies by browser. Everything degrades to typing.
   ========================================================================= */

export const SR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

export const voiceSupported = () => !!SR && typeof window !== 'undefined' && 'speechSynthesis' in window

export const LOCALE = {
  en: 'en-IN', hi: 'hi-IN', te: 'te-IN', mr: 'mr-IN',
  bn: 'bn-IN', ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN',
  gu: 'gu-IN', pa: 'pa-IN', or: 'or-IN', as: 'as-IN', ur: 'ur-IN',
}

/** Words that end the conversation, per language. */
const STOP = /\b(stop|band karo|bas|enough|thank you|dhanyavaad|dhanyawad|chaalu|aagu|ఆపు|बंद करो|बस)\b/i

export function createVoiceAgent({ lang = 'en', onState, onPartial, onFinal, onError }) {
  const locale = LOCALE[lang] || 'en-IN'
  let rec = null
  let alive = false
  let speaking = false
  let state = 'idle'

  const set = s => { state = s; onState?.(s) }

  const pickVoice = () => {
    const vs = window.speechSynthesis.getVoices() || []
    return vs.find(v => v.lang === locale)
      || vs.find(v => v.lang?.startsWith(locale.split('-')[0]))
      || vs.find(v => v.lang?.startsWith('en'))
      || null
  }

  function listen() {
    if (!alive || speaking) return
    try {
      rec = new SR()
      rec.lang = locale
      rec.interimResults = true
      rec.continuous = false
      rec.maxAlternatives = 1

      let finalText = ''

      rec.onstart = () => set('listening')
      rec.onresult = e => {
        let interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript
          if (e.results[i].isFinal) finalText += t
          else interim += t
        }
        onPartial?.((finalText + interim).trim())
      }
      rec.onerror = ev => {
        if (ev.error === 'no-speech' || ev.error === 'aborted') return
        onError?.(ev.error)
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') stop()
      }
      rec.onend = () => {
        const said = finalText.trim()
        if (!alive) return set('idle')
        if (!said) { set('idle'); setTimeout(listen, 350); return }   // heard nothing, keep waiting
        if (STOP.test(said)) { onFinal?.(said, { stop: true }); stop(); return }
        set('thinking')
        onFinal?.(said, { stop: false })
      }
      rec.start()
    } catch (e) { onError?.(String(e)); stop() }
  }

  /** Speak a reply, then hand the turn back to her. */
  function speak(text, { thenListen = true } = {}) {
    if (!('speechSynthesis' in window)) { if (thenListen && alive) listen(); return }
    try {
      window.speechSynthesis.cancel()
      speaking = true
      set('speaking')
      const clean = String(text).replace(/\*\*/g, '').replace(/^[•○✓]\s*/gm, '')
      const u = new SpeechSynthesisUtterance(clean)
      u.lang = locale
      const v = pickVoice(); if (v) u.voice = v
      u.rate = 0.94
      const done = () => {
        speaking = false
        if (alive && thenListen) setTimeout(listen, 260)
        else set(alive ? 'idle' : 'idle')
      }
      u.onend = done
      u.onerror = done
      window.speechSynthesis.speak(u)
    } catch { speaking = false; if (alive && thenListen) listen() }
  }

  function start() { alive = true; set('listening'); listen() }

  function stop() {
    alive = false
    speaking = false
    try { rec?.abort() } catch {}
    try { window.speechSynthesis?.cancel() } catch {}
    set('idle')
  }

  /** She started talking over the reply — drop it and listen. */
  function bargeIn() {
    try { window.speechSynthesis?.cancel() } catch {}
    speaking = false
    if (alive) listen()
  }

  return { start, stop, speak, bargeIn, get state() { return state }, get alive() { return alive } }
}

/** One-shot read-aloud, used by the speaker buttons. */
export function speakOnce(text, lang = 'en') {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(String(text).replace(/\*\*/g, ''))
    u.lang = LOCALE[lang] || 'en-IN'
    u.rate = 0.92
    window.speechSynthesis.speak(u)
  } catch { /* speech is a nicety, never a dependency */ }
}
