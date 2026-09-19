import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { buildBlock, units } from '../../engine/officer'
import Icon from '../../components/Icon'
import OfficerBar from '../../components/OfficerBar'
import { Card, Section, Bar, Btn, Pill, Notice, List, Row, Stat, fmtDate } from '../../components/ui'

/* One list, one detail. Both sort by area and by load, never by output — an
   officer opens this to find who needs a hand, not to compare women. */

export function Workers() {
  const nav = useNavigate()
  const [b, setB] = useState(null)
  const [village, setVillage] = useState('all')
  useEffect(() => { buildBlock().then(setB) }, [])

  if (!b) return <div className="p-6 text-ink-3">Reading the block…</div>
  const villages = ['all', ...b.villages.map(v => v.name)]
  const shown = village === 'all' ? b.ashas : b.ashas.filter(a => a.village === village)
  const needing = new Set(b.needsSupport.map(a => a.id))
  const flagsOf = id => b.needsSupport.find(a => a.id === id)?.flags || []

  return (
    <>
      <OfficerBar title="ASHA Field Workers" sub={`${b.totals.ashas} Staff across ${b.totals.villages} Villages`}
        back onBack={() => nav('/officer')} />

      <div className="px-4 pt-3 pb-3 bg-paper/92 backdrop-blur-md border-b border-line sticky top-[0] z-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {villages.map(v => {
            const n = v === 'all' ? b.ashas.length : b.ashas.filter(a => a.village === v).length
            return (
              <button key={v} onClick={() => setVillage(v)}
                className={`press shrink-0 min-h-[38px] px-3.5 rounded-full text-[13px] font-semibold
                  ${village === v ? 'btn-solid text-white' : 'raise-sm text-ink-2'}`}>
                {v === 'all' ? 'All villages' : v} <span className="num opacity-70">{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <main className="flex-1 px-4 py-4 space-y-2.5 pb-8">
        {shown.map(a => (
          <Card key={a.id} onClick={() => nav(`/officer/asha/${a.id}`)} className="p-4">
            <div className="flex items-start gap-3">
              <span className={`sink w-11 h-11 shrink-0 rounded-xl grid place-items-center
                ${needing.has(a.id) ? 'text-due' : 'text-brand'}`}>
                <Icon name="worker" size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[15.5px] leading-tight">{a.name}</span>
                  {a.fromDevice && (
                    <span className="text-[9.5px] font-bold uppercase tracking-wide
                                     bg-brand-soft text-brand px-1.5 py-0.5 rounded">Live</span>
                  )}
                </div>
                <div className="text-[12px] text-ink-3 mt-0.5 num">{a.subcentre} · {a.id}</div>
                <div className="text-[12.5px] text-ink-2 mt-1.5 num">
                  {a.households} families · {a.people} people · {a.pregnant} pregnant · {a.under5} under 5
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {flagsOf(a.id).map(f => (
                    <span key={f} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-due-soft text-due">{f}</span>
                  ))}
                  {flagsOf(a.id).length === 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-brand-soft text-brand">
                      Up to date
                    </span>
                  )}
                </div>
              </div>
              <Icon name="chevron" size={17} className="text-ink-3 shrink-0 mt-1" />
            </div>
          </Card>
        ))}

        <Notice tone="brand" title="Sorted by area, not by output">
          This list is never ranked by visits done. The only badge a worker carries here says what she
          needs, so the office can send it.
        </Notice>
      </main>
    </>
  )
}

export function AshaDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [b, setB] = useState(null)
  useEffect(() => { buildBlock().then(setB) }, [])

  if (!b) return <div className="p-6 text-ink-3">Reading her area…</div>
  const a = b.ashas.find(x => x.id === id)
  if (!a) return <div className="p-6 text-ink-3">Worker not found</div>
  const flags = b.needsSupport.find(x => x.id === id)?.flags || []
  const mine = b.requests.filter(r => r.ashaId === id)
  const done = Math.round((a.visits / Math.max(a.visits + a.due + a.overdue, 1)) * 100)

  return (
    <>
      <OfficerBar title={a.name} sub={`${a.subcentre} · ${a.village}`} back onBack={() => nav('/officer/workers')} />
      <main className="flex-1 px-4 py-4 space-y-5 pb-8">

        {a.fromDevice && (
          <Notice tone="info" title="These numbers are live">
            This worker's phone is the one running this app, so her families, her pregnancies and her
            drug kit below are read from her device — not from a report she filed.
          </Notice>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Stat value={a.households} label="Families" sub={`${a.people} people`} tone="brand" />
          <Stat value={a.pregnant} label="Pregnant women" sub={`${a.under5} children under 5`} />
          <Stat value={a.visits} label="Visits this month" />
          <Stat value={a.overdue} label="Overdue" tone={a.overdue ? 'late' : 'ink'} sub={`${a.due} due`} />
        </div>

        <Section title="Work in front of her">
          <Card className="p-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[13.5px] font-semibold">Visits done against visits due</span>
              <span className="text-[14px] font-bold num">{done}%</span>
            </div>
            <Bar value={done} tone={done < 70 ? 'due' : 'brand'} />
            <div className="text-[11.5px] text-ink-3 mt-2 num">
              {a.visits} done · {a.due} due · {a.overdue} overdue · records {a.synced}% synced
            </div>
          </Card>
        </Section>

        {flags.length > 0 && (
          <Section title="What she needs">
            <Card className="p-4 space-y-2.5">
              {flags.map(f => (
                <div key={f} className="flex items-start gap-2.5">
                  <span className="text-due shrink-0 mt-0.5"><Icon name="alert" size={16} /></span>
                  <span className="text-[13.5px] leading-snug">{f}</span>
                </div>
              ))}
            </Card>
          </Section>
        )}

        {mine.length > 0 && (
          <Section title={`Supplies she is waiting for · ${mine.length}`} action={
            <button onClick={() => nav('/officer/supply')} className="text-[12.5px] font-semibold text-brand">
              Send ›
            </button>
          }>
            <List>
              {mine.map(r => (
                <Row key={r.id} icon={<Icon name="firstaid" size={18} />}
                  title={`${r.item} · ${r.qty} ${units(r.qty, r.unit)}`}
                  sub={`${r.waiting} ${r.waiting === 1 ? 'day' : 'days'} · ${r.why}`}
                  right={<Pill level={r.urgency} />} />
              ))}
            </List>
          </Section>
        )}

        <Section title="Her posting">
          <List>
            <Row icon={<Icon name="id" size={19} />} title="ASHA code" sub={a.id} />
            <Row icon={<Icon name="pin" size={19} />} title="Sub-centre" sub={`${a.subcentre} · ${a.village}`} />
            <Row icon={<Icon name="phone" size={19} />} title="Mobile" sub={a.phone}
              right={<Btn size="sm" tone="ghost"><Icon name="phone" size={14} /> Call</Btn>} />
            <Row icon={<Icon name="calendar" size={19} />} title="Working since" sub={fmtDate(a.joined)} />
            <Row icon={<Icon name="award" size={19} />} title="Last refresher training" sub={fmtDate(a.trained)} />
          </List>
        </Section>

        <Notice tone="brand" title="No score is kept">
          Nothing on this page is a rating. It shows the size of her area and what the office owes
          her, so a visit here ends in help being sent rather than a remark being recorded.
        </Notice>
      </main>
    </>
  )
}
