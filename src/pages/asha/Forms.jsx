import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { allForms } from '../../data/formRegistry'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, Pill, Notice, fmtDate } from '../../components/ui'

const SCHEME_ICON = { PMMVY: 'wallet', JSY: 'hospital', ICDS: 'bag' }
const WHO = { pregnant: 'Pregnant women', mother: 'Mothers with an infant', any: 'Anyone in the household' }

export default function Forms() {
  const nav = useNavigate()
  const published = useStore(s => s.publishedForms)
  const [forms, setForms] = useState([])
  useEffect(() => { allForms().then(setForms) }, [])

  // built-in forms obey the officer's switch; a form you scanned is always yours
  const live = forms.filter(f => !f.builtIn || published.includes(f.code))
  const mine = live.filter(f => !f.builtIn)
  const official = live.filter(f => f.builtIn)

  return (
    <>
      <TopBar title="Forms" sub={`${live.length} you can fill${mine.length ? ` · ${mine.length} scanned` : ''}`}
        back onBack={() => nav('/asha/add')} />

      <main className="flex-1 px-4 py-4 space-y-4 pb-8">
        <Notice tone="brand" title="These fill themselves">
          Pick a form, then pick the person. Everything already in her record is filled in for you.
          Only what is genuinely new comes up as a question.
        </Notice>

        {mine.length > 0 && (
          <Section title={`Forms you scanned · ${mine.length}`}>
            <div className="space-y-2.5">
              {mine.map(f => {
                const count = f.sections.reduce((n, s) => n + s.fields.length, 0)
                const mapped = f.sections.flatMap(s => s.fields).filter(x => !String(x.from).startsWith('scan.')).length
                return (
                  <Card key={f.code} onClick={() => nav(`/asha/forms/${f.code}`)} className="p-4">
                    <div className="flex items-start gap-3.5">
                      <span className="raise-sm w-11 h-11 shrink-0 rounded-xl grid place-items-center text-agent">
                        <Icon name="scan" size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-[16px] leading-tight">{f.name}</div>
                          <span className="text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5
                                           rounded bg-agent-soft text-agent">Scanned</span>
                        </div>
                        <div className="text-[12px] text-ink-3 mt-0.5">{f.issuedBy}</div>
                        <div className="flex flex-wrap gap-x-3 mt-2 text-[11.5px] text-ink-3 num">
                          <span>{count} fields</span><span>·</span>
                          <span>{mapped} fill themselves</span><span>·</span>
                          <span>saved {fmtDate(f.createdAt)}</span>
                        </div>
                      </div>
                      <span className="text-ink-3 shrink-0 mt-2"><Icon name="chevron" size={17} /></span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </Section>
        )}

        <Section title="Published by the block office">
          <div className="space-y-2.5">
            {official.map(f => {
              const count = f.sections.reduce((n, s) => n + s.fields.length, 0)
              return (
                <Card key={f.code} onClick={() => nav(`/asha/forms/${f.code}`)} className="p-4">
                  <div className="flex items-start gap-3.5">
                    <span className="raise-sm w-11 h-11 shrink-0 rounded-xl grid place-items-center text-brand">
                      <Icon name={SCHEME_ICON[f.scheme] || 'doc'} size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[16px] leading-tight">{f.name}</div>
                      <div className="text-[12px] text-ink-3 mt-0.5">{f.subtitle} · {f.issuedBy}</div>
                      <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">{f.about}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[11.5px] text-ink-3 num">
                        <span>{count} fields</span>
                        <span>·</span>
                        <span>{WHO[f.appliesTo]}</span>
                        <span>·</span>
                        <span>v{f.version}, {fmtDate(f.publishedOn)}</span>
                      </div>
                    </div>
                    <span className="text-ink-3 shrink-0 mt-2"><Icon name="chevron" size={17} /></span>
                  </div>
                </Card>
              )
            })}
          </div>
        </Section>

        <Card onClick={() => nav('/asha/scan')} className="p-4 flex items-center gap-3">
          <span className="text-agent shrink-0"><Icon name="scan" size={20} /></span>
          <div className="flex-1">
            <div className="font-semibold text-[15px]">Scan a paper form</div>
            <div className="text-[12.5px] text-ink-3 mt-0.5">Keep it and reuse it for any family</div>
          </div>
          <span className="text-ink-3"><Icon name="chevron" size={17} /></span>
        </Card>

        <Card onClick={() => nav('/asha/submissions')} className="p-4 flex items-center gap-3">
          <span className="text-brand shrink-0"><Icon name="history" size={20} /></span>
          <div className="flex-1">
            <div className="font-semibold text-[15px]">Forms you have filled</div>
            <div className="text-[12.5px] text-ink-3 mt-0.5">Saved on this phone</div>
          </div>
          <span className="text-ink-3"><Icon name="chevron" size={17} /></span>
        </Card>

        <p className="text-[11.5px] text-ink-3 px-1 leading-relaxed">
          Forms are published by the block office and reach every phone on the next sync. A new
          version replaces the old one without an app update.
        </p>
      </main>
    </>
  )
}
