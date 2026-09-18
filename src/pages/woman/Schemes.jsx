import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { WOMAN_SCHEMES } from '../../data/seed'
import Icon from '../../components/Icon'
import WomanBar from '../../components/WomanBar'
import { Card, Section, Pill, Bar, rupee } from '../../components/ui'

const STATE = { active: 'done', blocked: 'late', due: 'due', waiting: 'info' }
const WORD = { active: 'Running', blocked: 'Held up', due: 'Due now', waiting: 'Waiting' }

export default function Schemes() {
  const nav = useNavigate()
  const mode = useStore(s => s.womanMode)
  const schemes = WOMAN_SCHEMES[mode]

  const paid = schemes.flatMap(s => s.stages).filter(s => s.state === 'done')
    .reduce((n, s) => n + (s.amount || 0), 0)
  const owed = schemes.flatMap(s => s.stages).filter(s => s.state !== 'done')
    .reduce((n, s) => n + (s.amount || 0), 0)
  const held = schemes.filter(s => s.state === 'blocked').length

  return (
    <>
      <WomanBar title="Schemes" sub={`${schemes.length} you are entitled to`} />

      <main className="flex-1 px-4 py-4 space-y-5 pb-4">

        <Card className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[12.5px] text-ink-2">Received so far</div>
              <div className="text-[28px] font-bold num text-brand leading-none mt-1.5 tracking-[-0.02em]">
                {rupee(paid)}
              </div>
            </div>
            <div>
              <div className="text-[12.5px] text-ink-2">Still to come</div>
              <div className="text-[28px] font-bold num leading-none mt-1.5 tracking-[-0.02em]">{rupee(owed)}</div>
            </div>
          </div>
          <div className="mt-4"><Bar value={(paid / Math.max(paid + owed, 1)) * 100} /></div>
          {held > 0 && (
            <p className="text-[12.5px] text-late font-semibold mt-3">
              {held} {held > 1 ? 'schemes are' : 'scheme is'} held up on a document.
            </p>
          )}
        </Card>

        <Section title="Your schemes">
          <div className="space-y-2.5">
            {schemes.map(s => {
              const nextStage = s.stages.find(x => x.state !== 'done')
              const doneCount = s.stages.filter(x => x.state === 'done').length
              return (
                <Card key={s.code} onClick={() => nav(`/woman/scheme/${s.code}`)} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className={`raise-sm w-11 h-11 shrink-0 rounded-xl grid place-items-center
                      ${s.state === 'blocked' ? 'text-late' : 'text-brand'}`}>
                      <Icon name={s.code === 'IMM' ? 'syringe' : s.code === 'ICDS' ? 'bag'
                        : s.code === 'FREE' ? 'hospital' : 'wallet'} size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[16px] leading-tight">{s.short}</div>
                      <div className="text-[12px] text-ink-3 mt-0.5 leading-snug">{s.name}</div>
                      <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">{s.what}</p>
                      <div className={`text-[13px] mt-2.5 font-semibold
                        ${s.state === 'blocked' ? 'text-late' : s.state === 'due' ? 'text-due' : 'text-ink-2'}`}>
                        {nextStage ? (nextStage.blocker || nextStage.label) : 'All steps complete'}
                      </div>
                      <div className="text-[11.5px] text-ink-3 mt-1.5 num">
                        Step {doneCount} of {s.stages.length}
                      </div>
                    </div>
                    <Pill level={STATE[s.state]}>{WORD[s.state]}</Pill>
                  </div>
                </Card>
              )
            })}
          </div>
        </Section>

        <p className="text-[11.5px] text-ink-3 px-1 leading-relaxed">
          Amounts and conditions differ by state and are revised from time to time. These are
          demonstration values held in a configuration file — check the official scheme page before
          relying on them.
        </p>
      </main>
    </>
  )
}
