import { useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import { TopBar } from '../../components/ui'

const PORTALS = [
  { id: 'asha', mark: 'worker', name: 'ASHA worker', who: 'Community health worker',
    does: 'Capture a visit once. Get paid for it.',
    points: ['Add entries, scan forms, build new ones', 'Families with their schemes and proofs', 'Assistant, earnings and reminders'] },
  { id: 'officer', mark: 'officer', name: 'Health officer', who: 'PHC, block or district',
    does: 'Real-time block caseload, drug logistics and supportive supervision.',
    points: ['Village stockout heatmap & days of cover', 'One-tap DVDMS depot resupply with FEFO batching', 'Worker caseload, support queue & programme publisher'] },
  { id: 'woman', mark: 'user', name: 'Pregnant woman', who: 'Beneficiary',
    does: 'Your care, your money, your record.',
    points: ['Check-up and vaccine dates', 'Benefit tracking with the exact blocker', 'See and control your own data'] },
]

export default function Portals() {
  const nav = useNavigate()
  return (
    <>
      <TopBar title="Choose a portal" sub="Three views of the same single entry" back onBack={() => nav('/')} />
      <main className="flex-1 px-4 py-5 space-y-3.5 safe-bot">
        {PORTALS.map(p => (
          <button key={p.id} onClick={() => nav(`/login?as=${p.id}`)}
            className="press raise w-full text-left rounded-3xl p-5">
            <div className="flex items-start gap-3.5">
              <span className="btn-solid w-12 h-12 shrink-0 rounded-2xl grid place-items-center text-white text-[19px]">
                <Icon name={p.mark} size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[18px] leading-tight tracking-[-0.01em]">{p.name}</div>
                <div className="text-[12px] text-ink-3 mt-0.5">{p.who}</div>
                <div className="text-[13.5px] text-ink-2 mt-2 leading-snug">{p.does}</div>
              </div>
              <span className="text-ink-3 text-[20px] leading-none mt-3">›</span>
            </div>
            <ul className="mt-4 pt-4 border-t border-line-2 space-y-1.5">
              {p.points.map(x => (
                <li key={x} className="flex gap-2 text-[12.5px] text-ink-2">
                  <span className="text-brand">·</span>{x}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </main>
    </>
  )
}
