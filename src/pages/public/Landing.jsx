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
      <main className="flex-1 px-6 pt-12 pb-8">
        <div className="flex items-center gap-2.5 mb-12">
          <span className="btn-solid w-9 h-9 rounded-xl grid place-items-center text-white"><Icon name="mark" size={18} /></span>
          <span className="font-bold text-[16px] tracking-[-0.01em]">ASHAFlow</span>
        </div>

        <h1 className="text-[40px] leading-[1.04] tracking-[-0.03em] font-semibold"
          style={{ fontFamily: 'var(--font-display)' }}>
          One visit.<br />One entry.<br />
          <span className="text-brand">Five systems.</span>
        </h1>

        <p className="text-[16px] text-ink-2 leading-relaxed mt-5 max-w-[34ch]">
          India's ASHA workers write the same household facts into five separate
          registers. ASHAFlow captures the visit once and produces all five.
        </p>

        {/* the proof, not a claim */}
        <div className="raise rounded-3xl p-5 mt-8">
          <div className="flex items-stretch gap-3">
            <div className="flex-1 sink rounded-2xl p-4 text-center">
              <div className="text-[36px] font-bold num leading-none text-ink-3 tracking-[-0.03em]">{s.baseline}</div>
              <div className="text-[11.5px] text-ink-3 mt-2 leading-tight">written entries<br />across 5 registers</div>
            </div>
            <div className="grid place-items-center text-ink-3 text-[20px] px-0.5">→</div>
            <div className="flex-1 btn-solid rounded-2xl p-4 text-center !cursor-default">
              <div className="text-[36px] font-bold num leading-none text-white tracking-[-0.03em]">{s.asked}</div>
              <div className="text-[11.5px] text-white/75 mt-2 leading-tight">questions<br />asked once</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-line-2 space-y-1.5">
            {[['Duplicates collapsed', s.baseline - s.unique],
              ['Computed by rules', s.derived],
              ['Remembered from the household', s.remembered],
              ['Not applicable to her', s.skipped]].map(([l, v]) => (
              <div key={l} className="flex justify-between text-[12.5px]">
                <span className="text-ink-3">{l}</span>
                <span className="font-semibold num text-ink-2">−{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {[['phone', 'Works with no signal', 'The whole engine runs on the phone. The server only stores and exports.'],
            ['₹', 'It pays the worker', 'The same entry builds her incentive claim and finds payments she missed.'],
            ['user', 'She can see her own record', 'The woman reads what was written and controls who receives it.']].map(([i, t, d]) => (
            <div key={t} className="flex gap-3.5">
              <span className="raise-sm w-9 h-9 shrink-0 rounded-xl grid place-items-center text-brand">
                <Icon name={i} size={17} /></span>
              <div>
                <div className="font-semibold text-[15px] leading-tight">{t}</div>
                <div className="text-[13px] text-ink-2 mt-1 leading-relaxed">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="px-6 pb-8 pt-2">
        <Btn full onClick={() => nav('/portals')}>Open a portal</Btn>
        <p className="text-[11.5px] text-ink-3 text-center mt-4 leading-relaxed">
          Prototype. Synthetic data only. Not connected to any real<br />government health information system.
        </p>
      </div>
    </div>
  )
}
