import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, say } from '../../store/useStore'
import { useSubject } from '../../hooks/useSubject'
import { buildContext, answer as askEngine, suggestions } from '../../engine/assistant'
import { askModel, hasAnyChat } from '../../ai'
import { WOMAN } from '../../data/seed'
import Icon from '../../components/Icon'
import WomanBar from '../../components/WomanBar'
import VoiceBar from '../../components/VoiceBar'
import { AI } from '../../ai/config'
import { createVoiceAgent, voiceSupported, speakOnce } from '../../engine/voice'
import { Btn, Notice } from '../../components/ui'
import { useT } from '../../i18n'

/** **bold** without pulling in a markdown parser. */
function rich(text) {
  return String(text).split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <b key={i} className="font-bold">{part.slice(2, -2)}</b>
      : <span key={i}>{part}</span>
  )
}


/* The browser reports a bare code like "not-allowed"; the speech engine sends
   a whole sentence. Only a code needs explaining. */
function voiceMessage(e, allowHint) {
  const code = String(e)
  if (code === 'not-allowed' || code === 'service-not-allowed')
    return `Microphone permission was refused. ${allowHint}`
  if (code === 'network') return 'Speech recognition needs a connection. You can still type.'
  if (code === 'audio-capture') return 'No microphone was found on this device. You can still type.'
  return /^[a-z-]+$/.test(code) ? `Voice stopped: ${code}` : code
}

const clock = () => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

function Mark({ size = 30 }) {
  return (
    <span className="btn-solid grid place-items-center rounded-xl text-white shrink-0"
      style={{ width: size, height: size }}>
      <Icon name="message" size={size * 0.56} stroke={1.9} />
    </span>
  )
}

export default function Ask() {
  const nav = useNavigate()
  const t = useT()
  const mode = useStore(s => s.womanMode)
  const offline = useStore(s => s.demoOffline || !s.online)
  const [subject] = useSubject(mode)
  const w = WOMAN[mode]
  const ctx = useMemo(() => (subject ? buildContext(subject) : null), [subject])
  const prompts = useMemo(() => (ctx ? suggestions(ctx) : []), [ctx])
  const TOPICS = mode === 'pregnant'
    ? [{ icon: 'pulse', k: 'w.topicHealth' }, { icon: 'wallet', k: 'w.topicMoney' },
       { icon: 'doc', k: 'w.topicPapers' }, { icon: 'calendar', k: 'w.topicVisits' }]
    : [{ icon: 'syringe', k: 'w.topicVaccines' }, { icon: 'growth', k: 'w.topicGrowth' },
       { icon: 'wallet', k: 'w.topicMoney' }, { icon: 'baby', k: 'w.topicFeeding' }]

  const lang = useStore(s => s.lang)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [voiceState, setVoiceState] = useState('idle')
  const [partial, setPartial] = useState('')
  const [voiceErr, setVoiceErr] = useState(null)
  const [why, setWhy] = useState(null)   // which message's failure detail is open
  const end = useRef(null)
  const agent = useRef(null)
  const ctxRef = useRef(null)
  useEffect(() => { ctxRef.current = ctx }, [ctx])

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs, busy])
  useEffect(() => { setMsgs([]) }, [mode])

  /* The written engine answers first — it reads her own record and needs no
     signal. Only when it does not recognise the question at all does a model
     get a turn, with the same record as its context. */
  const reply = async (q, { spoken = false } = {}) => {
    const c = ctxRef.current
    if (!c) return
    const a = askEngine(q, c, lang)
    let out = { ...a, via: 'local' }

    if (a.id === 'fallback' && hasAnyChat() && !offline) {
      try {
        const r = await askModel(q, c, lang)
        if (r && !r.failed && r.text) {
          out = { ...a, text: r.text, via: r.via, tried: r.tried, needsReview: false, action: a.action }
        } else if (r?.failed) {
          out = { ...out, tried: r.tried }
        }
      } catch { /* the written answer stands */ }
    }

    setMsgs(m => [...m, { role: 'a', ...out, at: clock() }])
    setBusy(false)
    if (spoken) agent.current?.speak(out.text)   // …then it listens again on its own
  }

  const send = (text, opts = {}) => {
    const q = (text ?? input).trim()
    if (!q || !ctxRef.current) return
    setInput(''); setPartial('')
    setMsgs(m => [...m, { role: 'u', text: q, at: clock(), spoken: opts.spoken }])
    setBusy(true)
    setTimeout(() => reply(q, opts), opts.spoken ? 250 : 700)
  }

  /* --- the voice loop: listen → answer → speak → listen again ---------- */
  const startVoice = () => {
    setVoiceErr(null)
    if (!voiceSupported()) {
      setVoiceErr('This browser cannot listen. Chrome on Android works; you can still type.')
      return
    }
    const a = createVoiceAgent({
      lang,
      onState: setVoiceState,
      onPartial: setPartial,
      onError: e => setVoiceErr(voiceMessage(e, 'Allow it in the browser to talk.')),
      onFinal: (said, { stop }) => {
        setPartial('')
        if (stop) { setMsgs(m => [...m, { role: 'u', text: said, at: clock(), spoken: true }]); return }
        send(said, { spoken: true })
      },
    })
    agent.current = a
    a.start()
  }

  const stopVoice = () => { agent.current?.stop(); agent.current = null; setPartial(''); setVoiceState('idle') }
  const live = voiceState !== 'idle'
  useEffect(() => () => agent.current?.stop(), [])

  return (
    <>
      <WomanBar title={t('w.ask')} sub={t('w.askSub')} />

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {offline && (
          <div className="mb-4">
            <Notice tone="due" title={t('w.offlineTitle')}>
              {t('w.offlineBody')}
            </Notice>
          </div>
        )}

        {msgs.length === 0 && (
          <div className="py-4 anim-up">
            <div className="text-center">
              <div className="mx-auto w-fit mb-4"><Mark size={52} /></div>
              <h2 className="text-[21px] font-bold tracking-[-0.015em]">{t('w.askEmpty')}</h2>
              <p className="text-[14px] text-ink-2 leading-relaxed mt-2 max-w-[33ch] mx-auto">
                {t('w.askEmptyBody')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-6">
              {TOPICS.map(c => (
                <div key={c.k} className="raise-sm rounded-2xl px-3.5 py-3 flex items-center gap-2.5">
                  <span className="text-brand shrink-0"><Icon name={c.icon} size={17} /></span>
                  <span className="text-[12.5px] font-semibold text-ink-2 leading-tight">{t(c.k)}</span>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <div className="text-[13px] font-semibold text-ink-2 mb-2.5 px-0.5">{t('w.tryAsking')}</div>
              <div className="space-y-2">
                {prompts.map(p => (
                  <button key={p} onClick={() => send(p)}
                    className="press raise w-full text-left rounded-2xl pl-4 pr-3 py-3.5 flex items-center gap-3">
                    <span className="text-[14px] text-ink flex-1 leading-snug">{p}</span>
                    <span className="text-ink-3 shrink-0"><Icon name="chevron" size={15} /></span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {msgs.map((m, i) => m.role === 'u' ? (
            <div key={i} className="flex flex-col items-end anim-up">
              <div className="btn-solid max-w-[82%] rounded-2xl rounded-br-md px-4 py-3 !cursor-default">
                <p className="text-[14.5px] text-white leading-relaxed">{m.text}</p>
              </div>
              <span className="text-[10.5px] text-ink-3 mt-1.5 mr-1 num flex items-center gap-1">
                {m.spoken && <Icon name="assist" size={11} />}{m.at}
              </span>
            </div>
          ) : (
            <div key={i} className="anim-up">
              <div className="flex gap-2.5">
                <Mark />
                <div className="min-w-0 flex-1">
                  <div className={`rounded-2xl rounded-tl-md px-4 py-3.5
                    ${m.tone === 'danger' ? 'bg-late-soft border border-late/30' : 'raise'}`}>
                    <p className="text-[14.5px] text-ink leading-[1.65] whitespace-pre-line">{rich(m.text)}</p>

                    {m.needsReview && (
                      <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-due-soft px-2.5 py-1.5">
                        <span className="text-due shrink-0 mt-0.5"><Icon name="info" size={12} /></span>
                        <span className="text-[11px] text-due leading-snug">
                          {t('w.notTranslated')}
                        </span>
                      </div>
                    )}
                    {m.sources?.length > 0 && (
                      <div className="mt-3.5 pt-3.5 border-t border-line-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-3 mb-2">
                          <Icon name="doc" size={13} /> {t('w.readFrom')}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.sources.map(s => (
                            <span key={s} className="sink text-[11.5px] px-2.5 py-1 rounded-lg text-ink-2">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.action && (
                      <button onClick={() => nav(m.action.to)}
                        className="press raise-sm w-full mt-3 rounded-xl px-3.5 py-3 flex items-center gap-2.5 text-left">
                        <span className="text-brand shrink-0"><Icon name="history" size={16} /></span>
                        <span className="text-[13.5px] font-semibold text-ink flex-1">{m.action.label}</span>
                        <span className="text-ink-3 shrink-0"><Icon name="chevron" size={14} /></span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 pl-1 flex-wrap">
                    <span className="text-[10.5px] text-ink-3 num">{m.at}</span>
                    {m.via && (
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded
                        ${m.via === 'local' ? 'bg-line-2 text-ink-3' : 'bg-brand-soft text-brand'}`}>
                        {m.via === 'local' ? t('w.onDevice') : m.via === 'grok' ? AI.grok.label : m.via}
                      </span>
                    )}
                    {m.tried?.length > 0 && m.via === 'local' && (
                      <button onClick={() => setWhy(why === i ? null : i)}
                        className="press flex items-center gap-1 text-[10px] font-semibold text-due">
                        <Icon name="info" size={11} />
                        {m.tried.map(x => (x.id === 'grok' ? AI.grok.label : x.id)).join(', ')} unavailable
                      </button>
                    )}
                    <button onClick={() => say(m.text.replace(/\*\*/g, ''))}
                      className="press flex items-center gap-1 text-[11px] font-semibold text-ink-3">
                      <Icon name="assist" size={12} /> {t('w.readAloud')}
                    </button>
                    <button className="press flex items-center gap-1 text-[11px] font-semibold text-ink-3">
                      <Icon name="phone" size={12} /> {t('w.askMyAsha')}
                    </button>
                  </div>

                  {why === i && m.tried?.length > 0 && (
                    <div className="mt-2 rounded-xl bg-due-soft border border-due/25 px-3 py-2.5 anim-up">
                      <div className="text-[11px] font-bold text-due mb-1">What each one said</div>
                      {m.tried.map(x => (
                        <div key={x.id} className="text-[11px] text-ink-2 leading-snug mb-1 last:mb-0">
                          <b className="uppercase">{x.id === 'grok' ? AI.grok.label : x.id}</b> — {x.error}
                        </div>
                      ))}
                      <div className="text-[10.5px] text-ink-3 mt-1.5 leading-snug">
                        The answer above came from this phone instead, so nothing was lost.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex gap-2.5 anim-up">
              <Mark />
              <div className="raise rounded-2xl rounded-tl-md px-4 py-4 flex items-center gap-2">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce"
                    style={{ animationDelay: `${i * 140}ms`, animationDuration: '1s' }} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div ref={end} className="h-2" />
      </main>

      <div className="sticky bottom-0 bg-paper/94 backdrop-blur-md border-t border-line px-3 pt-3 pb-2 safe-bot">
        <VoiceBar state={voiceState} partial={partial} lang={lang} onStop={stopVoice} />

        {voiceErr && (
          <div className="pb-3">
            <div className="rounded-xl bg-due-soft border border-due/25 px-3.5 py-2.5">
              <span className="text-[12.5px] text-due font-medium">{voiceErr}</span>
            </div>
          </div>
        )}

        <div className="flex items-end gap-1.5">
          <input value={input} onChange={e => setInput(e.target.value)} id="womanask"
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={t('w.typeQuestion')}
            className="sink flex-1 min-w-0 min-h-[50px] rounded-2xl px-4 text-[15px] placeholder:text-ink-3/60" />

          {/* Both, always. Typing and talking are two ways in, not a toggle. */}
          <button onClick={live ? stopVoice : startVoice}
            aria-label={live ? 'Stop talking' : 'Start talking'}
            className={`press w-[48px] h-[48px] shrink-0 rounded-2xl grid place-items-center
              ${live ? 'btn-danger text-white' : 'raise text-brand'}`}>
            <Icon name="assist" size={20} stroke={2.1} />
          </button>
          <button onClick={() => send()} aria-label="Send" disabled={!input.trim()}
            className={`w-[48px] h-[48px] shrink-0 rounded-2xl grid place-items-center
              ${input.trim() ? 'press btn-solid text-white' : 'bg-line-2 text-ink-3/50 cursor-not-allowed'}`}>
            <Icon name="chevron" size={20} stroke={2.1} className="-rotate-90" />
          </button>
        </div>
        <p className="text-[10.5px] text-ink-3 text-center mt-2.5 leading-snug px-2">
          {live ? t('w.voiceLive') : t('w.voiceHint')}
        </p>
      </div>
    </>
  )
}
