import { useEffect, useState } from 'react'
import { db } from '../../db/db'
import { AppBar, Card, Section, Btn, Notice, rupee, fmtDate, Pill } from '../../components/ui'

export default function Earnings() {
  const [rows, setRows] = useState([])
  const [claimed, setClaimed] = useState(false)

  useEffect(() => { db.earnings.toArray().then(r => setRows(r.sort((a, b) => b.date.localeCompare(a.date)))) }, [])

  const total = rows.reduce((n, r) => n + r.amount, 0)
  const unclaimed = rows.filter(r => !r.claimed && !claimed)
  const missing = unclaimed.reduce((n, r) => n + r.amount, 0)

  const addAll = async () => {
    await Promise.all(unclaimed.map(r => db.earnings.update(r.id, { claimed: true })))
    setClaimed(true)
    db.earnings.toArray().then(r => setRows(r.sort((a, b) => b.date.localeCompare(a.date))))
  }

  return (
    <>
      <AppBar title="Your earnings" sub="This month" />
      <main className="flex-1 px-4 py-4 space-y-6">
        <Card className="p-5 text-center">
          <div className="text-[14px] text-ink-2">Earned this month</div>
          <div className="text-[44px] font-bold text-brand num leading-none mt-2">{rupee(total)}</div>
          <div className="text-[14px] text-ink-2 mt-2 num">from {rows.length} tasks</div>
        </Card>

        {missing > 0 && (
          <Notice tone="due" title="You have money you did not claim"
            action={<Btn size="md" onClick={addAll}>Add {rupee(missing)} to my claim</Btn>}>
            {unclaimed.length} visits you did qualify for payment but were never claimed.
          </Notice>
        )}
        {claimed && (
          <Notice tone="brand" title="Added to your claim">
            {rupee(missing || 0)} added. Make your claim form below.
          </Notice>
        )}

        <Section title="Your work">
          <div className="bg-surface border border-line rounded-2xl divide-y divide-line-2">
            {rows.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold leading-tight">{r.label}</div>
                  <div className="text-[12px] text-ink-3 mt-0.5 num">{fmtDate(r.date)} · {r.code}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[15px] font-bold num">{rupee(r.amount)}</div>
                  <div className="mt-0.5">
                    {r.claimed ? <Pill level="done">Claimed</Pill> : <Pill level="due">Unclaimed</Pill>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Btn full tone="dark" onClick={() => window.print()}>Generate claim form</Btn>

        <p className="text-[11.5px] text-ink-3 leading-relaxed px-1 pb-4">
          Demo amounts. Rates differ by state — check the current NHM incentive list before real use.
        </p>
      </main>
    </>
  )
}
