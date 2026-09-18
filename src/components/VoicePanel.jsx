import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { Btn, Notice } from './ui'
import { useStore } from '../store/useStore'
import { VOICE_LANGS } from '../engine/live'
import { createHybridVoiceAgent, ENGINE_LABEL } from '../engine/voiceAgent'
import { capabilities } from '../engine/gemini'

/* The talking assistant, shared by the ASHA's Assist screen and the woman's Ask
   screen. One tap starts it; after that she just talks, and can talk over the
   reply. Both sides are transcribed into the chat above, so the conversation is
   still there in writing afterwards.

   Two engines sit behind this one panel — see engine/voiceAgent.js. The strip at
   the bottom says which one is actually running, because "the model is
   answering" and "the offline rule bank is answering" are different promises. */

const STATE_TEXT = {
  connecting: 'Connecting…',
  listening: 'Listening — just talk',
  thinking: 'Thinking…',
  speaking: 'Speaking',
  closed: 'Not connected',
}

export default function VoicePanel({ systemFor, localAnswer, onExchange, onClose, note }) {
  const voiceLang = useStore(s => s.voiceLang)
  const setVoiceLang = useStore(s => s.setVoiceLang)

  const [state, setState] = useState('closed')
  const [engine, setEngine] = useState(null)
  const [engineNote, setEngineNote] = useState(null)
  const [err, setErr] = useState(null)
  const [muted, setMuted] = useState(false)
  const [partial, setPartial] = useState('')
  const agent = useRef(null)
  const cap = capabilities()

  // A live socket and an open microphone must never outlive the screen.
  useEffect(() => () => { agent.current?.stop(); agent.current = null }, [])

  const stop = () => {
    agent.current?.stop()
    agent.current = null
    setPartial('')
  }

  const start = async (lang = voiceLang) => {
    setErr(null); setEngineNote(null)
    agent.current?.stop()
    const a = createHybridVoiceAgent({
      lang,
      systemFor,
      localAnswer,
      onState: setState,
      onPartial: setPartial,
      onTurn: m => onExchange?.({ ...m, voice: true }),
      onEngine: (e, why) => { setEngine(e); if (why) setEngineNote(why) },
      onError: setErr,
    })
    agent.current = a
    await a.start()
  }

  const on = ['connecting', 'listening', 'speaking', 'thinking'].includes(state)

  // Changing language restarts the session: the voice and the speech model are
  // both fixed at setup time, so there is no way to switch one mid-call.
  const pickLang = code => {
    setVoiceLang(code)
    if (on) setTimeout(() => start(code), 60)
  }

  return (
    <div className="raise rounded-3xl p-4 anim-up">
      <div className="flex items-center gap-2.5 mb-3.5">
        <span className={`w-9 h-9 rounded-2xl grid place-items-center shrink-0
          ${on ? 'btn-solid text-white' : 'sink text-ink-2'}`}>
          <Icon name="speaker" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold leading-tight">Talk to the assistant</div>
          <div className="text-[12px] text-ink-3 leading-tight mt-0.5">
            {on ? STATE_TEXT[state] : 'Tap Talk, then speak normally'}
          </div>
        </div>
        {engine && (
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded shrink-0
            ${engine === 'live' ? 'bg-brand-soft text-brand-700' : 'bg-sunken text-ink-3'}`}>
            {ENGINE_LABEL[engine]}
          </span>
        )}
        {onClose && (
          <button onClick={() => { stop(); onClose() }} aria-label="Close voice"
            className="press raise-sm w-9 h-9 rounded-xl grid place-items-center text-ink-3 shrink-0">
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-3.5">
        {VOICE_LANGS.map(l => (
          <button key={l.code} onClick={() => pickLang(l.code)}
            className={`press flex-1 min-h-[46px] rounded-2xl text-[14px] font-semibold
              ${voiceLang === l.code ? 'btn-solid text-white' : 'raise-sm text-ink-2'}`}>
            {l.native}
          </button>
        ))}
      </div>

      {on && (
        <div className="sink rounded-2xl px-4 py-4 mb-3.5 min-h-[84px] flex flex-col justify-center">
          <div className="flex items-center justify-center gap-[3px] h-6 mb-2">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <span key={i}
                className={`w-[3px] rounded-full ${state === 'speaking' ? 'bg-brand' : 'bg-ink-3/50'}`}
                style={{
                  height: state === 'connecting' ? 6 : [9, 16, 22, 13, 20, 11, 15][i],
                  animation: `pulse 1s ${i * 90}ms infinite`,
                }} />
            ))}
          </div>
          <p className={`text-[13.5px] leading-snug text-center ${partial ? 'text-ink' : 'text-ink-3'}`}>
            {partial || STATE_TEXT[state]}
          </p>
        </div>
      )}

      {err && <div className="mb-3.5"><Notice tone="due" title="Voice trouble">{err}</Notice></div>}

      {engineNote && !err && (
        <p className="text-[11.5px] text-ink-3 leading-snug mb-3 px-0.5">{engineNote}</p>
      )}

      {cap.expires && !err && (
        <p className="text-[11.5px] text-ink-3 leading-snug mb-3 px-0.5">
          The key in use is a Live-API ephemeral token. These last about half an hour — if voice
          drops to the offline engine mid-demo, paste a fresh one under More → Settings.
        </p>
      )}

      {!on ? (
        <Btn full onClick={() => start()}>
          <span className="inline-flex items-center gap-2"><Icon name="speaker" size={17} />Talk</span>
        </Btn>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <Btn tone="ghost" onClick={() => { const v = !muted; setMuted(v); agent.current?.setMuted(v) }}>
            <span className="inline-flex items-center gap-1.5">
              <Icon name={muted ? 'close' : 'speaker'} size={15} />{muted ? 'Unmute' : 'Mute'}
            </span>
          </Btn>
          <Btn tone="danger" onClick={stop}>
            <span className="inline-flex items-center gap-1.5"><Icon name="stop" size={14} fill="currentColor" />Stop</span>
          </Btn>
        </div>
      )}

      {note && <p className="text-[10.5px] text-ink-3 text-center mt-3 leading-snug px-1">{note}</p>}
    </div>
  )
}
