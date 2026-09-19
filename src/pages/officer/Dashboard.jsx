import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildBlock, units } from '../../engine/officer'
import { OFFICER_ALERTS } from '../../data/seed'
import programmes from '../../data/programmes'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, Stat, Bar, Btn, Pill, Notice, List, Row } from '../../components/ui'

const TONE = { late: 'text-late', due: 'text-due', info: 'text-info' }

export default function Dashboard() {
  const nav = useNavigate()
  const [b, setB] = useState(null)
  useEffect(() => { buildBlock().then(setB) }, [])

  if (!b) return <div className="p-6 text-ink-3">Reading the block…</div>
  const { totals, villages, needsSupport, requests } = b

  return (
    <>
      <TopBar title="Block Health Office" sub="Rampur block · Dr A. Mishra"
        back onBack={() => nav('/portals')} />

      <main className="flex-1 px-4 py-4 space-y-5 pb-8">

        {/* who and what this block is ------------------------------------- */}
        <div className="grid grid-cols-2 gap-3">
          <Stat value={totals.ashas} label="ASHA workers" tone="brand"
            sub={`${totals.villages} villages`} />
          <Stat value={totals.households} label="Families covered"
            sub={`${totals.people} people`} />
          <Stat value={totals.pregnant} label="Pregnant women" tone="brand"
            sub={`${totals.under5} children under 5`} />
          <Stat value={totals.overdue} label="Overdue visits" tone="late"
            sub={`${totals.due} more due`} />
        </div>

        {/* the two things an officer can actually act on -------------------- */}
        {(needsSupport.length > 0 || totals.waiting > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => nav('/officer/workers')}
              className="press raise rounded-2xl p-4 text-left">
              <span className="text-due"><Icon name="families" size={21} /></span>
              <div className="font-bold text-[15px] mt-2.5 leading-tight">
                {needsSupport.length} need support
              </div>
              <div className="text-[12px] text-ink-3 mt-0.5 leading-snug">
                Carrying too much, behind, or short of stock
              </div>
            </button>
            <button onClick={() => nav('/officer/supply')}
              className="press raise rounded-2xl p-4 text-left">
              <span className="text-brand"><Icon name="firstaid" size={21} /></span>
              <div className="font-bold text-[15px] mt-2.5 leading-tight">
                {totals.waiting} supply requests
              </div>
              <div className="text-[12px] text-ink-3 mt-0.5 leading-snug">
                Waiting on the block store
              </div>
            </button>
          </div>
        )}

        {/* by village ------------------------------------------------------ */}
        <Section title="By village">
          <div className="space-y-2.5">
            {villages.map(v => (
              <Card key={v.name} className="p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <span className="text-[15px] font-bold">{v.name}</span>
                    <span className="text-[12px] text-ink-3 ml-2 num">
                      {v.ashas} {v.ashas === 1 ? 'ASHA' : 'ASHAs'} · {v.households} families · {v.people} people
                    </span>
                  </div>
                  <span className={`text-[14px] font-bold num shrink-0
                    ${v.coverage < 70 ? 'text-due' : 'text-brand'}`}>{v.coverage}%</span>
                </div>
                <Bar value={v.coverage} tone={v.coverage < 70 ? 'due' : 'brand'} />
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-ink-3 mt-2 num">
                  <span>{v.visits} visits done</span>
                  {v.overdue > 0 && <span className="text-late font-semibold">{v.overdue} overdue</span>}
                  {v.due > 0 && <span>{v.due} due</span>}
                  <span>{v.pregnant} pregnant · {v.under5} under 5</span>
                  {v.synced < 100 && <span className="text-due">{v.synced}% synced</span>}
                  {v.waiting > 0 && <span>{v.waiting} supply {v.waiting === 1 ? 'request' : 'requests'}</span>}
                </div>
              </Card>
            ))}
          </div>
          <p className="text-[11.5px] text-ink-3 px-1 mt-2.5 leading-relaxed">
            The percentage is visits done against visits due in that village — the work the area has
            got through, not a mark for anyone in it.
          </p>
        </Section>

        {/* who to help first ------------------------------------------------ */}
        {needsSupport.length > 0 && (
          <Section title="Who to help first" action={
            <button onClick={() => nav('/officer/workers')} className="text-[12.5px] font-semibold text-brand">
              All workers ›
            </button>
          }>
            <div className="space-y-2.5">
              {needsSupport.slice(0, 3).map(a => (
                <Card key={a.id} onClick={() => nav(`/officer/asha/${a.id}`)} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="sink w-11 h-11 shrink-0 rounded-xl grid place-items-center text-brand">
                      <Icon name="worker" size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[15.5px] leading-tight">{a.name}</div>
                      <div className="text-[12px] text-ink-3 mt-0.5">{a.subcentre} · {a.village}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {a.flags.map(f => (
                          <span key={f} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-due-soft text-due">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Icon name="chevron" size={17} className="text-ink-3 shrink-0 mt-1" />
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* supplies --------------------------------------------------------- */}
        {requests.length > 0 && (
          <Section title="Supplies waiting" action={
            <button onClick={() => nav('/officer/supply')} className="text-[12.5px] font-semibold text-brand">
              Open the store ›
            </button>
          }>
            <List>
              {requests.slice(0, 4).map(r => (
                <Row key={r.id} icon={<span className={TONE[r.urgency]}><Icon name="firstaid" size={18} /></span>}
                  title={`${r.item} · ${r.qty} ${units(r.qty, r.unit)}`}
                  sub={`${r.asha?.name} · ${r.asha?.village} · waiting ${r.waiting} ${r.waiting === 1 ? 'day' : 'days'}`}
                  right={<Pill level={r.urgency}>{r.urgency === 'late' ? 'Urgent' : r.urgency === 'due' ? 'Soon' : 'Routine'}</Pill>}
                  onClick={() => nav('/officer/supply')} />
              ))}
            </List>
          </Section>
        )}

        {/* everything else the office already did --------------------------- */}
        <Section title="Needs attention">
          <div className="space-y-2">
            {OFFICER_ALERTS.map(a => (
              <Card key={a.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[14.5px] leading-tight">{a.title}</div>
                    <div className="text-[12.5px] text-ink-2 mt-1 leading-relaxed">{a.detail}</div>
                  </div>
                  <Pill level={a.level} />
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Exports">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {programmes.map(p => (
                <button key={p.code}
                  className="press min-h-[48px] rounded-xl border border-line bg-paper px-3 text-left active:bg-line-2">
                  <div className="text-[13px] font-semibold leading-tight">{p.code}</div>
                  <div className="text-[11px] text-ink-3">download .csv</div>
                </button>
              ))}
            </div>
          </Card>
        </Section>

        <div className="space-y-2.5">
          <Btn full onClick={() => nav('/officer/forms')}>Publish scheme forms to the field</Btn>
          <Btn full tone="dark" onClick={() => nav('/officer/add-programme')}>
            Add a programme from a PDF
          </Btn>
        </div>

        <Notice tone="brand" title="What this office deliberately does not show">
          No performance score, no ranking of workers, no location tracking. Everything here sorts by
          who needs help, never by who produced most. An ASHA is a person doing the work, not a
          number to be measured against her neighbour.
        </Notice>
      </main>
    </>
  )
}
