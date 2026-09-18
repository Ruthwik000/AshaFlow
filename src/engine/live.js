// Gemini Live API — the talking assistant.
//
// A bidirectional WebSocket: the microphone streams up as 16 kHz PCM, the model
// streams back 24 kHz PCM that we play as it arrives, and the server's own voice
// activity detection decides when she has stopped speaking. She can talk over
// the reply; the server sends `interrupted` and we drop whatever is still queued
// to play, which is what makes it feel like a conversation and not a walkie-talkie.
//
// Docs: https://ai.google.dev/api/live

import { capabilities } from './gemini'

const HOST = 'generativelanguage.googleapis.com'
const SERVICE = 'google.ai.generativelanguage.v1beta.GenerativeService'
const LIVE_MODEL = import.meta.env.VITE_GEMINI_LIVE_MODEL || 'gemini-3.8-live'

const IN_RATE = 16000   // what the API expects from the microphone
const OUT_RATE = 24000  // what the API sends back

/* The three languages the voice agent speaks. Deliberately separate from the
   UI language in i18n/index.js: the interface ships only in reviewed English
   and Hindi, but the agent can hold a spoken conversation in Telugu too. */
export const VOICE_LANGS = [
  { code: 'en', languageCode: 'en-IN', label: 'English', native: 'English' },
  { code: 'hi', languageCode: 'hi-IN', label: 'Hindi',   native: 'हिन्दी' },
  { code: 'te', languageCode: 'te-IN', label: 'Telugu',  native: 'తెలుగు' },
]
export const langFor = code => VOICE_LANGS.find(l => l.code === code) || VOICE_LANGS[0]

/* ----------------------------------------------------------------- codecs */

const b64ToBytes = b64 => {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

const bytesToB64 = bytes => {
  let s = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(s)
}

const floatToPcm16 = float32 => {
  const out = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

/* An AudioWorklet keeps the capture off the main thread. It is tiny, so it is
   compiled from a blob rather than shipped as a separate file the service
   worker would also have to cache. */
const WORKLET = `
class Tap extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0]
    if (ch) this.port.postMessage(new Float32Array(ch))
    return true
  }
}
registerProcessor('tap', Tap)
`

/* ------------------------------------------------------------------ session */

export class LiveSession {
  /**
   * @param {object} o
   * @param {string} o.system      system instruction, already grounded in her record
   * @param {string} o.lang        'en' | 'hi' | 'te'
   * @param {string} [o.voice]     prebuilt voice name
   * @param {(s:string)=>void} o.onState        'connecting'|'listening'|'speaking'|'closed'
   * @param {(t:string,final:boolean)=>void} o.onUserText    what she said
   * @param {(t:string,final:boolean)=>void} o.onAgentText   what it said back
   * @param {(code:string)=>void} o.onError
   */
  constructor(o) {
    this.o = o
    this.ws = null
    this.stream = null
    this.inCtx = null
    this.outCtx = null
    this.node = null
    this.playHead = 0
    this.sources = new Set()
    this.muted = false
    this.closed = false
    this.userBuf = ''
    this.agentBuf = ''
  }

  get state() { return this._state }
  _set(s) { this._state = s; this.o.onState?.(s) }

  async start() {
    const cap = capabilities()
    if (!cap.key) { this.o.onError?.('GEMINI_KEY_MISSING'); return false }

    this._set('connecting')

    // The microphone is asked for first: if she declines, there is no point
    // opening a socket at all.
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch {
      this.o.onError?.('MIC_DENIED')
      this._set('closed')
      return false
    }

    const url = cap.kind === 'token'
      ? `wss://${HOST}/ws/${SERVICE}.BidiGenerateContentConstrained?access_token=${encodeURIComponent(cap.key)}`
      : `wss://${HOST}/ws/${SERVICE}.BidiGenerateContent?key=${encodeURIComponent(cap.key)}`

    return new Promise(resolve => {
      let settled = false
      try { this.ws = new WebSocket(url) } catch { this.o.onError?.('CONNECT_FAILED'); return resolve(false) }

      this.ws.onopen = () => {
        this.ws.send(JSON.stringify({ setup: this._setup() }))
      }

      this.ws.onmessage = async ev => {
        const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
        let msg
        try { msg = JSON.parse(raw) } catch { return }

        if (msg.setupComplete) {
          await this._openMic()
          this._set('listening')
          if (!settled) { settled = true; resolve(true) }
          return
        }
        this._onServer(msg)
      }

      this.ws.onerror = () => {
        if (!settled) { settled = true; this.o.onError?.('CONNECT_FAILED'); resolve(false) }
      }

      this.ws.onclose = ev => {
        // 1008 is what an expired ephemeral token looks like from a socket.
        if (!settled) {
          settled = true
          this.o.onError?.(ev.code === 1008 || ev.code === 1007 ? 'INVALID_KEY' : 'CONNECT_FAILED')
          resolve(false)
        }
        this._teardown()
        this._set('closed')
      }
    })
  }

  _setup() {
    const l = langFor(this.o.lang)
    return {
      model: `models/${LIVE_MODEL}`,
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          languageCode: l.languageCode,
          voiceConfig: { prebuiltVoiceConfig: { voiceName: this.o.voice || 'Kore' } },
        },
      },
      systemInstruction: { parts: [{ text: this.o.system }] },
      // Both sides are transcribed so the conversation still reads as a chat
      // afterwards — and so a health worker has a written record of the advice.
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig: {
        automaticActivityDetection: {
          // Rural speech has longer pauses than the default assumes; cutting her
          // off mid-sentence is the fastest way to make this feel broken.
          prefixPaddingMs: 300,
          silenceDurationMs: 900,
        },
      },
      contextWindowCompression: { slidingWindow: {} },
    }
  }

  _onServer(msg) {
    const sc = msg.serverContent
    if (msg.goAway) { this.o.onError?.('SESSION_ENDING'); return }
    if (!sc) return

    if (sc.interrupted) { this._flushPlayback(); this._set('listening') }

    const inT = sc.inputTranscription?.text
    if (inT) { this.userBuf += inT; this.o.onUserText?.(this.userBuf, false) }

    const outT = sc.outputTranscription?.text
    if (outT) { this.agentBuf += outT; this.o.onAgentText?.(this.agentBuf, false) }

    for (const part of sc.modelTurn?.parts || []) {
      const d = part.inlineData
      if (d?.data && (d.mimeType || '').startsWith('audio/pcm')) {
        this._set('speaking')
        this._play(d.data, Number((d.mimeType.match(/rate=(\d+)/) || [])[1]) || OUT_RATE)
      }
      if (part.text) { this.agentBuf += part.text; this.o.onAgentText?.(this.agentBuf, false) }
    }

    if (sc.turnComplete) {
      if (this.userBuf) { this.o.onUserText?.(this.userBuf, true); this.userBuf = '' }
      if (this.agentBuf) { this.o.onAgentText?.(this.agentBuf, true); this.agentBuf = '' }
      this._set('listening')
    }
  }

  /* ------------------------------------------------------------- microphone */

  async _openMic() {
    this.inCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: IN_RATE })
    if (this.inCtx.state === 'suspended') await this.inCtx.resume()
    const src = this.inCtx.createMediaStreamSource(this.stream)

    const send = float32 => {
      if (this.muted || this.ws?.readyState !== WebSocket.OPEN) return
      const pcm = floatToPcm16(float32)
      this.ws.send(JSON.stringify({
        realtimeInput: {
          audio: { data: bytesToB64(new Uint8Array(pcm.buffer)), mimeType: `audio/pcm;rate=${IN_RATE}` },
        },
      }))
    }

    try {
      const blobUrl = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }))
      await this.inCtx.audioWorklet.addModule(blobUrl)
      URL.revokeObjectURL(blobUrl)
      this.node = new AudioWorkletNode(this.inCtx, 'tap')
      this.node.port.onmessage = e => send(e.data)
      src.connect(this.node)
      // A worklet with no destination is not pulled in some builds; a silent
      // gain node keeps the graph alive without anything being audible.
      const sink = this.inCtx.createGain()
      sink.gain.value = 0
      this.node.connect(sink).connect(this.inCtx.destination)
    } catch {
      // Older WebView: fall back to the deprecated processor rather than fail.
      this.node = this.inCtx.createScriptProcessor(4096, 1, 1)
      this.node.onaudioprocess = e => send(e.inputBuffer.getChannelData(0))
      src.connect(this.node)
      this.node.connect(this.inCtx.destination)
    }
  }

  /* --------------------------------------------------------------- playback */

  _play(b64, rate) {
    if (!this.outCtx) {
      this.outCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: OUT_RATE })
      this.playHead = 0
    }
    if (this.outCtx.state === 'suspended') this.outCtx.resume()

    const pcm = new Int16Array(b64ToBytes(b64).buffer)
    const buf = this.outCtx.createBuffer(1, pcm.length, rate)
    const ch = buf.getChannelData(0)
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768

    const node = this.outCtx.createBufferSource()
    node.buffer = buf
    node.connect(this.outCtx.destination)

    const now = this.outCtx.currentTime
    const at = Math.max(now, this.playHead)
    node.start(at)
    this.playHead = at + buf.duration

    this.sources.add(node)
    node.onended = () => {
      this.sources.delete(node)
      if (this.sources.size === 0 && !this.closed) this._set('listening')
    }
  }

  /** She started talking again — stop the reply dead. */
  _flushPlayback() {
    for (const s of this.sources) { try { s.stop() } catch { /* already done */ } }
    this.sources.clear()
    this.playHead = this.outCtx ? this.outCtx.currentTime : 0
  }

  /* ----------------------------------------------------------------- public */

  /** Type instead of speaking; the reply still comes back as speech. */
  sendText(text) {
    if (this.ws?.readyState !== WebSocket.OPEN) return false
    this.ws.send(JSON.stringify({
      clientContent: { turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true },
    }))
    return true
  }

  setMuted(v) { this.muted = v }

  stop() {
    this.closed = true
    this._flushPlayback()
    this._teardown()
    try { this.ws?.close() } catch { /* already closing */ }
    this.ws = null
    this._set('closed')
  }

  _teardown() {
    try { this.node?.disconnect() } catch { /* ignore */ }
    try { this.stream?.getTracks().forEach(t => t.stop()) } catch { /* ignore */ }
    try { this.inCtx?.close() } catch { /* ignore */ }
    try { this.outCtx?.close() } catch { /* ignore */ }
    this.node = null; this.stream = null; this.inCtx = null; this.outCtx = null
  }
}

export function explainLiveError(code) {
  switch (code) {
    case 'GEMINI_KEY_MISSING':
      return 'No API key yet. Add VITE_GEMINI_KEY to .env, or paste one under More → Settings.'
    case 'MIC_DENIED':
      return 'The microphone was blocked. Allow it in the browser address bar, then tap Talk again.'
    case 'INVALID_KEY':
      return 'The key was refused. An ephemeral token (AQ.…) lasts about half an hour — paste a fresh one under More → Settings.'
    case 'SESSION_ENDING':
      return 'The session reached its time limit. Tap Talk to start a new one.'
    case 'CONNECT_FAILED':
    default:
      return 'Could not open the voice connection. Check the signal and the key, then try again.'
  }
}
