import { useMemo, useState } from 'react'
import programmes from '../../data/programmes'
import { planEncounter } from '../../engine/solver'
import { households } from '../../data/seed'
import { TopBar, Card, Bar, Section } from '../../components/ui'

const SAMPLE = {
  'person.name': 'Sunita Devi', 'person.age': 24, 'pregnancy.lmp': '2026-05-02',
  'pregnancy.gravida': 1, 'vitals.weight': 52, 'vitals.height': 151,
  'vitals.bpSys': 118, 'vitals.bpDia': 78, 'vitals.hb': 9.8,
  'tt.dose1Given': true, 'ifa.given': true, 'tb.cough2weeks': false,
}

export default function Proof() {
  const [known, setKnown] = useState(true)
  const facts = useMemo(
    () => ({ ...(known ? households[0].facts : {}), ...SAMPLE, __encounterType: 'Pregnancy' }),
    [known]
  )
  const plan = useMemo(() => planEncounter({ programmes, facts }), [facts])
  const s = plan.stats
  const minutes = ((s.baseline - s.asked) * 6.5 / 60).toFixed(1)

  const steps = [
    { l: 'Five registers ask for', v: s.baseline, tone: 'late' },
    { l: 'Once duplicates are collapsed', v: s.unique, tone: 'due' },
    { l: 'After removing what is calculated', v: s.unique - s.derived, tone: 'due' },
    { l: 'After removing what is remembered', v: s.unique - s.derived - s.remembered, tone: 'brand' },
    { l: 'After skip logic', v: s.asked, tone: 'brand' },
  ]

  return (
    <>
      <TopBar title="Duplication counter" sub="Computed live, not hard-coded" back />
      <main className="flex-1 px-4 py-4 space-y-5 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center !bg-ink !border-ink">
            <div className="text-[11px] uppercase tracking-wider text-white/50 font-bold">Old way</div>
            <div className="text-[44px] font-bold text-white num leading-none mt-1.5">{s.baseline}</div>
            <div className="text-[12px] text-white/60 mt-1.5">entries, 5 registers</div>
          </Card>
          <Card className="p-4 text-center !bg-brand !border-brand">
            <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold">ASHAFlow</div>
            <div className="text-[44px] font-bold text-white num leading-none mt-1.5">{s.asked}</div>
            <div className="text-[12px] text-white/70 mt-1.5">questions, 1 app</div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="text-[13px] text-ink-2">Estimated time for one encounter</div>
          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-[26px] font-bold num text-ink-3 line-through">
              {(s.baseline * 6.5 / 60).toFixed(1)} min
            </span>
            <span className="text-[26px] font-bold num text-brand">{(s.asked * 6.5 / 60).toFixed(1)} min</span>
          </div>
          <p className="text-[12px] text-ink-3 mt-2 leading-relaxed">
            Modelled at 6.5 seconds per field entry. This is a simulation, not a measured field trial —
            replace the constant with your own stopwatch result before claiming it.
          </p>
        </Card>

        <Section title="How the number falls">
          <Card className="p-4 space-y-3.5">
            {steps.map(st => (
              <div key={st.l}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-[12.5px] text-ink-2">{st.l}</span>
                  <span className="text-[16px] font-bold num">{st.v}</span>
                </div>
                <Bar value={(st.v / s.baseline) * 100} tone={st.tone} />
              </div>
            ))}
          </Card>
        </Section>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-semibold text-[14.5px]">Household already known</div>
              <div className="text-[12.5px] text-ink-3 mt-0.5">
                Turn off to see a first-ever visit to a new house
              </div>
            </div>
            <button onClick={() => setKnown(v => !v)} aria-label="Toggle known household"
              className={`w-14 h-8 rounded-full transition relative shrink-0 ${known ? 'bg-brand' : 'bg-line'}`}>
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${known ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </Card>

        <p className="text-[11.5px] text-ink-3 leading-relaxed px-1">
          Every number on this screen is produced by <code>planEncounter()</code> against the five
          programme schema files at render time. Change a schema file and these numbers change.
        </p>
      </main>
    </>
  )
}
