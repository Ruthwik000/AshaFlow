import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db } from '../../db/db'
import { caseloadMatrix, householdSummary, memberStatus } from '../../engine/caseload'
import Icon from '../../components/Icon'
import { TopBar, AppBar, Card, Empty, Section, Btn } from '../../components/ui'

const TONE = {
  brand: 'text-brand bg-brand-soft', late: 'text-late bg-late-soft',
  due: 'text-due bg-due-soft', info: 'text-info bg-info-soft',
  ink: 'text-ink-2 bg-line-2',
}

const NUM_TONE = { brand: 'text-brand', late: 'text-late', due: 'text-due', ink: 'text-ink' }

const FILTERS = [
  { k: 'all', l: 'All' },
  { k: 'pregnant', l: 'Pregnant' },
  { k: 'newborn', l: 'Newborns' },
  { k: 'under5', l: 'Under 5' },
  { k: 'ncd', l: 'NCD check' },
]

export default function Families() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const picking = sp.get('pick') === '1'
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [openMatrix, setOpenMatrix] = useState(false)
  const [rows, setRows] = useState(null)
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    Promise.all([db.households.toArray(), db.members.toArray(), db.tasks.toArray()])
      .then(([hs, ms, ts]) => {
        setTasks(ts)
        setRows(hs.map(h => {
          const mem = ms.filter(m => m.householdId === h.id)
          return { ...h, members: mem, summary: householdSummary(mem),
                   tasks: ts.filter(t => t.householdId === h.id) }
        }))
      })
  }, [])

  const matrix = useMemo(() => rows
    ? caseloadMatrix({ households: rows, members: rows.flatMap(r => r.members), tasks })
    : null, [rows, tasks])

  // the four numbers worth showing before the card is opened
  const tiles = matrix ? [
    ...matrix.totals,
    matrix.rows.find(r => r.key === 'pregnant'),
    matrix.rows.find(r => r.key === 'under5'),
  ].filter(Boolean) : []

  if (!rows) return <div className="p-6 text-ink-3">Loading…</div>

  const shown = rows.filter(h => {
    const text = (h.houseNo + ' ' + h.headName + ' ' + h.village + ' ' +
      h.members.map(m => m.name).join(' ')).toLowerCase()
    if (q && !text.includes(q.toLowerCase())) return false
    if (filter === 'all') return true
    return h.summary[filter] > 0
  })

  return (
    <>
      {picking
        ? <TopBar title="Choose a family" sub="Which household are you visiting?" back />
        : <AppBar title="Families" sub={`${rows.length} households · ${matrix.people} people`} />}

      <div className="px-4 pt-3 pb-3 bg-paper/92 backdrop-blur-md border-b border-line sticky top-0 z-20">
        <input id="famsearch" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search name or house number"
          className="sink w-full min-h-[50px] rounded-xl px-4 text-[15px] placeholder:text-ink-3/60" />
        <div className="flex gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
          {FILTERS.map(f => {
            const n = f.k === 'all' ? rows.length : rows.filter(h => h.summary[f.k] > 0).length
            return (
              <button key={f.k} onClick={() => setFilter(f.k)}
                className={`press shrink-0 min-h-[38px] px-3.5 rounded-full text-[13px] font-semibold
                  ${filter === f.k ? 'btn-solid text-white' : 'raise-sm text-ink-2'}`}>
                {f.l} <span className="num opacity-70">{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <main className="flex-1 px-4 py-4 space-y-2">

        {!picking && (
          <Card className="overflow-hidden mb-1">
            <button onClick={() => setOpenMatrix(v => !v)} className="press w-full p-4 text-left">
              <div className="flex items-center gap-3">
                <span className="raise-sm w-10 h-10 shrink-0 rounded-xl grid place-items-center text-brand">
                  <Icon name="chart" size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[15.5px] leading-tight">Your caseload</div>
                  <div className="text-[12.5px] text-ink-3 mt-0.5 num">
                    {matrix.households} households · {matrix.people} people · {matrix.villages.length} villages
                  </div>
                </div>
                <span className={`text-ink-3 shrink-0 transition ${openMatrix ? 'rotate-90' : ''}`}>
                  <Icon name="chevron" size={16} />
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 mt-3.5">
                {tiles.map(r => (
                  <div key={r.key} className="sink rounded-xl py-2.5 text-center">
                    <div className={`text-[19px] font-bold num leading-none ${NUM_TONE[r.tone] || 'text-ink'}`}>
                      {r.n}
                    </div>
                    <div className="text-[10px] text-ink-3 mt-1 leading-tight px-0.5">{r.short}</div>
                  </div>
                ))}
              </div>
            </button>

            {openMatrix && (
              <div className="border-t border-line-2 anim-up">
                <div className="divide-y divide-line-2 bg-sunken/40">
                  {matrix.totals.map(r => (
                    <button key={r.key} onClick={() => { setFilter('all'); setOpenMatrix(false) }}
                      className="press w-full flex items-center gap-3 px-4 py-3 text-left">
                      <span className={`w-11 text-right text-[19px] font-bold num shrink-0 ${NUM_TONE[r.tone]}`}>
                        {r.n}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14.5px] font-bold leading-tight">{r.label}</div>
                        <div className="text-[12px] text-ink-3 mt-0.5">{r.note}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="px-4 pt-3 pb-1 text-[11.5px] font-semibold text-ink-3 uppercase tracking-wide
                                border-t border-line-2">
                  Who is in them
                </div>
                <div className="divide-y divide-line-2">
                  {matrix.rows.map(r => (
                    <button key={r.key} onClick={() => { setFilter(r.key === 'women1549' ? 'all' : r.key); setOpenMatrix(false) }}
                      className="press w-full flex items-center gap-3 px-4 py-3 text-left">
                      <span className={`w-11 text-right text-[17px] font-bold num shrink-0 ${NUM_TONE[r.tone] || 'text-ink'}`}>{r.n}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold leading-tight">{r.label}</div>
                        <div className="text-[12px] text-ink-3 mt-0.5">{r.note}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="px-4 py-3 border-t border-line-2">
                  <div className="text-[12px] text-ink-3 mb-2">By village</div>
                  <div className="flex flex-wrap gap-1.5">
                    {matrix.villages.map(v => (
                      <span key={v.name} className="sink text-[11.5px] px-2.5 py-1 rounded-lg text-ink-2">
                        {v.name} <span className="num font-semibold">{v.households}</span> families
                        <span className="text-ink-3"> · <span className="num">{v.people}</span> people</span>
                      </span>
                    ))}
                  </div>
                </div>

                <p className="px-4 py-3 text-[11.5px] text-ink-3 leading-relaxed border-t border-line-2">
                  Counted from the household records, not typed in. This is the same arithmetic done
                  on paper at the end of the month.
                </p>
              </div>
            )}
          </Card>
        )}

        <button onClick={() => nav(`/asha/families/new${picking ? '?next=person' : ''}`)}
          className="press raise w-full rounded-2xl p-3.5 flex items-center gap-3 mb-1">
          <span className="btn-solid w-11 h-11 shrink-0 rounded-xl grid place-items-center text-white">
            <Icon name="plus" size={20} stroke={2.2} />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <div className="font-semibold text-[15px] leading-tight">Add a family</div>
            <div className="text-[12.5px] text-ink-3 mt-0.5">A household not on this list yet</div>
          </div>
          <span className="text-ink-3 shrink-0"><Icon name="chevron" size={17} /></span>
        </button>

        {shown.length === 0 && (
          <Empty title="No household found"
            sub={q ? 'Try a different name or number, or add the family.' : 'Nothing matches that filter.'} />
        )}

        {shown.map(h => {
          const late = h.tasks.some(t => t.level === 'late')
          const due = h.tasks.some(t => t.level === 'due')
          return (
            <Card key={h.id} onClick={() => nav(picking ? `/asha/visit/${h.id}` : `/asha/family/${h.id}`)}
              className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="sink w-11 h-11 shrink-0 rounded-xl text-brand grid place-items-center
                                font-bold text-[15px] num">{h.houseNo}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[15.5px] leading-tight truncate">{h.headName}</div>
                  <div className="text-[12.5px] text-ink-3 mt-0.5 truncate">
                    {h.village} · {h.members.length} {h.members.length === 1 ? 'member' : 'members'}
                  </div>
                </div>
                {late ? <span className="w-3 h-3 rounded-full bg-late shrink-0" />
                  : due ? <span className="w-3 h-3 rounded-full bg-due shrink-0" />
                  : <span className="w-3 h-3 rounded-full bg-brand-lit shrink-0" />}
              </div>

              {h.summary.chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 pl-14">
                  {h.summary.chips.map(c => (
                    <span key={c.k} className={`text-[11.5px] font-semibold px-2 py-0.5 rounded ${TONE[c.tone]}`}>
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </main>
    </>
  )
}
