import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { useSubject } from '../../hooks/useSubject'
import { TIMELINE_KINDS } from '../../data/seed'
import Icon from '../../components/Icon'
import WomanBar from '../../components/WomanBar'
import { Card, Btn, Notice, Empty, rupee, fmtDate } from '../../components/ui'

const FILTERS = [
  { k: 'all', l: 'Everything' }, { k: 'checkup', l: 'Check-ups' },
  { k: 'test', l: 'Tests' }, { k: 'vaccine', l: 'Vaccines' },
  { k: 'growth', l: 'Growth' }, { k: 'payment', l: 'Payments' },
  { k: 'document', l: 'Papers' },
]

export default function Records() {
  const [sp] = useSearchParams()
  const mode = useStore(s => s.womanMode)
  const [filter, setFilter] = useState(sp.get('filter') || 'all')
  const [open, setOpen] = useState(null)

  const [subject] = useSubject(mode)
  if (!subject) return <div className="p-6 text-ink-3">Reading your record…</div>
  const all = subject.timeline
  const rows = filter === 'all' ? all : all.filter(r => r.kind === filter)
  const available = new Set(all.map(r => r.kind))

  return (
    <>
      <WomanBar title="My record" sub={`${all.length} entries, newest first`} />

      <div className="px-4 py-3 bg-paper/92 backdrop-blur-md border-b border-line sticky top-0 z-20">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {FILTERS.filter(f => f.k === 'all' || available.has(f.k)).map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`press shrink-0 min-h-[38px] px-3.5 rounded-full text-[13px] font-semibold
                ${filter === f.k ? 'btn-solid text-white' : 'raise-sm text-ink-2'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 py-4 pb-4">
        {rows.length === 0 && <Empty title="Nothing here yet" sub="This will fill up as you have visits." />}

        <div className="relative">
          {rows.length > 1 && (
            <span className="absolute left-[19px] top-6 bottom-6 w-px bg-line" aria-hidden="true" />
          )}

          <div className="space-y-3">
            {rows.map(r => {
              const k = TIMELINE_KINDS[r.kind]
              const isOpen = open === r.id
              return (
                <div key={r.id} id={r.id} className="flex gap-3.5">
                  <span className="raise w-10 h-10 shrink-0 rounded-full grid place-items-center text-brand z-10 bg-surface">
                    <Icon name={k.icon} size={18} />
                  </span>

                  <Card className={`flex-1 min-w-0 overflow-hidden ${r.fresh ? '!border-brand/40' : ''}`}>
                    <button onClick={() => setOpen(isOpen ? null : r.id)}
                      className="press w-full text-left p-4">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11.5px] text-ink-3 num">{fmtDate(r.date)} · {k.label}</span>
                            {r.fresh && (
                              <span className="text-[9.5px] font-bold uppercase tracking-wide
                                               bg-brand-soft text-brand px-1.5 py-0.5 rounded">New</span>
                            )}
                          </div>
                          <div className="font-bold text-[15px] leading-tight mt-1">{r.title}</div>
                          <div className="text-[12.5px] text-ink-2 mt-1">{r.by}</div>
                          {r.amount > 0 && (
                            <div className="text-[17px] font-bold num text-brand mt-1.5">{rupee(r.amount)}</div>
                          )}
                        </div>
                        <span className={`text-ink-3 shrink-0 mt-1 transition ${isOpen ? 'rotate-90' : ''}`}>
                          <Icon name="chevron" size={16} />
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-line-2 anim-up">
                        {r.values && (
                          <div className="divide-y divide-line-2">
                            {r.values.map(([label, value]) => (
                              <div key={label} className="flex justify-between gap-3 px-4 py-2.5">
                                <span className="text-[13px] text-ink-2">{label}</span>
                                <span className="text-[14px] font-semibold num text-right">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {r.detail && <p className="px-4 py-3 text-[13.5px] text-ink-2 leading-relaxed">{r.detail}</p>}
                        {r.note && (
                          <p className="mx-4 my-3 rounded-xl bg-due-soft px-3.5 py-2.5 text-[13px] text-ink-2 leading-relaxed">
                            {r.note}
                          </p>
                        )}
                        {r.next && (
                          <div className="px-4 py-3 flex items-center gap-2 text-[13px] text-brand font-semibold border-t border-line-2">
                            <Icon name="clock" size={15} /> {r.next}
                          </div>
                        )}
                        {r.sentTo?.length > 0 && (
                          <div className="px-4 py-3 border-t border-line-2">
                            <div className="text-[11.5px] text-ink-3 mb-2">This was sent to</div>
                            <div className="flex flex-wrap gap-1.5">
                              {r.sentTo.map(s => (
                                <span key={s} className="sink text-[11.5px] px-2 py-1 rounded-lg text-ink-2">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="px-4 py-3 border-t border-line-2">
                          <Btn size="sm" tone="ghost" className="w-full">
                            <Icon name="alert" size={15} /> Something here is wrong
                          </Btn>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-5">
          <Notice tone="brand" title="This is your information">
            Every entry above was written by a health worker during a visit, and it is yours to read.
            If a value looks wrong, say so — corrections travel back to the same systems the record
            was sent to.
          </Notice>
        </div>
      </main>
    </>
  )
}
