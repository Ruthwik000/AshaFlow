import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { WOMAN } from '../../data/seed'
import programmes from '../../data/programmes'
import Icon from '../../components/Icon'
import WomanBar, { statusLine } from '../../components/WomanBar'
import { Card, Section, List, Row, Btn, Toggle, Notice, Avatar, LangSheet, fmtDate } from '../../components/ui'
import { useT, LANGS } from '../../i18n'

const SHARE = {
  RCH:      { gets: 'name, age, check-up dates, test results', withheld: ['TB information', 'NCD screening'] },
  UWIN:     { gets: 'name, contact, vaccine dates',            withheld: ['Haemoglobin', 'TB information'] },
  HMIS:     { gets: 'numbers only',                            withheld: ['Name', 'Address', 'Any identifier'] },
  CBAC:     { gets: 'name, age, screening answers',            withheld: ['Pregnancy details'] },
  REGISTER: { gets: 'household and visit record',              withheld: [] },
}

export default function Me() {
  const nav = useNavigate()
  const t = useT()
  const mode = useStore(s => s.womanMode)
  const setMode = useStore(s => s.setWomanMode)
  const logout = useStore(s => s.logout)
  const w = WOMAN[mode]
  const [consent, setConsent] = useState(Object.fromEntries(programmes.map(p => [p.code, true])))
  const [langOpen, setLangOpen] = useState(false)

  return (
    <>
      <WomanBar title={t('w.myDetails')} sub={t('w.myDetailsSub')} />

      <main className="flex-1 px-4 py-4 space-y-5 pb-4">

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Avatar name={w.name} size={60} />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[19px] leading-tight tracking-[-0.015em]">{w.name}</div>
              <div className="text-[12.5px] text-ink-2 mt-0.5">{statusLine(t, mode, w)}</div>
              <div className="text-[12.5px] text-ink-3 mt-1">House {w.houseNo} · {w.village}</div>
            </div>
          </div>
        </Card>

        <Section title={t('w.yourDetails')}>
          <List>
            <Row icon={<Icon name="id" size={19} />} title={t('w.rchId')} sub={w.rchId} />
            <Row icon={<Icon name="shield" size={19} />} title={t('w.abha')} sub={w.abha} />
            <Row icon={<Icon name="phone" size={19} />} title={t('w.mobile')} sub={w.mobile} />
            <Row icon={<Icon name="user" size={19} />} title={t('w.husband')} sub={w.husband} />
          </List>
        </Section>

        <Section title={t('w.yourWorkers')}>
          <List>
            <Row icon={<Icon name="user" size={19} />} title={w.asha} sub={`${t('w.yourAsha')} · ${w.ashaPhone}`}
              right={<Btn size="sm" tone="ghost"><Icon name="phone" size={14} /> {t('w.call')}</Btn>} />
            <Row icon={<Icon name="user" size={19} />} title={w.anm} sub={t('w.anm')} />
            <Row icon={<Icon name="hospital" size={19} />} title={w.phc} sub={t('w.healthCentre')} />
          </List>
        </Section>

        <Section title={t('w.whoSees')}>
          <div className="space-y-2.5">
            {programmes.map(p => {
              const sh = SHARE[p.code]
              const on = consent[p.code]
              return (
                <Card key={p.code} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[14.5px] leading-tight">{p.shortName}</div>
                      <div className="text-[12.5px] text-ink-2 mt-1">{t('w.gets', { what: sh.gets })}</div>
                      {sh.withheld.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {sh.withheld.map(x => (
                            <span key={x} className="text-[11.5px] text-ink-3 line-through sink px-2 py-0.5 rounded">
                              {x}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Toggle on={on} label={p.shortName}
                      onClick={() => setConsent(c => ({ ...c, [p.code]: !c[p.code] }))} />
                  </div>
                </Card>
              )
            })}
          </div>
          <div className="mt-3">
            <Notice tone="brand" title={t('w.itsYoursTitle')}>
              {t('w.itsYoursBody')}
            </Notice>
          </div>
        </Section>

        <Section title={t('w.settings')}>
          <List>
            <Row icon={<Icon name="globe" size={19} />} title={t('w.language')} sub={LANGS.find(l => l.code === t.lang)?.native || 'English'}
              onClick={() => setLangOpen(true)} />
            <Row icon={<Icon name="bell" size={19} />} title={t('w.reminders')} sub={t('w.remindersSub')} />
            <Row icon={<Icon name="doc" size={19} />} title={t('w.myDocs')} sub={t('w.myDocsSub')} />
          </List>
        </Section>

        <Section title={t('w.switchAccount')}>
          <Card className="p-4">
            <div className="text-[13px] text-ink-2 leading-relaxed mb-3">
              {t('w.switchBody')}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[['pregnant', t('w.pregnantWoman'), 'Sunita Devi'], ['mother', t('w.motherOfBaby'), 'Rekha Kumari']]
                .map(([k, l, who]) => (
                <button key={k} onClick={() => { setMode(k); nav('/woman') }}
                  className={`press rounded-2xl px-3 py-3.5 text-left ${mode === k ? 'btn-solid text-white' : 'raise'}`}>
                  <div className="text-[13.5px] font-bold leading-tight">{l}</div>
                  <div className={`text-[11.5px] mt-1 ${mode === k ? 'text-white/70' : 'text-ink-3'}`}>{who}</div>
                </button>
              ))}
            </div>
          </Card>
        </Section>

        <div className="space-y-2.5 pt-1">
          <Btn full tone="ghost" onClick={() => nav('/asha/more')}>{t('w.backToWorker')}</Btn>
          <Btn full tone="ghost" onClick={() => { logout(); nav('/portals') }}>
            <Icon name="logout" size={18} /> {t('w.signOut')}
          </Btn>
          <p className="text-[11.5px] text-ink-3 text-center leading-relaxed pt-1">
            {t('w.prototypeNote')}
          </p>
        </div>
      </main>
      {langOpen && <LangSheet onClose={() => setLangOpen(false)} />}
    </>
  )
}
