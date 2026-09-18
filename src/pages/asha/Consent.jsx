import { useNavigate, Navigate } from 'react-router-dom'
import { useStore, say } from '../../store/useStore'
import programmes from '../../data/programmes'
import { fieldsFor } from '../../engine/solver'
import { TopBar, Btn, Speaker, Notice } from '../../components/ui'

const TEXT = 'May we save her health details for the government health programmes? You can say no, and you can change your mind later.'

export default function Consent() {
  const nav = useNavigate()
  const draft = useStore(s => s.draft)
  const answer = useStore(s => s.answer)
  if (!draft) return <Navigate to="/asha" replace />

  // Only the registers this kind of visit actually feeds.
  const relevant = programmes
    .map(p => ({ ...p, n: fieldsFor(p, draft.type).length }))
    .filter(p => p.n > 0)

  const give = value => {
    answer({ 'visit.consentGiven': value }, { key: 'visit.consentGiven', paths: ['visit.consentGiven'], label: 'Consent taken', value: value ? 'Yes' : 'No' })
    nav('/asha/capture')
  }

  return (
    <>
      <TopBar title="Permission" sub={draft.memberName || 'This household'} back />
      <main className="flex-1 px-4 py-5 flex flex-col">
        <div className="bg-surface border border-line rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <p className="text-[18px] leading-relaxed font-medium flex-1">{TEXT}</p>
            <Speaker text={TEXT} />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[14px] font-semibold text-ink-2 mb-2 px-1">This would go to</p>
          <div className="space-y-1.5">
            {relevant.map(p => (
              <div key={p.code} className="flex items-center gap-2.5 bg-surface border border-line rounded-xl px-3.5 py-2.5">
                <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                <span className="text-[14px] font-medium flex-1">{p.shortName}</span>
                <span className="text-[11.5px] text-ink-3">{p.code === 'HMIS' ? 'counts only' : `${p.n} fields`}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <Notice tone="brand">
            She can see everything that was written, and say no later.
          </Notice>
        </div>

        <div className="mt-auto pt-6 space-y-2.5 safe-bot">
          <Btn full onClick={() => give(true)}>Yes, she agrees</Btn>
          <div className="grid grid-cols-2 gap-2.5">
            <Btn tone="ghost" onClick={() => give(false)}>No</Btn>
            <Btn tone="ghost" onClick={() => nav(-1)}>Ask later</Btn>
          </div>
        </div>
      </main>
    </>
  )
}
