import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PORTALS, SUBMISSIONS, earningsHistory, PROOFS } from '../../data/seed'
import { TopBar, Card, Section, List, Row, Btn, Pill, Notice, SimBadge, Toggle, rupee, fmtDate } from '../../components/ui'

const STATE = { paid: 'done', approved: 'info', rejected: 'late', sending: 'due' }

export default function GovPortal() {
  const nav = useNavigate()
  const [portals, setPortals] = useState(PORTALS)
  const [subs, setSubs] = useState(SUBMISSIONS)
  const [busy, setBusy] = useState(false)

  const unclaimed = earningsHistory.filter(e => !e.claimed)
  const amount = unclaimed.reduce((n, e) => n + e.amount, 0)
  const proofs = PROOFS.filter(p => p.kind === 'visit').length
  const connected = portals.filter(p => p.connected).length

  const submit = () => {
    setBusy(true)
    setTimeout(() => {
      setSubs(s => [{ id: 'new', date: new Date().toISOString().slice(0, 10), portal: 'ASHA Soft',
        items: unclaimed.length, amount, state: 'approved', note: 'Submitted with 4 proof photos' }, ...s])
      setBusy(false)
    }, 1600)
  }

  return (
    <>
      <TopBar title="Government portal" sub="Submit claims and proofs" back onBack={() => nav('/asha')} />
      <main className="flex-1 px-4 py-4 space-y-5 pb-8">

        <SimBadge>Simulated. Nothing here connects to a real government system, and no real claim is filed.</SimBadge>

        <Card className="p-5">
          <div className="text-[13px] text-ink-2">Ready to submit</div>
          <div className="text-[38px] font-bold num text-brand leading-none mt-1.5 tracking-[-0.025em]">{rupee(amount)}</div>
          <div className="text-[13px] text-ink-2 mt-2 num">{unclaimed.length} claims · {proofs} proof photos attached</div>
          <Btn full className="mt-4" onClick={submit} disabled={busy || amount === 0 || connected === 0}>
            {busy ? 'Submitting…' : `Submit ${unclaimed.length} claims`}
          </Btn>
          <p className="text-[11.5px] text-ink-3 mt-3 leading-relaxed">
            Each claim carries the visit it came from and the photo taken at the door, so a rejection
            says which record failed rather than bouncing the whole batch.
          </p>
        </Card>

        <Section title="Connections">
          <List>
            {portals.map(p => (
              <div key={p.code} className="flex items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[14.5px] leading-tight">{p.name}</div>
                  <div className="text-[12.5px] text-ink-3 mt-0.5">{p.what}</div>
                  {p.connected && p.last && (
                    <div className="text-[11.5px] text-brand mt-1 num">Last sent {fmtDate(p.last)}</div>
                  )}
                </div>
                <Toggle on={p.connected} label={p.name}
                  onClick={() => setPortals(x => x.map(y => y.code === p.code ? { ...y, connected: !y.connected } : y))} />
              </div>
            ))}
          </List>
        </Section>

        <Section title="What you have sent">
          <List>
            {subs.map(s => (
              <div key={s.id} className="px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[14.5px] leading-tight">{s.portal}</div>
                    <div className="text-[12.5px] text-ink-3 mt-0.5 num">
                      {fmtDate(s.date)} · {s.items} items{s.amount ? ` · ${rupee(s.amount)}` : ''}
                    </div>
                    <div className={`text-[12.5px] mt-1 ${s.state === 'rejected' ? 'text-late font-semibold' : 'text-ink-2'}`}>
                      {s.note}
                    </div>
                  </div>
                  <Pill level={STATE[s.state]}>{s.state}</Pill>
                </div>
                {s.state === 'rejected' && (
                  <Btn size="sm" tone="ghost" className="mt-3 w-full">See which record failed</Btn>
                )}
              </div>
            ))}
          </List>
        </Section>

        <Notice tone="info" title="If a portal has no API">
          Not every state system accepts a machine submission. The fallback is a generated claim file in
          the format the portal expects, which the worker uploads herself — same data, one manual step.
        </Notice>
      </main>
    </>
  )
}
