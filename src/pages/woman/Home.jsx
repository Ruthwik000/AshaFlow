import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { WOMAN, WOMAN_SCHEMES, WOMAN_NEWS, WOMAN_DANGER, WOMAN_TIMELINE } from '../../data/seed'
import Icon from '../../components/Icon'
import WomanBar from '../../components/WomanBar'
import { Card, Section, Bar, Btn, List, Row, Notice, Pill, rupee, fmtDate, daysFromNow } from '../../components/ui'

const TAG = {
  foryou:  { l: 'For you',      c: 'bg-brand-soft text-brand' },
  village: { l: 'Your village', c: 'bg-info-soft text-info' },
  general: { l: 'General',      c: 'bg-line-2 text-ink-3' },
}

export default function WomanHome() {
  const nav = useNavigate()
  const mode = useStore(s => s.womanMode)
  const w = WOMAN[mode]
  const schemes = WOMAN_SCHEMES[mode]
  const news = WOMAN_NEWS[mode]
  const danger = WOMAN_DANGER[mode]
  const recent = WOMAN_TIMELINE[mode].slice(0, 2)

  const blocked = schemes.flatMap(s => s.stages.map(st => ({ ...st, scheme: s })))
                         .find(st => st.state === 'blocked')

  const progress = mode === 'pregnant'
    ? { label: `Month ${w.month} of 9`, right: `Baby due ${fmtDate(w.edd)}`, pct: (w.month / 9) * 100 }
    : { label: `${w.baby.name} is ${w.baby.months} months old`, right: `Born ${fmtDate(w.baby.dob)}`, pct: (w.baby.months / 12) * 100 }

  const TILES = [
    { icon: 'history', t: 'My record',  s: 'Every step, in order',      to: '/woman/records' },
    { icon: 'wallet',  t: 'Schemes',    s: 'What you are entitled to',  to: '/woman/schemes' },
    { icon: 'message', t: 'Ask',        s: 'Your questions, answered',  to: '/woman/ask' },
    { icon: 'hospital', t: 'Emergency', s: 'Call 102 — free',           to: '/woman', tone: 'late' },
  ]

  return (
    <>
      <WomanBar />

      <main className="flex-1 px-4 py-4 space-y-5 pb-4">

        <Card className="p-4">
          <div className="flex justify-between items-baseline mb-2.5 gap-3">
            <span className="text-[13.5px] font-semibold">{progress.label}</span>
            <span className="text-[12.5px] text-ink-3 num shrink-0">{progress.right}</span>
          </div>
          <Bar value={progress.pct} />
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-3">
            <span className="raise-sm w-10 h-10 shrink-0 rounded-xl grid place-items-center text-brand">
              <Icon name="calendar" size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] text-ink-2">Next</div>
              <div className="text-[18px] font-bold leading-tight mt-0.5">{w.nextVisit.label}</div>
              <div className="text-[13px] text-ink-2 mt-1 num">
                {fmtDate(w.nextVisit.date)} · {daysFromNow(w.nextVisit.date)}
              </div>
              <div className="text-[12.5px] text-ink-3 mt-0.5">{w.nextVisit.at}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <Btn size="md" tone="ghost"><Icon name="bell" size={17} /> Remind me</Btn>
            <Btn size="md" tone="ghost"><Icon name="phone" size={17} /> Call ASHA</Btn>
          </div>
        </Card>

        {blocked && (
          <Notice tone="late" title="One thing is holding up your money"
            action={<Btn size="md" onClick={() => nav(`/woman/scheme/${blocked.scheme.code}`)}>
              See what to do
            </Btn>}>
            <b className="text-ink">{blocked.scheme.short}</b>
            {blocked.amount > 0 ? ` — ${rupee(blocked.amount)} not released. ` : ' — '}
            {blocked.blocker}
          </Notice>
        )}

        <div className="grid grid-cols-2 gap-3">
          {TILES.map(x => (
            <button key={x.t} onClick={() => nav(x.to)}
              className={`press w-full text-left rounded-2xl p-4 ${x.tone === 'late' ? 'bg-late-soft border border-late/25' : 'raise'}`}
              style={x.tone === 'late' ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)' } : undefined}>
              <span className={x.tone === 'late' ? 'text-late' : 'text-brand'}>
                <Icon name={x.icon} size={21} />
              </span>
              <div className={`font-bold text-[15px] mt-2.5 leading-tight ${x.tone === 'late' ? 'text-late' : ''}`}>{x.t}</div>
              <div className={`text-[12px] mt-0.5 leading-snug ${x.tone === 'late' ? 'text-late/75' : 'text-ink-3'}`}>{x.s}</div>
            </button>
          ))}
        </div>

        <Section title="Latest in your record" action={
          <button onClick={() => nav('/woman/records')} className="text-[12.5px] font-semibold text-brand">See all ›</button>
        }>
          <List>
            {recent.map(r => (
              <Row key={r.id} icon={<Icon name={r.kind === 'payment' ? 'wallet' : r.kind === 'vaccine' ? 'syringe' : 'pulse'} size={19} />}
                title={r.title} sub={`${fmtDate(r.date)} · ${r.by}`}
                onClick={() => nav(`/woman/records#${r.id}`)} />
            ))}
          </List>
        </Section>

        <Section title="Go to hospital at once if">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
              {danger.map(d => (
                <div key={d.label} className="flex items-start gap-2.5">
                  <span className="text-late shrink-0 mt-0.5"><Icon name={d.icon} size={18} /></span>
                  <span className="text-[13px] font-medium leading-snug">{d.label}</span>
                </div>
              ))}
            </div>
            <Btn full tone="danger" size="md" className="mt-4">
              <Icon name="phone" size={17} /> Call 102 — free ambulance
            </Btn>
          </Card>
        </Section>

        <Section title="News for you">
          <div className="space-y-2.5">
            {news.map(n => (
              <Card key={n.id} className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${TAG[n.tag].c}`}>
                    {TAG[n.tag].l}
                  </span>
                  <span className="text-[11.5px] text-ink-3 num">{fmtDate(n.date)}</span>
                </div>
                <div className="font-bold text-[15px] leading-tight">{n.title}</div>
                <p className="text-[13.5px] text-ink-2 mt-1.5 leading-relaxed">{n.body}</p>
                <div className="flex items-center gap-1.5 mt-2.5 text-[11.5px] text-ink-3">
                  <Icon name="info" size={13} /> {n.source}
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </main>
    </>
  )
}
