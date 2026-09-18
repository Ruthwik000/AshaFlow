import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, queueSize } from '../../db/db'
import { useStore } from '../../store/useStore'
import { earningsHistory, REMINDERS } from '../../data/seed'
import { AppBar, Card, Section, List, Row, LevelDot, Pill, rupee, daysFromNow } from '../../components/ui'
import Icon from '../../components/Icon'
import { useT, dateLocale } from '../../i18n'

export default function Home() {
  const nav = useNavigate()
  const asha = useStore(s => s.asha)
  const t = useT()
  const [tasks, setTasks] = useState([])
  const [queued, setQueued] = useState(0)

  useEffect(() => {
    const rank = { late: 0, due: 1, info: 2 }
    db.tasks.toArray().then(t => setTasks(t.sort((a, b) => rank[a.level] - rank[b.level])))
    queueSize().then(setQueued)
  }, [])

  const month = earningsHistory.reduce((n, e) => n + e.amount, 0)
  const unclaimed = earningsHistory.filter(e => !e.claimed).length
  const today = new Date().toLocaleDateString(dateLocale(t.lang), { weekday: 'long', day: 'numeric', month: 'long' })
  const late = tasks.filter(t => t.level === 'late').length

  const QUICK = [
    { i: 'scan', l: t('home.scanForm'), to: '/asha/scan' },
    { i: 'assist', l: t('home.askAssistant'), to: '/asha/assistant' },
    { i: 'bell', l: t('home.reminders'), to: '/asha/reminders' },
  ]

  return (
    <>
      <AppBar title={`${t('home.greeting')}, ${asha.name.split(' ')[0]}`} sub={today} />

      <main className="flex-1 px-4 py-4 space-y-6">
        {/* the day at a glance */}
        <div className="raise rounded-2xl p-1">
          <div className="grid grid-cols-3 divide-x divide-line-2">
            {[[tasks.length, t('home.toVisit'), 'text-ink'],
              [late, t('home.overdue'), late ? 'text-late' : 'text-ink-3'],
              [queued, t('home.toSend'), queued ? 'text-due' : 'text-ink-3']].map(([v, l, c]) => (
              <div key={l} className="px-2 py-3 text-center">
                <div className={`text-[26px] font-bold num leading-none tracking-[-0.02em] ${c}`}>{v}</div>
                <div className="text-[11.5px] text-ink-3 mt-1.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* the one thing she does all day */}
        <button onClick={() => nav('/asha/add')}
          className="press btn-solid w-full rounded-3xl px-5 py-5 text-left">
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 shrink-0 rounded-2xl grid place-items-center text-[26px] font-light text-white"
              style={{ background: 'rgba(255,255,255,.16)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)' }}>
              <Icon name="plus" size={26} stroke={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[19px] font-bold text-white leading-tight tracking-[-0.01em]">{t('home.addEntry')}</div>
              <div className="text-[13px] text-white/75 mt-0.5">{t('home.addEntrySub')}</div>
            </div>
          </div>
        </button>

        <div className="grid grid-cols-3 gap-2.5">
          {QUICK.map(q => (
            <button key={q.l} onClick={() => nav(q.to)}
              className="press raise rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 relative">
              <span className="text-brand"><Icon name={q.i} size={21} /></span>
              <span className="text-[11.5px] font-semibold text-ink-2 text-center leading-tight">{q.l}</span>
            </button>
          ))}
        </div>

        <Section title={t('home.visitToday')}>
          <List>
            {tasks.map(t => (
              <Row key={t.id} onClick={() => nav(`/asha/family/${t.householdId}`)}
                icon={<LevelDot level={t.level} />}
                title={t.title}
                sub={`${t.reason} · ${t.house} · ${daysFromNow(t.due)}`} />
            ))}
          </List>
          <p className="text-[12px] text-ink-3 mt-2.5 px-1">{t('home.urgentFirst')}</p>
        </Section>

        <div className="grid grid-cols-2 gap-3">
          <Card onClick={() => nav('/asha/earnings')} className="p-4">
            <div className="text-[12.5px] text-ink-2">{t('home.thisMonth')}</div>
            <div className="text-[26px] font-bold text-brand num leading-none mt-1.5 tracking-[-0.02em]">{rupee(month)}</div>
            {unclaimed > 0 && <div className="mt-2.5"><Pill level="due">{unclaimed} {t('home.unclaimed')}</Pill></div>}
          </Card>
          <Card onClick={() => nav('/asha/sync')} className="p-4">
            <div className="text-[12.5px] text-ink-2">{t('home.toSend')}</div>
            <div className="text-[26px] font-bold num leading-none mt-1.5 tracking-[-0.02em]">{queued}</div>
            <div className="text-[12px] text-ink-3 mt-2">{queued === 0 ? t('home.allSent') : t('home.waiting')}</div>
          </Card>
        </div>

        <Section title={t('home.settingsMore')} action={
          <button onClick={() => nav('/asha/more')} className="text-[12.5px] font-semibold text-brand">
            {t('home.open')} ›
          </button>
        }>
          <List>
            <Row icon={<Icon name="bank" size={19} />} title={t('home.govPortal')} sub={t('home.govPortalSub')}
              onClick={() => nav('/asha/portal')} right={<Pill level="due">Demo</Pill>} />
            <Row icon={<Icon name="chart" size={19} />} title={t('home.counter')} sub={t('home.counterSub')}
              onClick={() => nav('/asha/proof')} />
          </List>
        </Section>
      </main>
    </>
  )
}
