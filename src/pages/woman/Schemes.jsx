import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { WOMAN_SCHEMES } from '../../data/seed'
import Icon from '../../components/Icon'
import WomanBar from '../../components/WomanBar'
import { Card, Section, Pill, Bar, rupee } from '../../components/ui'
import { useT } from '../../i18n'

const STATE = { active: 'done', blocked: 'late', due: 'due', waiting: 'info' }
const WORD = { active: 'w.stRunning', blocked: 'w.stHeld', due: 'w.stDue', waiting: 'w.stWaiting' }

export default function Schemes() {
  const nav = useNavigate()
  const t = useT()
  const mode = useStore(s => s.womanMode)
  const schemes = WOMAN_SCHEMES[mode]

  const paid = schemes.flatMap(s => s.stages).filter(s => s.state === 'done')
    .reduce((n, s) => n + (s.amount || 0), 0)
  const owed = schemes.flatMap(s => s.stages).filter(s => s.state !== 'done')
    .reduce((n, s) => n + (s.amount || 0), 0)
  const held = schemes.filter(s => s.state === 'blocked').length

  return (
    <>
      <WomanBar title={t('w.schemes')} sub={t('w.entitled', { n: schemes.length })} />

      <main className="flex-1 px-4 py-4 space-y-5 pb-4">

        <Card className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[12.5px] text-ink-2">{t('w.received')}</div>
              <div className="text-[28px] font-bold num text-brand leading-none mt-1.5 tracking-[-0.02em]">
                {rupee(paid)}
              </div>
            </div>
            <div>
              <div className="text-[12.5px] text-ink-2">{t('w.stillToCome')}</div>
              <div className="text-[28px] font-bold num leading-none mt-1.5 tracking-[-0.02em]">{rupee(owed)}</div>
            </div>
          </div>
          <div className="mt-4"><Bar value={(paid / Math.max(paid + owed, 1)) * 100} /></div>
          {held > 0 && (
            <p className="text-[12.5px] text-late font-semibold mt-3">
              {held > 1 ? t('w.heldMany', { n: held }) : t('w.heldOne')}
            </p>
          )}
        </Card>

        <Section title={t('w.yourSchemes')}>
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
                        {nextStage ? (nextStage.blocker || nextStage.label) : t('w.allComplete')}
                      </div>
                      <div className="text-[11.5px] text-ink-3 mt-1.5 num">
                        {t('w.stepOf', { a: doneCount, b: s.stages.length })}
                      </div>
                    </div>
                    <Pill level={STATE[s.state]}>{t(WORD[s.state])}</Pill>
                  </div>
                </Card>
              )
            })}
          </div>
        </Section>

        <p className="text-[11.5px] text-ink-3 px-1 leading-relaxed">{t('w.schemeNote')}</p>
      </main>
    </>
  )
}
