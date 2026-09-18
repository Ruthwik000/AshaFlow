// One voice agent, two engines behind it.
//
//   Gemini Live   a WebSocket carrying real audio both ways. The model hears her
//                 voice, decides when she has finished, and answers in its own
//                 voice. Genuine Telugu, Hindi and English. Needs a key and a
//                 connection.
//
//   Browser voice SpeechRecognition + speechSynthesis driving the local rules
//                 engine in engine/assistant.js. No key, no bandwidth, but the
//                 recogniser is Chrome-only and weaker on Indian languages, and
//                 the answers come from the rule bank rather than a model.
//
// Live is tried first and the browser engine catches it when there is no key,
// no signal, or the socket will not open — which on a venue wifi is most of the
// reasons a demo fails. The caller is told which engine it ended up on, because
// a health worker should be able to see whether she is talking to the model or
// to the offline fallback.

import { LiveSession, explainLiveError } from './live'
import { createVoiceAgent, voiceSupported } from './voice'
import { capabilities } from './gemini'

/**
 * @param {object} o
 * @param {string} o.lang                     'en' | 'hi' | 'te'
 * @param {(lang:string)=>string} o.systemFor  system instruction for the Live engine
 * @param {(q:string)=>{text:string}} o.localAnswer  answer for the fallback engine
 * @param {(s:string)=>void} o.onState        'connecting'|'listening'|'speaking'|'thinking'|'closed'
 * @param {(t:string)=>void} o.onPartial      what she is saying, as it is heard
 * @param {(m:{role:'u'|'a',text:string,extra?:object})=>void} o.onTurn  a finished turn
 * @param {(engine:'live'|'browser'|null, note?:string)=>void} o.onEngine
 * @param {(msg:string)=>void} o.onError
 */
export function createHybridVoiceAgent(o) {
  let engine = null      // 'live' | 'browser'
  let live = null
  let browser = null
  let stopped = false

  const fail = msg => { o.onError?.(msg); o.onState?.('closed'); o.onEngine?.(null) }

  async function startLive() {
    const s = new LiveSession({
      system: o.systemFor(o.lang),
      lang: o.lang,
      onState: st => { if (!stopped) o.onState?.(st) },
      onUserText: (text, final) => {
        if (final) { o.onPartial?.(''); o.onTurn?.({ role: 'u', text }) }
        else o.onPartial?.(text)
      },
      onAgentText: (text, final) => { if (final) o.onTurn?.({ role: 'a', text }) },
      onError: code => {
        // The microphone is needed by both engines, so there is nothing to fall
        // back to; and an expired key is worth saying out loud rather than
        // silently dropping to the weaker engine.
        if (code === 'MIC_DENIED') return fail(explainLiveError(code))
        if (engine === 'live') return fail(explainLiveError(code))
        startBrowser(explainLiveError(code))
      },
    })
    live = s
    const ok = await s.start()
    if (ok) { engine = 'live'; o.onEngine?.('live') }
    return ok
  }

  function startBrowser(why) {
    live = null
    if (!voiceSupported()) {
      return fail(why
        ? `${why} This browser cannot listen either, so please type instead.`
        : 'This browser cannot listen. Chrome on Android works; you can still type.')
    }
    const a = createVoiceAgent({
      lang: o.lang,
      onState: st => { if (!stopped) o.onState?.(st === 'idle' ? 'listening' : st) },
      onPartial: o.onPartial,
      onError: e => {
        if (e === 'not-allowed' || e === 'service-not-allowed') {
          fail('The microphone was blocked. Allow it in the browser, then tap Talk again.')
        }
      },
      onFinal: (said, { stop }) => {
        o.onPartial?.('')
        o.onTurn?.({ role: 'u', text: said })
        if (stop) { stopAll(); return }
        const reply = o.localAnswer?.(said)
        if (!reply) return
        o.onTurn?.({ role: 'a', text: reply.text, extra: reply })
        a.speak(reply.text)
      },
    })
    browser = a
    engine = 'browser'
    o.onEngine?.('browser', why)
    a.start()
  }

  async function start() {
    stopped = false
    o.onState?.('connecting')
    const cap = capabilities()
    if (!cap.key) return startBrowser('No API key, so the offline voice is being used.')
    const ok = await startLive()
    if (!ok && !stopped && engine !== 'browser') startBrowser('Could not reach the live model.')
  }

  function stopAll() {
    stopped = true
    try { live?.stop() } catch { /* already down */ }
    try { browser?.stop() } catch { /* already down */ }
    live = null; browser = null; engine = null
    o.onState?.('closed'); o.onEngine?.(null)
  }

  return {
    start,
    stop: stopAll,
    setMuted: v => live?.setMuted(v),
    /** Type while the voice session is open; only the Live engine can take it. */
    sendText: t => live?.sendText(t) || false,
    get engine() { return engine },
  }
}

export const ENGINE_LABEL = {
  live: 'Live model',
  browser: 'Offline voice',
}
