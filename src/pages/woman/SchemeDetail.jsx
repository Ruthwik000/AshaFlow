import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { WOMAN_SCHEMES } from '../../data/seed'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, Btn, List, Row, rupee, fmtDate } from '../../components/ui'

export default function SchemeDetail() {
  const { code } = useParams()
  const nav = useNavigate()
  const mode = useStore(s => s.womanMode)
  const s = WOMAN_SCHEMES[mode].find(x => x.code === code)
  if (!s) return <div className="p-6 text-ink-3">Not found</div>

  const dot = { done: 'btn-solid text-white', blocked: 'btn-danger text-white', pending: 'sink text-ink-3' }
  const line = { done: 'bg-brand', blocked: 'bg-late', pending: 'bg-line' }

  return (
    <>
      <TopBar title={s.short} sub={s.name} back onBack={() => nav('/woman/schemes')} />
      <main className="flex-1 px-4 py-4 space-y-5 pb-8">

        <Card className="p-5">
          <div className="text-[12.5px] text-ink-2 mb-1.5">What this is</div>
          <p className="text-[15px] leading-relaxed">{s.what}</p>
          <div className="mt-4 pt-4 border-t border-line-2">
            <div className="text-[12.5px] text-ink-2 mb-1">How much</div>
            <p className="text-[15px] font-semibold leading-snug">{s.amount}</p>
          </div>
        </Card>

        <Section title="Who can get it">
          <List>
            {s.who.map(x => (
              <Row key={x} icon={<span className="text-brand"><Icon name="check" size={17} stroke={2.3} /></span>}
                title={<span className="font-normal text-[14px]">{x}</span>} />
            ))}
          </List>
        </Section>

        <Section title="Papers you need">
          <List>
            {s.needs.map(x => (
              <Row key={x} icon={<Icon name="doc" size={18} />}
                title={<span className="font-normal text-[14px]">{x}</span>} />
            ))}
          </List>
        </Section>

        <Section title="Where it has reached">
          <Card className="p-5">
            {s.stages.map((st, i) => (
              <div key={i} className="flex gap-3.5">
                <div className="flex flex-col items-center shrink-0">
                  <span className={`w-7 h-7 rounded-full grid place-items-center ${dot[st.state]}`}>
                    {st.state === 'done'
                      ? <Icon name="check" size={14} stroke={2.6} />
                      : st.state === 'blocked'
                        ? <Icon name="alert" size={13} stroke={2.2} />
                        : <span className="text-[12px] font-bold num">{i + 1}</span>}
                  </span>
                  {i < s.stages.length - 1 && <span className={`w-0.5 flex-1 my-1 ${line[st.state]}`} />}
                </div>

                <div className={`min-w-0 flex-1 ${i === s.stages.length - 1 ? '' : 'pb-6'}`}>
                  <div className="font-semibold text-[15px] leading-tight">{st.label}</div>
                  {st.amount > 0 && <div className="text-[16px] font-bold num mt-1">{rupee(st.amount)}</div>}
                  {st.date && <div className="text-[12.5px] text-ink-3 mt-0.5 num">{fmtDate(st.date)}</div>}
                  {st.note && <div className="text-[12.5px] text-ink-2 mt-1 leading-snug">{st.note}</div>}

                  {st.state === 'blocked' && (
                    <div className="mt-3 rounded-2xl bg-late-soft border border-late/25 p-4"
                      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)' }}>
                      <div className="flex items-center gap-1.5 text-[13px] font-bold text-late">
                        <Icon name="alert" size={15} /> Why it has not happened
                      </div>
                      <p className="text-[13.5px] text-ink-2 mt-1.5 leading-relaxed">{st.blocker}</p>
                      <div className="text-[13px] font-bold text-ink mt-3">What to do</div>
                      <p className="text-[13.5px] text-ink-2 mt-1 leading-relaxed">{st.fix}</p>
                      <div className="grid grid-cols-2 gap-2.5 mt-3.5">
                        <Btn size="sm" tone="ghost"><Icon name="phone" size={15} /> Ask my ASHA</Btn>
                        <Btn size="sm" tone="ghost" onClick={() => nav('/woman/ask')}>
                          <Icon name="message" size={15} /> Ask here
                        </Btn>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </Section>

        <div className="flex items-start gap-2 px-1">
          <span className="text-ink-3 shrink-0 mt-0.5"><Icon name="info" size={14} /></span>
          <p className="text-[11.5px] text-ink-3 leading-relaxed">{s.verify}</p>
        </div>
      </main>
    </>
  )
}
