import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import programmes from '../../data/programmes'
import { buildOutputs, privacyProjection } from '../../engine/mapper'
import { planEncounter } from '../../engine/solver'
import { TopBar, Card, Btn, Pill, Notice } from '../../components/ui'
import Icon from '../../components/Icon'

const TONE = {
  brand: 'bg-brand-soft text-brand-700 border-brand/30',
  info: 'bg-info-soft text-info border-info/30',
  due: 'bg-due-soft text-due border-due/30',
  agent: 'bg-agent-soft text-agent border-agent/30',
  ink: 'bg-line-2 text-ink-2 border-line',
}
const ORIGIN = {
  asked: { l: 'She answered this', c: 'text-ink-2' },
  derived: { l: 'Calculated', c: 'text-brand' },
  remembered: { l: 'Known from before', c: 'text-info' },
  na: { l: 'Not applicable', c: 'text-ink-3' },
}

export default function Outputs() {
  const { encId } = useParams()
  const nav = useNavigate()
  const [enc, setEnc] = useState(null)
  const [open, setOpen] = useState(null)
  const [tab, setTab] = useState('records')
  const [detail, setDetail] = useState(null)

  useEffect(() => { db.encounters.get(encId).then(setEnc) }, [encId])

  const facts = enc?.facts || {}
  const built = useMemo(() => buildOutputs({ programmes, facts }), [facts])
  const plan = useMemo(() => planEncounter({ programmes, facts, encounterType: enc?.type }), [facts, enc?.type])
  const privacy = useMemo(() => privacyProjection(built.outputs), [built])

  if (!enc) return <div className="p-6 text-ink-3">Loading…</div>

  const minutes = Math.round((plan.stats.baseline - plan.stats.asked) * 6.5 / 60)

  return (
    <>
      <TopBar title="Records generated" sub={enc.summary} back onBack={() => nav('/asha', { replace: true })} />

      <main className="flex-1 px-4 py-4 pb-32">
        <div className="text-center py-3 anim-pop">
          <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-2.5 bg-brand-soft text-brand-700">
            <Icon name="check" size={28} stroke={2.4} />
          </div>
          <h1 className="text-[21px] font-bold leading-tight">
            One visit → {built.outputs.length} records
          </h1>
          <p className="text-[15px] text-ink-2 mt-2">
            <b className="num">{plan.stats.asked}</b> questions instead of{' '}
            <b className="num">{plan.stats.baseline}</b> written entries.
          </p>
          <p className="text-[13px] text-brand font-semibold mt-1 num">≈ {minutes} minutes saved</p>
        </div>

        <div className="flex gap-2 my-4 bg-line-2 p-1 rounded-xl">
          {[['records', 'The 5 records'], ['privacy', 'Who sees what']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 min-h-[40px] rounded-lg text-[13.5px] font-semibold transition
                ${tab === k ? 'bg-surface text-ink shadow-sm' : 'text-ink-3'}`}>{l}</button>
          ))}
        </div>

        {tab === 'records' && (
          <div className="space-y-2.5">
            {built.outputs.map((o, i) => (
              <div key={o.code} className="anim-fan" style={{ animationDelay: `${i * 70}ms` }}>
                <Card className="overflow-hidden">
                  <button onClick={() => setOpen(open === o.code ? null : o.code)}
                    className="w-full flex items-center gap-3 p-4 text-left active:bg-line-2">
                    <span className={`w-11 h-11 shrink-0 rounded-xl border grid place-items-center
                                      text-[12px] font-bold ${TONE[o.colour] || TONE.ink}`}>
                      {o.code.slice(0, 4)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[15px] leading-tight">{o.name}</div>
                      <div className="text-[13px] text-ink-3 mt-0.5 num">{o.count} fields · ready</div>
                    </div>
                    {o.complete ? <Pill level="done">Complete</Pill> : <Pill level="due">Check</Pill>}
                    <span className={`text-ink-3 text-[15px] transition ${open === o.code ? 'rotate-90' : ''}`}>›</span>
                  </button>

                  {open === o.code && (
                    <div className="border-t border-line">
                      {o.note && (
                        <p className="px-4 py-2.5 text-[12px] text-ink-2 bg-brand-tint border-b border-line">{o.note}</p>
                      )}
                      <div className="divide-y divide-line-2">
                        {o.rows.map(r => (
                          <button key={r.id} onClick={() => setDetail(r)}
                            className="w-full flex items-start gap-3 px-4 py-2.5 text-left active:bg-line-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] text-ink-3">{r.label}</div>
                              <div className={`text-[14.5px] font-semibold num ${r.notApplicable ? 'text-ink-3 font-normal' : ''}`}>
                                {r.value}
                              </div>
                            </div>
                            <span className={`text-[10.5px] font-bold uppercase tracking-wide shrink-0 mt-1 ${ORIGIN[r.origin].c}`}>
                              {r.origin === 'derived' ? 'calc' : r.origin === 'remembered' ? 'known' : r.origin === 'na' ? 'n/a' : 'asked'}
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="px-4 py-2.5 text-[11.5px] text-ink-3 bg-paper border-t border-line">
                        From: {o.source}
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}

        {tab === 'privacy' && (
          <div className="space-y-2.5">
            {privacy.map(p => (
              <Card key={p.code} className="p-4">
                <div className="font-semibold text-[15px]">{p.name}</div>
                {p.aggregateOnly ? (
                  <p className="text-[13px] text-ink-2 mt-1.5">Gets numbers only. No name, no address.</p>
                ) : (
                  <p className="text-[13px] text-ink-2 mt-1.5">
                    Gets {p.getsCount} fields{p.gets.length ? `, including ${p.gets.join(', ')}` : ''}.
                  </p>
                )}
                {p.withheld.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {p.withheld.map(w => (
                      <span key={w} className="text-[11.5px] text-ink-3 line-through bg-line-2 px-2 py-0.5 rounded">
                        {w}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
            <Notice tone="brand" title="Each office gets only what it needs">
              Nobody sees the whole record. The monthly report gets no name at all.
            </Notice>
          </div>
        )}
      </main>

      {detail && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-end justify-center"
          onClick={() => setDetail(null)}>
          <div className="w-full max-w-[480px] bg-surface rounded-t-3xl p-5 pb-8 anim-up safe-bot"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-line mx-auto mb-4" />
            <div className="text-[12px] text-ink-3">{detail.label}</div>
            <div className="text-[26px] font-bold num mt-0.5">{detail.value}</div>
            <div className={`mt-3 text-[13px] font-bold ${ORIGIN[detail.origin].c}`}>
              {ORIGIN[detail.origin].l}
            </div>
            {detail.why && (
              <p className="text-[13.5px] text-ink-2 mt-2 leading-relaxed">
                <b>Rule:</b> {detail.why}
              </p>
            )}
            {detail.fromPaths?.length > 0 && (
              <p className="text-[13px] text-ink-3 mt-2">
                Built from: {detail.fromPaths.join(', ')}
              </p>
            )}
            <p className="text-[12px] text-ink-3 mt-3">Canonical path: <code className="num">{detail.path}</code></p>
            <Btn full tone="ghost" className="mt-5" onClick={() => setDetail(null)}>Close</Btn>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 px-4 py-3 bg-paper/95 backdrop-blur border-t border-line safe-bot
                      grid grid-cols-2 gap-2.5">
        <Btn tone="ghost" onClick={() => nav(`/asha/paper/${encId}`)}><span className="inline-flex items-center gap-1.5"><Icon name="book" size={15} />Paper</span></Btn>
        <Btn onClick={() => nav('/asha', { replace: true })}>Done</Btn>
      </div>
    </>
  )
}
