import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { resetAll } from '../../db/db'
import { useT, LANGS } from '../../i18n'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, List, Row, Btn, Toggle, Avatar, Pill, LangSheet, Notice } from '../../components/ui'
import { providerStatus, hasOCR, hasAnyChat } from '../../ai/config'

function Switch({ icon, label, sub, on, onClick }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {icon && <span className="text-ink-3 shrink-0 w-6 grid place-items-center"><Icon name={icon} size={19} /></span>}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[14.5px] leading-tight">{label}</div>
        {sub && <div className="text-[12.5px] text-ink-3 mt-0.5 leading-snug">{sub}</div>}
      </div>
      <Toggle on={on} onClick={onClick} label={label} />
    </div>
  )
}

export default function More() {
  const nav = useNavigate()
  const s = useStore()
  const t = useT()
  const [langOpen, setLangOpen] = useState(false)
  const current = LANGS.find(l => l.code === t.lang)

  return (
    <>
      <TopBar title={t('settings.title')} back onBack={() => nav('/asha')} />
      <main className="flex-1 px-4 py-4 space-y-5 pb-8">

        <Card onClick={() => nav('/asha/profile')} className="p-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={s.asha.name} size={48} />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[16.5px] leading-tight">{s.asha.name}</div>
              <div className="text-[12.5px] text-ink-3 num mt-0.5">{s.asha.id} · {s.asha.village}</div>
            </div>
            <span className="text-ink-3 shrink-0"><Icon name="chevron" size={17} /></span>
          </div>
        </Card>

        <Section title={t('common.language')}>
          <List>
            <Row icon={<Icon name="globe" size={19} />} title={t('common.language')}
              sub={`${current?.native} · ${LANGS.filter(l => l.ready).length} reviewed`}
              onClick={() => setLangOpen(true)} />
          </List>
          <p className="text-[11.5px] text-ink-3 mt-2 px-1 leading-relaxed">{t('settings.langNote')}</p>
        </Section>

        <Section title={t('settings.display')}>
          <List>
            <Switch icon="doc" label={t('settings.biggerText')} sub={t('settings.biggerTextSub')}
              on={s.bigText} onClick={s.toggleBigText} />
            <Switch icon="assist" label={t('common.readAloud')} sub={t('settings.readAloudSub')}
              on={s.speak} onClick={s.toggleSpeak} />
          </List>
        </Section>

        <Section title={t('settings.data')}>
          <List>
            <Row icon={<Icon name="sync" size={19} />} title="Sync" sub="Send queued visits"
              onClick={() => nav('/asha/sync')} />
            <Switch icon="globe" label={t('settings.pretendOffline')} sub={t('settings.pretendOfflineSub')}
              on={s.demoOffline} onClick={s.toggleDemoOffline} />
            <Row icon={<Icon name="bank" size={19} />} title="Government portal" sub="Claims and proofs"
              onClick={() => nav('/asha/portal')} right={<Pill level="due">Demo</Pill>} />
          </List>
        </Section>

        <Section title="Models">
          <List>
            {providerStatus().map(p => (
              <Row key={p.id} icon={<Icon name={p.id === 'local' ? 'shield' : 'assist'} size={19} />}
                title={p.label} sub={p.note}
                right={<Pill level={p.state === 'on' ? 'done' : 'due'}>
                  {p.state === 'on' ? 'Ready' : 'Not set'}
                </Pill>} />
            ))}
          </List>
          <div className="mt-2.5">
            <Btn full tone="ghost" size="md" onClick={() => nav('/asha/diagnostics')}>
              <Icon name="shield" size={17} /> Test the connections
            </Btn>
          </div>
          <div className="mt-2.5">
            <Notice tone={hasAnyChat() ? 'info' : 'due'}
              title={hasAnyChat() ? 'Chat order' : 'No model key set'}>
              {hasAnyChat()
                ? 'Gemini answers first. If it fails, Grok. If both fail or there is no signal, the offline engine answers from her record — so a question is never left unanswered.'
                : 'Add VITE_GEMINI_API_KEY and VITE_GROK_API_KEY to .env. Everything still works without them: the offline engine reads her record, and scanning walks a worked sample.'}
              {hasOCR() ? ' Scanning a paper form uses Grok vision (with Gemini fallback).' : ' Scanning needs a Grok or Gemini key to read a real photograph.'}
            </Notice>
          </div>
          <p className="text-[11.5px] text-ink-3 mt-2 px-1 leading-relaxed">
            Vite inlines these keys into the built JavaScript, so they are visible to anyone who
            opens the page. Fine for a prototype with throwaway keys; before real use they move
            behind the backend and <code>VITE_AI_PROXY</code> is set instead.
          </p>
        </Section>

        <Section title={t('settings.privacy')}>
          <List>
            <Row icon={<Icon name="shield" size={19} />} title="Consent records"
              sub="What each household agreed to, and when" />
            <Row icon={<Icon name="doc" size={19} />} title="Data on this phone"
              sub="Encrypted. Nothing leaves until you sync." />
            <Row icon={<Icon name="chart" size={19} />} title={t('home.counter')}
              sub={t('home.counterSub')} onClick={() => nav('/asha/proof')} />
          </List>
        </Section>

        <Section title={t('settings.otherPortals')}>
          <List>
            <Row icon={<Icon name="bank" size={19} />} title="Government officer"
              sub="Coverage and alerts" onClick={() => nav('/officer')} />
            <Row icon={<Icon name="user" size={19} />} title="Pregnant woman"
              sub="Her record, schemes and questions" onClick={() => nav('/woman')} />
          </List>
        </Section>

        <Section title={t('settings.about')}>
          <Card className="p-4">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="btn-solid w-8 h-8 rounded-[10px] grid place-items-center text-white text-[13px] font-bold">◈</span>
              <div>
                <div className="font-bold text-[15px]">ASHAFlow</div>
                <div className="text-[11.5px] text-ink-3 num">version 0.2 · prototype</div>
              </div>
            </div>
            <p className="text-[12.5px] text-ink-2 leading-relaxed">
              Not connected to any real government health information system. All data shown is
              synthetic and no real individual's health information is collected or processed.
            </p>
          </Card>
        </Section>

        <div className="space-y-2.5 pt-1">
          <Btn full tone="ghost" onClick={() => { if (confirm('Reset all demo data?')) resetAll() }}>
            {t('settings.reset')}
          </Btn>
          <Btn full tone="ghost" onClick={() => { s.logout(); nav('/portals') }}>
            <Icon name="logout" size={18} /> {t('common.signOut')}
          </Btn>
        </div>
      </main>
      {langOpen && <LangSheet onClose={() => setLangOpen(false)} />}
    </>
  )
}
