import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, say } from '../../store/useStore'
import { WOMAN, WOMAN_ASK } from '../../data/seed'
import Icon from '../../components/Icon'
import WomanBar from '../../components/WomanBar'
import { Btn, Notice } from '../../components/ui'

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
  const mode = useStore(s => s.womanMode)
  const offline = useStore(s => s.demoOffline || !s.online)
  const w = WOMAN[mode]
  const bank = WOMAN_ASK[mode]

  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const end = useRef(null)

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs, busy])
  useEffect(() => { setMsgs([]) }, [mode])

  const answer = q => bank.answers.find(a => a.match.test(q)) || { text: bank.fallback, sources: [] }

  const send = text => {
    const q = (text ?? input).trim()
    if (!q || busy) return
    setInput(''); setMsgs(m => [...m, { role: 'u', text: q, at: clock() }]); setBusy(true)
    setTimeout(() => {
      setMsgs(m => [...m, { role: 'a', ...answer(q), at: clock() }])
      setBusy(false)
    }, 900)
  }

  const mic = () => {
    if (listening) return setListening(false)
    setListening(true)
    setTimeout(() => { setListening(false); send(bank.prompts[0]) }, 1800)
  }

  return (
    <>
      <WomanBar title="Ask" sub="About your health, your money, your papers" />

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {offline && (
          <div className="mb-4">
            <Notice tone="due" title="No signal right now">
              You need a connection to ask a question. Your record and your scheme pages still work.
            </Notice>
          </div>
        )}

        {msgs.length === 0 && (
          <div className="py-4 anim-up">
            <div className="text-center">
              <div className="mx-auto w-fit mb-4"><Mark size={52} /></div>
              <h2 className="text-[21px] font-bold tracking-[-0.015em]">What would you like to know?</h2>
              <p className="text-[14px] text-ink-2 leading-relaxed mt-2 max-w-[33ch] mx-auto">
                Ask about anything in your own record, any scheme, or where an application has reached.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-6">
              {bank.topics.map(c => (
                <div key={c.label} className="raise-sm rounded-2xl px-3.5 py-3 flex items-center gap-2.5">
                  <span className="text-brand shrink-0"><Icon name={c.icon} size={17} /></span>
                  <span className="text-[12.5px] font-semibold text-ink-2 leading-tight">{c.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <div className="text-[13px] font-semibold text-ink-2 mb-2.5 px-0.5">Try asking</div>
              <div className="space-y-2">
                {bank.prompts.map(p => (
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
              <span className="text-[10.5px] text-ink-3 mt-1.5 mr-1 num">{m.at}</span>
            </div>
          ) : (
            <div key={i} className="anim-up">
              <div className="flex gap-2.5">
                <Mark />
                <div className="min-w-0 flex-1">
                  <div className="raise rounded-2xl rounded-tl-md px-4 py-3.5">
                    <p className="text-[14.5px] text-ink leading-[1.65] whitespace-pre-line">{m.text}</p>

                    {m.sources?.length > 0 && (
                      <div className="mt-3.5 pt-3.5 border-t border-line-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-3 mb-2">
                          <Icon name="doc" size={13} /> Read from
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

                  <div className="flex items-center gap-3 mt-1.5 pl-1">
                    <span className="text-[10.5px] text-ink-3 num">{m.at}</span>
                    <button onClick={() => say(m.text)}
                      className="press flex items-center gap-1 text-[11px] font-semibold text-ink-3">
                      <Icon name="assist" size={12} /> Read aloud
                    </button>
                    <button className="press flex items-center gap-1 text-[11px] font-semibold text-ink-3">
                      <Icon name="phone" size={12} /> Ask my ASHA
                    </button>
                  </div>
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
        {listening && (
          <div className="flex items-center justify-center gap-2.5 pb-3">
            <span className="flex items-end gap-[3px] h-4">
              {[0, 1, 2, 3, 4].map(i => (
                <span key={i} className="w-[3px] rounded-full bg-brand animate-pulse"
                  style={{ height: [8, 15, 11, 16, 9][i], animationDelay: `${i * 110}ms` }} />
              ))}
            </span>
            <span className="text-[13px] font-semibold text-brand">Listening…</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} id="womanask"
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type your question…"
            className="sink flex-1 min-h-[50px] rounded-2xl px-4 text-[15px] placeholder:text-ink-3/60" />
          <button onClick={input.trim() ? () => send() : mic}
            aria-label={input.trim() ? 'Send' : 'Speak'}
            className={`press w-[50px] h-[50px] shrink-0 rounded-2xl grid place-items-center text-white
              ${listening ? 'btn-danger' : 'btn-solid'}`}>
            <Icon name={input.trim() ? 'chevron' : 'assist'} size={20} stroke={2.1}
              className={input.trim() ? '-rotate-90' : ''} />
          </button>
        </div>
        <p className="text-[10.5px] text-ink-3 text-center mt-2.5 leading-snug px-2">
          Answers come from your own record and the published scheme rules. This is not a doctor —
          for anything urgent, call your ASHA or 102.
        </p>
      </div>
    </>
  )
}
