import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { useSubject } from '../../hooks/useSubject'
import { WOMAN } from '../../data/seed'
import Icon from '../../components/Icon'
import WomanBar from '../../components/WomanBar'
import { Card, Section, Bar, Btn, List, Row, Notice, Pill, rupee, fmtDate, daysFromNow } from '../../components/ui'
import { useT } from '../../i18n'

const TAG = {
  foryou:  { k: 'w.tagForYou',  c: 'bg-brand-soft text-brand' },
  village: { k: 'w.tagVillage', c: 'bg-info-soft text-info' },
  general: { k: 'w.tagGeneral', c: 'bg-line-2 text-ink-3' },
}

export default function WomanHome() {
  const nav = useNavigate()
  const t = useT()
  const mode = useStore(s => s.womanMode)
  const [subject] = useSubject(mode)
  const w = WOMAN[mode]
  if (!subject) return <div className="p-6 text-ink-3">{t('w.reading')}</div>
  const { schemes, news, danger, timeline, liveCount } = subject
  const recent = timeline.slice(0, 2)

  const blocked = schemes.flatMap(s => s.stages.map(st => ({ ...st, scheme: s })))
                         .find(st => st.state === 'blocked')

  const progress = mode === 'pregnant'
    ? { label: t('w.monthOf', { n: w.month }), right: t('w.babyDue', { d: fmtDate(w.edd) }),
        pct: (w.month / 9) * 100 }
    : { label: t('w.babyIs', { name: w.baby.name, n: w.baby.months }),
        right: t('w.born', { d: fmtDate(w.baby.dob) }), pct: (w.baby.months / 12) * 100 }

  const TILES = [
    { icon: 'history',  k: 'w.tileRecord',    to: '/woman/records' },
    { icon: 'wallet',   k: 'w.tileSchemes',   to: '/woman/schemes' },
    { icon: 'message',  k: 'w.tileAsk',       to: '/woman/ask' },
    { icon: 'hospital', k: 'w.tileEmergency', to: '/woman', tone: 'late' },
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
              <div className="text-[12.5px] text-ink-2">{t('w.next')}</div>
              <div className="text-[18px] font-bold leading-tight mt-0.5">{w.nextVisit.label}</div>
              <div className="text-[13px] text-ink-2 mt-1 num">
                {fmtDate(w.nextVisit.date)} · {daysFromNow(w.nextVisit.date)}
              </div>
              <div className="text-[12.5px] text-ink-3 mt-0.5">{w.nextVisit.at}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <Btn size="md" tone="ghost"><Icon name="bell" size={17} /> {t('w.remindMe')}</Btn>
            <Btn size="md" tone="ghost"><Icon name="phone" size={17} /> {t('w.callAsha')}</Btn>
          </div>
        </Card>

        {blocked && (
          <Notice tone="late" title={t('w.blockedTitle')}
            action={<Btn size="md" onClick={() => nav(`/woman/scheme/${blocked.scheme.code}`)}>
              {t('w.seeWhatToDo')}
            </Btn>}>
            <b className="text-ink">{blocked.scheme.short}</b>
            {blocked.amount > 0 ? ` — ${t('w.notReleased', { amount: rupee(blocked.amount) })} ` : ' — '}
            {blocked.blocker}
          </Notice>
        )}

        <div className="grid grid-cols-2 gap-3">
          {TILES.map(x => (
            <button key={x.k} onClick={() => nav(x.to)}
              className={`press w-full text-left rounded-2xl p-4 ${x.tone === 'late' ? 'bg-late-soft border border-late/25' : 'raise'}`}
              style={x.tone === 'late' ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)' } : undefined}>
              <span className={x.tone === 'late' ? 'text-late' : 'text-brand'}>
                <Icon name={x.icon} size={21} />
              </span>
              <div className={`font-bold text-[15px] mt-2.5 leading-tight ${x.tone === 'late' ? 'text-late' : ''}`}>{t(x.k)}</div>
              <div className={`text-[12px] mt-0.5 leading-snug ${x.tone === 'late' ? 'text-late/75' : 'text-ink-3'}`}>{t(x.k + 'Sub')}</div>
            </button>
          ))}
        </div>

        <Section title={liveCount ? t('w.latestNew', { n: liveCount }) : t('w.latest')} action={
          <button onClick={() => nav('/woman/records')} className="text-[12.5px] font-semibold text-brand">
            {t('w.seeAll')} ›
          </button>
        }>
          <List>
            {recent.map(r => (
              <Row key={r.id} icon={<Icon name={r.kind === 'payment' ? 'wallet' : r.kind === 'vaccine' ? 'syringe' : 'pulse'} size={19} />}
                title={r.title} sub={`${fmtDate(r.date)} · ${r.by}`}
                onClick={() => nav(`/woman/records#${r.id}`)} />
            ))}
          </List>
        </Section>

        <Section title={t('w.dangerTitle')}>
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
              {danger.map(d => (
                <div key={d.label} className="flex items-start gap-2.5">
                  <span className="text-late shrink-0 mt-0.5"><Icon name={d.icon} size={18} /></span>
                  <span className="text-[13px] font-medium leading-snug">{d.key ? t(d.key) : d.label}</span>
                </div>
              ))}
            </div>
            <Btn full tone="danger" size="md" className="mt-4">
              <Icon name="phone" size={17} /> {t('w.call102')}
            </Btn>
          </Card>
        </Section>

        <Section title={t('w.newsTitle')}>
          {t.lang !== 'en' && (
            <div className="flex items-start gap-1.5 rounded-xl bg-due-soft border border-due/25 px-3 py-2 mb-2.5">
              <span className="text-due shrink-0 mt-0.5"><Icon name="info" size={13} /></span>
              <span className="text-[11.5px] text-due leading-snug">{t('w.contentEnglish')}</span>
            </div>
          )}
          <div className="space-y-2.5">
            {news.map(n => (
              <Card key={n.id} className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${TAG[n.tag].c}`}>
                    {t(TAG[n.tag].k)}
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
