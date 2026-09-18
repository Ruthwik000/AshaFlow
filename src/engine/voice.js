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

/** getVoices() is empty until the engine has loaded them. Wait, but not for ever. */
function voicesReady() {
  return new Promise(resolve => {
    try {
      if ((window.speechSynthesis.getVoices() || []).length) return resolve()
      let done = false
      const go = () => { if (!done) { done = true; resolve() } }
      window.speechSynthesis.addEventListener?.('voiceschanged', go, { once: true })
      window.speechSynthesis.onvoiceschanged = go
      setTimeout(go, 1200)
    } catch { resolve() }
  })
}

/** Chrome cuts an utterance off after about fifteen seconds, so send it in
 *  sentence-sized pieces and let them queue. */
function chunk(text, max = 180) {
  const out = []
  let buf = ''
  for (const part of String(text).split(/(?<=[.!?।])\s+|\n+/)) {
    if (!part.trim()) continue
    if ((buf + ' ' + part).trim().length > max) {
      if (buf) out.push(buf.trim())
      buf = part.length > max ? '' : part
      if (part.length > max) {
        for (let i = 0; i < part.length; i += max) out.push(part.slice(i, i + max))
      }
    } else buf = (buf ? buf + ' ' : '') + part
  }
  if (buf.trim()) out.push(buf.trim())
  return out.length ? out : [String(text)]
}

export function createVoiceAgent({ lang = 'en', onState, onPartial, onFinal, onError }) {
  const locale = LOCALE[lang] || 'en-IN'
  let rec = null
  let alive = false
  let speaking = false
  let state = 'idle'

  const set = s => { state = s; onState?.(s) }

  /* A voice for her language if the device has one, an English voice if not,
     and whatever the device offers rather than nothing at all. */
  const pickVoice = () => {
    const vs = window.speechSynthesis.getVoices() || []
    const base = locale.split('-')[0]
    return vs.find(v => v.lang?.replace('_', '-') === locale)
      || vs.find(v => v.lang?.replace('_', '-').startsWith(base + '-'))
      || vs.find(v => v.lang === base)
      || vs.find(v => v.lang?.startsWith('en-IN'))
      || vs.find(v => v.lang?.startsWith('en'))
      || vs.find(v => v.default)
      || vs[0]
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

  /** Speak a reply, then hand the turn back to her.
   *
   *  Chrome's speechSynthesis is full of traps, and every one of them ends
   *  the same way: the panel says "Speaking…" and nothing comes out.
   *    - cancel() followed synchronously by speak() drops the utterance
   *    - getVoices() is empty until the voiceschanged event has fired
   *    - a lang with no installed voice is silently ignored
   *    - anything past roughly fifteen seconds is cut off mid-sentence
   *    - the engine pauses itself and has to be resumed
   *  So: wait for the voices, pause after cancelling, speak in short pieces,
   *  keep resuming, and if nothing has started within two seconds, give the
   *  turn back rather than leaving her waiting on a dead panel.
   */
  function speak(text, { thenListen = true } = {}) {
    if (!('speechSynthesis' in window)) { if (thenListen && alive) listen(); return }

    const clean = String(text).replace(/\*\*/g, '').replace(/^[•○✓]\s*/gm, '').trim()
    if (!clean) { if (thenListen && alive) listen(); return }

    speaking = true
    set('speaking')

    const finish = () => {
      if (!speaking) return
      speaking = false
      clearInterval(keepAlive)
      if (alive && thenListen) setTimeout(listen, 260)
      else set('idle')
    }

    let keepAlive = null
    const pieces = chunk(clean)

    voicesReady().then(() => {
      if (!speaking) return
      try {
        window.speechSynthesis.cancel()
      } catch { /* nothing was speaking */ }

      // cancel() needs a tick to settle, or Chrome swallows what follows
      setTimeout(() => {
        if (!speaking) return
        const voice = pickVoice()
        let started = false
        let i = 0

        // Chrome pauses the engine on its own; nudging it is the known cure
        keepAlive = setInterval(() => {
          try {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
              window.speechSynthesis.resume()
            }
          } catch { /* ignore */ }
        }, 4000)

        const next = () => {
          if (!speaking) return
          if (i >= pieces.length) return finish()
          const u = new SpeechSynthesisUtterance(pieces[i++])
          u.lang = locale
          // a voice the engine will not accept must not silence the answer
          if (voice) { try { u.voice = voice; u.lang = voice.lang || locale } catch { /* default voice */ } }
          u.rate = 0.96
          u.onstart = () => { started = true }
          u.onend = next
          u.onerror = ev => {
            // "interrupted" and "canceled" are us stopping it on purpose
            if (ev?.error && ev.error !== 'interrupted' && ev.error !== 'canceled') {
              onError?.(`speech: ${ev.error}`)
            }
            next()
          }
          try { window.speechSynthesis.speak(u) } catch { next() }
        }

        next()

        /* If the first piece has not begun after two seconds the engine has
           silently refused it. Do not strand her in "Speaking…". */
        setTimeout(() => {
          if (!speaking || started) return
          try { window.speechSynthesis.cancel() } catch {}
          onError?.('This browser would not read the answer aloud — it is on the screen above.')
          finish()
        }, 2000)
      }, 120)
    })
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

/** One-shot read-aloud, used by the speaker buttons. Same traps, same care. */
export function speakOnce(text, lang = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const clean = String(text).replace(/\*\*/g, '').trim()
  if (!clean) return
  const locale = LOCALE[lang] || 'en-IN'

  voicesReady().then(() => {
    try { window.speechSynthesis.cancel() } catch {}
    setTimeout(() => {
      const vs = window.speechSynthesis.getVoices() || []
      const base = locale.split('-')[0]
      const voice = vs.find(v => v.lang?.replace('_', '-') === locale)
        || vs.find(v => v.lang?.replace('_', '-').startsWith(base + '-'))
        || vs.find(v => v.lang?.startsWith('en'))
        || vs.find(v => v.default) || vs[0] || null

      const pieces = chunk(clean)
      let i = 0
      const next = () => {
        if (i >= pieces.length) return
        const u = new SpeechSynthesisUtterance(pieces[i++])
        u.lang = locale
        if (voice) { try { u.voice = voice; u.lang = voice.lang || locale } catch { /* default voice */ } }
        u.rate = 0.94
        u.onend = next
        u.onerror = next
        try { window.speechSynthesis.speak(u) } catch { /* speech is a nicety */ }
      }
      next()
    }, 120)
  })
}
