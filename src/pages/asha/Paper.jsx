import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../../db/db'
import programmes from '../../data/programmes'
import { buildOutputs } from '../../engine/mapper'
import { TopBar, Btn, Card, Notice } from '../../components/ui'
import Icon from '../../components/Icon'

export default function Paper() {
  const { encId } = useParams()
  const [enc, setEnc] = useState(null)
  const [mode, setMode] = useState('list')
  const [idx, setIdx] = useState(-1)
  const timer = useRef(null)

  useEffect(() => { db.encounters.get(encId).then(setEnc) }, [encId])
  useEffect(() => () => { clearTimeout(timer.current); window.speechSynthesis?.cancel() }, [])

  const built = useMemo(() => buildOutputs({ programmes, facts: enc?.facts || {} }), [enc])
  const reg = built.outputs.find(o => o.code === 'REGISTER')

  const speakRow = i => {
    if (!reg || i >= reg.rows.length) { setIdx(-1); return }
    setIdx(i)
    const r = reg.rows[i]
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(`Column ${i + 1}. ${r.label}. ${r.value}`)
      u.lang = 'en-IN'; u.rate = 0.85
      u.onend = () => { timer.current = setTimeout(() => speakRow(i + 1), 500) }
      window.speechSynthesis.speak(u)
    } catch { timer.current = setTimeout(() => speakRow(i + 1), 1400) }
  }

  const stop = () => { clearTimeout(timer.current); window.speechSynthesis?.cancel(); setIdx(-1) }

  if (!enc || !reg) return <div className="p-6 text-ink-3">Loading…</div>

  return (
    <>
      <TopBar title="Paper register helper" sub="Village Health Register order" back />
      <main className="flex-1 px-4 py-4 pb-8">
        <Notice tone="due" title="Paper is still legally required">
          These values are laid out in the exact column order of the physical register, so copying
          is mechanical rather than a second round of thinking.
        </Notice>

        <div className="flex gap-2 my-4 bg-line-2 p-1 rounded-xl">
          {[['list', 'Register order'], ['dictate', 'Read aloud']].map(([k, l]) => (
            <button key={k} onClick={() => { stop(); setMode(k) }}
              className={`flex-1 min-h-[40px] rounded-lg text-[13.5px] font-semibold transition
                ${mode === k ? 'bg-surface text-ink shadow-sm' : 'text-ink-3'}`}>{l}</button>
          ))}
        </div>

        {mode === 'dictate' && (
          <div className="mb-4 grid grid-cols-2 gap-2.5">
            <Btn onClick={() => speakRow(idx < 0 ? 0 : idx)}><span className="inline-flex items-center gap-1.5"><Icon name="play" size={14} fill="currentColor" />Start reading</span></Btn>
            <Btn tone="ghost" onClick={stop}><span className="inline-flex items-center gap-1.5"><Icon name="stop" size={14} fill="currentColor" />Stop</span></Btn>
          </div>
        )}

        <Card className="overflow-hidden">
          <div className="divide-y divide-line-2">
            {reg.rows.map((r, i) => (
              <div key={r.id}
                className={`flex items-center gap-3 px-4 py-3 transition
                  ${idx === i ? 'bg-brand-soft' : ''}`}>
                <span className="w-7 h-7 shrink-0 rounded-lg bg-line-2 text-ink-3 grid place-items-center
                                 text-[11px] font-bold num">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] text-ink-3">{r.label}</div>
                  <div className="text-[16px] font-semibold num leading-tight">{r.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Btn full tone="ghost" className="mt-4" onClick={() => window.print()}><span className="inline-flex items-center gap-1.5"><Icon name="print" size={16} />Print this page</span></Btn>
      </main>
    </>
  )
}
