import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db } from '../../db/db'
import { TopBar, AppBar, Card, Empty, Btn } from '../../components/ui'
import Icon from '../../components/Icon'

const FILTERS = [
  { k: 'all', l: 'All' },
  { k: 'pregnant', l: 'Pregnant' },
  { k: 'infant', l: 'Babies' },
  { k: 'elder', l: 'NCD check' },
]

export default function Families() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const picking = sp.get('pick') === '1'
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [rows, setRows] = useState([])

  useEffect(() => {
    Promise.all([db.households.toArray(), db.members.toArray(), db.tasks.toArray()])
      .then(([hs, ms, ts]) => setRows(hs.map(h => ({
        ...h,
        members: ms.filter(m => m.householdId === h.id),
        tasks: ts.filter(t => t.householdId === h.id),
      }))))
  }, [])

  const shown = rows.filter(h => {
    const text = (h.houseNo + ' ' + h.headName + ' ' + h.village + ' ' +
      h.members.map(m => m.name).join(' ')).toLowerCase()
    if (q && !text.includes(q.toLowerCase())) return false
    if (filter === 'all') return true
    if (filter === 'elder') return h.members.some(m => m.age >= 30)
    return h.members.some(m => m.role === filter)
  })

  return (
    <>
      {picking
        ? <TopBar title="Choose a family" sub="Which household are you visiting?" back />
        : <AppBar title="Families" sub={`${rows.length} households`} />}

      <div className="px-4 pt-3 pb-3 bg-paper/92 backdrop-blur-md border-b border-line sticky top-0 z-20">
        <input id="famsearch" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search name or house number"
          className="sink w-full min-h-[50px] rounded-xl px-4 text-[15px] placeholder:text-ink-3/60" />
        <div className="flex gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
          {FILTERS.map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`press shrink-0 min-h-[38px] px-3.5 rounded-full text-[13px] font-semibold
                ${filter === f.k ? 'btn-solid text-white' : 'raise-sm text-ink-2'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 py-4 space-y-2">
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
            sub={q ? 'Try a different name or number, or add the family.' : 'Add your first family.'} />
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
                    {h.village} · {h.membersCount} {h.membersCount === 1 ? 'member' : 'members'}
                  </div>
                </div>
                {late ? <span className="w-3 h-3 rounded-full bg-late" />
                  : due ? <span className="w-3 h-3 rounded-full bg-due" />
                  : <span className="w-3 h-3 rounded-full bg-brand" />}

              </div>
            </Card>
          )
        })}
      </main>
    </>
  )
}
