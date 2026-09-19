import { useNavigate } from 'react-router-dom'
import programmes from '../../data/programmes'
import { planEncounter } from '../../engine/solver'
import { households } from '../../data/seed'
import { Btn } from '../../components/ui'
import Icon from '../../components/Icon'

const SAMPLE = {
  ...households[0].facts,
  'person.name': 'Sunita Devi', 'person.age': 24, 'pregnancy.lmp': '2026-05-02',
  'pregnancy.gravida': 1, 'vitals.weight': 52, 'vitals.height': 151,
  'vitals.bpSys': 118, 'vitals.bpDia': 78, 'vitals.hb': 9.8,
  'tt.dose1Given': true, 'ifa.given': true, 'tb.cough2weeks': false,
}

export default function Landing() {
  const nav = useNavigate()
  const s = planEncounter({ programmes, facts: SAMPLE }).stats

  return (
    <div className="flex-1 flex flex-col safe-top safe-bot">
      <main className="flex-1 px-5 pt-10 pb-8 space-y-6">
        {/* Masthead Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="btn-solid w-9 h-9 rounded-xl grid place-items-center text-white">
              <Icon name="mark" size={18} />
            </span>
            <span className="font-bold text-[17px] tracking-tight">ASHAFlow</span>
          </div>
          <span className="sink text-[11px] font-bold px-2.5 py-1 rounded-full text-brand">
            NHM Public Health Stack
          </span>
        </div>

        {/* Hero Title */}
        <div>
          <h1 className="text-[38px] leading-[1.05] tracking-[-0.03em] font-semibold text-ink"
            style={{ fontFamily: 'var(--font-display)' }}>
            One visit.<br />One entry.<br />
            <span className="text-brand">Every programme.</span>
          </h1>

          <p className="text-[15.5px] text-ink-2 leading-relaxed mt-4 max-w-[34ch]">
            India's ASHA workers write the same household facts into five separate registers.
            ASHAFlow captures the visit once and feeds every national portal.
          </p>
        </div>

        {/* Bento Proof Metric Tile */}
        <div className="raise rounded-3xl p-5">
          <div className="flex items-stretch gap-3">
            <div className="flex-1 sink rounded-2xl p-4 text-center">
              <div className="text-[34px] font-bold num leading-none text-ink-3 tracking-[-0.03em]">{s.baseline}</div>
              <div className="text-[11.5px] text-ink-3 mt-2 leading-tight">written entries<br />across 5 registers</div>
            </div>
            <div className="grid place-items-center text-ink-3 text-[18px] px-0.5">→</div>
            <div className="flex-1 btn-solid rounded-2xl p-4 text-center !cursor-default">
              <div className="text-[34px] font-bold num leading-none text-white tracking-[-0.03em]">{s.asked}</div>
              <div className="text-[11.5px] text-white/80 mt-2 leading-tight">questions<br />asked once</div>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-line-2 space-y-1.5">
            {[['Duplicates collapsed', s.baseline - s.unique],
              ['Computed by clinical rules', s.derived],
              ['Remembered from household', s.remembered],
              ['Not applicable to her', s.skipped]].map(([l, v]) => (
              <div key={l} className="flex justify-between text-[12.5px]">
                <span className="text-ink-3">{l}</span>
                <span className="font-semibold num text-ink-2">−{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Feature 1: DVDMS Supply Chain & Village Heatmap */}
        <div className="raise rounded-3xl p-5 border-l-4 border-l-brand space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-brand"><Icon name="firstaid" size={20} /></span>
            <span className="font-bold text-[15.5px] text-ink">Supply Chain &amp; Depot Fulfillment</span>
          </div>
          <p className="text-[13px] text-ink-2 leading-relaxed">
            Integrated with state DVDMS / e-Aushadhi standards to eliminate village drug stockouts:
          </p>
          <div className="grid grid-cols-1 gap-2 pt-1">
            <div className="sink rounded-xl p-2.5 text-[12.5px] text-ink-2">
              <b className="text-ink">1. One-Tap Kit Approval:</b> Instantly sends IFA, ORS and test kits directly from PHC store to ASHA phone.
            </div>
            <div className="sink rounded-xl p-2.5 text-[12.5px] text-ink-2">
              <b className="text-ink">2. Village Stockout Heatmap:</b> Real-time days of cover per village with monsoon malaria and diarrhea surge alerts.
            </div>
            <div className="sink rounded-xl p-2.5 text-[12.5px] text-ink-2">
              <b className="text-ink">3. Strict FEFO Expiry Tracking:</b> First-Expired, First-Out batch allocation automatically blocks expired drugs.
            </div>
          </div>
        </div>

        {/* Bento Key Capabilities Grid */}
        <div className="space-y-3">
          {[
            ['phone', 'Offline-First Engine', 'The whole engine runs on the phone in remote hamlets. Syncs when signal returns.'],
            ['rupee', 'Automatic Incentive Claims', 'Builds her monthly claims, finding routine incentives she would otherwise miss.'],
            ['user', 'Beneficiary Her-View', 'Mothers can view their own record, vaccination timeline, and track scheme cash transfers.'],
          ].map(([i, t, d]) => (
            <div key={t} className="raise rounded-2xl p-4 flex gap-3.5 items-start">
              <span className="sink w-10 h-10 shrink-0 rounded-xl grid place-items-center text-brand">
                <Icon name={i} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[15px] leading-tight text-ink">{t}</div>
                <div className="text-[12.5px] text-ink-2 mt-1 leading-snug">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="px-5 pb-8 pt-2">
        <Btn full size="lg" onClick={() => nav('/portals')}>Explore the Portals ›</Btn>
        <p className="text-[11px] text-ink-3 text-center mt-3 leading-relaxed">
          National Health Mission Prototype · Connected to local IndexedDB
        </p>
      </div>
    </div>
  )
}
