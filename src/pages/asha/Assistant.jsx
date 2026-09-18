import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ASSISTANT_PROMPTS, ASSISTANT_ANSWERS } from '../../data/seed'
import { useStore, say } from '../../store/useStore'
import { askModel, hasAnyChat } from '../../ai'
import { ASHA } from '../../data/seed'
import { useT } from '../../i18n'
import Icon from '../../components/Icon'
import { AppBar, Btn, Notice } from '../../components/ui'

const pick = q => {
  for (const [k, v] of Object.entries(ASSISTANT_ANSWERS)) {
    if (k === 'default') continue
    if (v.match?.test(q)) return v
  }
  return ASSISTANT_ANSWERS.default
}
const clock = () => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

function Mark({ size = 30 }) {
  return (
    <span className="btn-solid grid place-items-center rounded-xl text-white shrink-0"
      style={{ width: size, height: size }}>
      <Icon name="assist" size={size * 0.58} stroke={1.9} />
    </span>
  )
}

/* The worker's assistant is grounded in the programme rules rather than one
   person's record, so it gets a small fixed context of its own. */
const ASHA_CTX = {
  mode: 'pregnant', name: ASHA.name, age: '—', village: ASHA.village, house: '—',
  asha: ASHA.name, ashaPhone: '98765 21140', anm: 'Kavita Singh',
  phc: 'Rampur Primary Health Centre', rchId: '—',
  anc: [], vaccines: [], schemes: [], timeline: [],
  nextVisit: { label: '—', date: '—', at: '—' }, paid: 0, owed: 0,
  danger: [{ label: 'Bleeding' }, { label: 'Fits' }, { label: 'Baby not moving' }],
}

export default function Assistant() {
  const nav = useNavigate()
  const t = useT()
  const offline = useStore(s => s.demoOffline || !s.online)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const end = useRef(null)

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs, busy])

  const push = m => setMsgs(x => [...x, { at: clock(), ...m }])

  const send = async text => {
    const q = (text ?? input).trim()
    if (!q || busy) return
    setInput(''); push({ role: 'u', text: q }); setBusy(true)

    const local = pick(q)
    let out = { ...local, via: 'local' }
    if (hasAnyChat()) {
      try {
        const r = await askModel(q, ASHA_CTX, t.lang)
        if (r && !r.failed && r.text) out = { ...local, text: r.text, via: r.via }
        else if (r?.failed) out = { ...out, tried: r.tried }
      } catch { /* the offline answer stands */ }
    }
    setTimeout(() => { push({ role: 'a', ...out }); setBusy(false) }, 300)
  }

  const attach = () => {
    push({ role: 'u', text: 'HBNC-day7-format.pdf', file: true, meta: 'PDF · 14 pages · 1.8 MB' })
    setBusy(true)
    setTimeout(() => {
      push({
        role: 'a',
        text: 'I read the form — 14 pages, 22 fields. It is the HBNC day-7 newborn visit format.\n\n18 of the 22 fields already map onto the record we hold, so a worker would be asked about 6 new things. The remaining 4 need a person to decide the mapping.',
        sources: ['HBNC-day7-format.pdf, pages 2–9'],
        actions: [{ label: 'Build a form from this PDF', to: '/asha/new-schema', icon: 'doc' }],
      })
      setBusy(false)
    }, 1500)
  }

  const mic = () => {
    if (listening) return setListening(false)
    setListening(true)
    setTimeout(() => { setListening(false); send('Why has Sunita’s payment not come?') }, 1800)
  }

  const CAN = [
    { icon: 'doc', l: t('assist.canDo1') }, { icon: 'scan', l: t('assist.canDo2') },
    { icon: 'plus', l: t('assist.canDo3') }, { icon: 'assist', l: t('assist.canDo4') },
  ]

  return (
    <>
      <AppBar title={t('assist.title')} sub={t('assist.sub')} />

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {offline && (
          <div className="mb-4">
            <Notice tone="due" title={t('common.offline')}>
              The assistant needs a connection. Everything else keeps working offline.
            </Notice>
          </div>
        )}

        {msgs.length === 0 && (
          <div className="py-6 anim-up">
            <div className="text-center">
              <div className="mx-auto w-fit mb-4"><Mark size={52} /></div>
              <h2 className="text-[21px] font-bold tracking-[-0.015em]">{t('assist.empty')}</h2>
              <p className="text-[14px] text-ink-2 leading-relaxed mt-2 max-w-[32ch] mx-auto">
                {t('assist.emptyBody')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-6">
              {CAN.map(c => (
                <div key={c.l} className="raise-sm rounded-2xl px-3.5 py-3 flex items-center gap-2.5">
                  <span className="text-brand shrink-0"><Icon name={c.icon} size={17} /></span>
                  <span className="text-[12.5px] font-semibold text-ink-2 leading-tight">{c.l}</span>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <div className="text-[13px] font-semibold text-ink-2 mb-2.5 px-0.5">{t('assist.try')}</div>
              <div className="space-y-2">
                {(ASSISTANT_PROMPTS[t.lang] ?? ASSISTANT_PROMPTS.en ?? []).map(p => (
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
                {m.file ? (
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-lg grid place-items-center text-white shrink-0"
                      style={{ background: 'rgba(255,255,255,.18)' }}>
                      <Icon name="doc" size={17} />
                    </span>
                    <div>
                      <div className="text-[14px] font-semibold text-white leading-tight">{m.text}</div>
                      <div className="text-[11.5px] text-white/70 mt-0.5 num">{m.meta}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[14.5px] text-white leading-relaxed whitespace-pre-line">{m.text}</p>
                )}
              </div>
              <span className="text-[10.5px] text-ink-3 mt-1.5 mr-1 num">{m.at}</span>
            </div>
          ) : (
            <div key={i} className="anim-up">
              <div className="flex gap-2.5">
                <Mark />
                <div className="min-w-0 flex-1">
                  <div className="raise rounded-2xl rounded-tl-md px-4 py-3.5">
                    <p className="text-[14.5px] text-ink leading-[1.62] whitespace-pre-line">
                      {m.text.replace(/\*\*/g, '')}
                    </p>

                    {m.sources?.length > 0 && (
                      <div className="mt-3.5 pt-3.5 border-t border-line-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-3 mb-2">
                          <Icon name="doc" size={13} /> {t('assist.readFrom')}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.sources.map(s => (
                            <span key={s} className="sink text-[11.5px] px-2.5 py-1 rounded-lg text-ink-2">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.actions?.map(a => (
                      <button key={a.label} onClick={() => nav(a.to)}
                        className="press raise-sm w-full mt-3 rounded-xl px-3.5 py-3 flex items-center gap-2.5 text-left">
                        <span className="text-brand shrink-0"><Icon name={a.icon || 'chevron'} size={16} /></span>
                        <span className="text-[13.5px] font-semibold text-ink flex-1">{a.label}</span>
                        <span className="text-ink-3 shrink-0"><Icon name="chevron" size={14} /></span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 pl-1">
                    <span className="text-[10.5px] text-ink-3 num">{m.at}</span>
                    {m.via && (
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded
                        ${m.via === 'local' ? 'bg-line-2 text-ink-3' : 'bg-brand-soft text-brand'}`}>
                        {m.via === 'local' ? 'offline' : m.via}
                      </span>
                    )}
                    <button onClick={() => say(m.text.replace(/\*\*/g, ''))}
                      className="press flex items-center gap-1 text-[11px] font-semibold text-ink-3">
                      <Icon name="assist" size={12} /> {t('common.readAloud')}
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
            <span className="text-[13px] font-semibold text-brand">{t('assist.listening')}</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button onClick={attach} aria-label="Attach a PDF"
            className="press raise w-[50px] h-[50px] shrink-0 rounded-2xl grid place-items-center text-ink-2">
            <Icon name="doc" size={20} />
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} id="askinput"
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={t('assist.placeholder')}
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
          {t('assist.guard')}
        </p>
      </div>
    </>
  )
}
