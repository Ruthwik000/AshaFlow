import { useNavigate } from 'react-router-dom'
import { OFFICER_VILLAGES, OFFICER_ALERTS } from '../../data/seed'
import { TopBar, Card, Section, Stat, Bar, Btn, Pill, Notice } from '../../components/ui'
import programmes from '../../data/programmes'
import Icon from '../../components/Icon'

export default function Dashboard() {
  const nav = useNavigate()
  const visits = OFFICER_VILLAGES.reduce((n, v) => n + v.visits, 0)
  const overdue = OFFICER_VILLAGES.reduce((n, v) => n + v.overdue, 0)
  const synced = Math.round(OFFICER_VILLAGES.reduce((n, v) => n + v.synced, 0) / OFFICER_VILLAGES.length)

  return (
    <>
      <TopBar title="Block Health Office" sub="Rampur block · this week" back onBack={() => nav('/asha/more')} />
      <main className="flex-1 px-4 py-4 space-y-5 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <Stat value={visits} label="Visits this week" tone="brand" />
          <Stat value={overdue} label="Overdue follow-ups" tone="late" />
          <Stat value={`${synced}%`} label="Records synced" />
          <Stat value={programmes.length} label="Programme schemas" sub="add more below" />
        </div>

        <Section title="Village coverage">
          <Card className="p-4 space-y-4">
            {OFFICER_VILLAGES.map(v => (
              <div key={v.name}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-[14px] font-semibold">{v.name}</span>
                  <span className="text-[13px] font-bold num">{v.coverage}%</span>
                </div>
                <Bar value={v.coverage} tone={v.coverage < 70 ? 'due' : 'brand'} />
                <div className="text-[11.5px] text-ink-3 mt-1 num">
                  {v.visits} visits · {v.overdue} overdue · {v.ashas} ASHAs
                </div>
              </div>
            ))}
          </Card>
        </Section>

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
                  className="min-h-[48px] rounded-xl border border-line bg-paper px-3 text-left active:bg-line-2">
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

        <Notice tone="brand" title="What this dashboard deliberately does not show">
          There is no per-ASHA performance score, no ranking and no location tracking. Officers see
          area-level problems so they can send help, not individual workers so they can be measured.
        </Notice>
      </main>
    </>
  )
}
