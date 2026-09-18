import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import schemeForms from '../../data/schemeForms'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, Btn, Toggle, Notice, Pill, fmtDate } from '../../components/ui'

const WHO = { pregnant: 'Pregnant women', mother: 'Mothers with an infant', any: 'Anyone' }

export default function OfficerForms() {
  const nav = useNavigate()
  const published = useStore(s => s.publishedForms)
  const toggle = useStore(s => s.toggleForm)

  return (
    <>
      <TopBar title="Scheme forms" sub="What the field can fill" back onBack={() => nav('/officer')} />

      <main className="flex-1 px-4 py-4 space-y-5 pb-8">
        <Notice tone="info" title="Publishing reaches every phone">
          A form you switch on here is downloaded by every ASHA on her next sync and can be filled
          straight away. Switching one off withdraws it without removing anything already submitted.
        </Notice>

        <Section title={`Published · ${published.length} of ${schemeForms.length}`}>
          <div className="space-y-2.5">
            {schemeForms.map(f => {
              const on = published.includes(f.code)
              const count = f.sections.reduce((n, s) => n + s.fields.length, 0)
              const mapped = f.sections.flatMap(s => s.fields).filter(x => x.from).length
              return (
                <Card key={f.code} className={`p-4 ${on ? '' : 'opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[15.5px] leading-tight">{f.name}</div>
                      <div className="text-[12px] text-ink-3 mt-0.5">{f.subtitle} · {f.issuedBy}</div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11.5px] text-ink-3 num">
                        <span>{count} fields</span><span>·</span>
                        <span>{mapped} mapped to the record</span><span>·</span>
                        <span>{WHO[f.appliesTo]}</span>
                      </div>
                      <div className="text-[11.5px] text-ink-3 mt-1 num">
                        v{f.version}, published {fmtDate(f.publishedOn)}
                      </div>
                    </div>
                    <Toggle on={on} onClick={() => toggle(f.code)} label={f.name} />
                  </div>

                  <div className="mt-3 pt-3 border-t border-line-2 flex items-center gap-2">
                    <span className="text-brand shrink-0"><Icon name="check" size={15} stroke={2.3} /></span>
                    <span className="text-[12.5px] text-ink-2">
                      {Math.round((mapped / count) * 100)}% of this form fills itself from what an
                      ASHA has already recorded
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        </Section>

        <Btn full tone="dark" onClick={() => nav('/officer/add-programme')}>
          <Icon name="doc" size={18} /> Read a new form from a PDF
        </Btn>
      </main>
    </>
  )
}
