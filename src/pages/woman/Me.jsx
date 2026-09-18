import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { WOMAN } from '../../data/seed'
import programmes from '../../data/programmes'
import Icon from '../../components/Icon'
import WomanBar from '../../components/WomanBar'
import { Card, Section, List, Row, Btn, Toggle, Notice, Avatar, LangSheet, fmtDate } from '../../components/ui'

const SHARE = {
  RCH:      { gets: 'name, age, check-up dates, test results', withheld: ['TB information', 'NCD screening'] },
  UWIN:     { gets: 'name, contact, vaccine dates',            withheld: ['Haemoglobin', 'TB information'] },
  HMIS:     { gets: 'numbers only',                            withheld: ['Name', 'Address', 'Any identifier'] },
  CBAC:     { gets: 'name, age, screening answers',            withheld: ['Pregnancy details'] },
  REGISTER: { gets: 'household and visit record',              withheld: [] },
}

export default function Me() {
  const nav = useNavigate()
  const mode = useStore(s => s.womanMode)
  const setMode = useStore(s => s.setWomanMode)
  const logout = useStore(s => s.logout)
  const w = WOMAN[mode]
  const [consent, setConsent] = useState(Object.fromEntries(programmes.map(p => [p.code, true])))
  const [langOpen, setLangOpen] = useState(false)

  return (
    <>
      <WomanBar title="My details" sub="Who you are and who sees your record" />

      <main className="flex-1 px-4 py-4 space-y-5 pb-4">

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Avatar name={w.name} size={60} />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[19px] leading-tight tracking-[-0.015em]">{w.name}</div>
              <div className="text-[12.5px] text-ink-2 mt-0.5">{w.statusLine}</div>
              <div className="text-[12.5px] text-ink-3 mt-1">House {w.houseNo} · {w.village}</div>
            </div>
          </div>
        </Card>

        <Section title="Your details">
          <List>
            <Row icon={<Icon name="id" size={19} />} title="RCH ID" sub={w.rchId} />
            <Row icon={<Icon name="shield" size={19} />} title="ABHA number" sub={w.abha} />
            <Row icon={<Icon name="phone" size={19} />} title="Mobile" sub={w.mobile} />
            <Row icon={<Icon name="user" size={19} />} title="Husband" sub={w.husband} />
          </List>
        </Section>

        <Section title="Your health workers">
          <List>
            <Row icon={<Icon name="user" size={19} />} title={w.asha} sub={`Your ASHA · ${w.ashaPhone}`}
              right={<Btn size="sm" tone="ghost"><Icon name="phone" size={14} /> Call</Btn>} />
            <Row icon={<Icon name="user" size={19} />} title={w.anm} sub="ANM" />
            <Row icon={<Icon name="hospital" size={19} />} title={w.phc} sub="Your health centre" />
          </List>
        </Section>

        <Section title="Who sees your record">
          <div className="space-y-2.5">
            {programmes.map(p => {
              const sh = SHARE[p.code]
              const on = consent[p.code]
              return (
                <Card key={p.code} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[14.5px] leading-tight">{p.shortName}</div>
                      <div className="text-[12.5px] text-ink-2 mt-1">Gets: {sh.gets}</div>
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
            <Notice tone="brand" title="It is your information">
              You can read everything that was written about you, see exactly where each part went,
              and switch any of it off. Turning one off does not affect your care.
            </Notice>
          </div>
        </Section>

        <Section title="Settings">
          <List>
            <Row icon={<Icon name="globe" size={19} />} title="Language" sub="English"
              onClick={() => setLangOpen(true)} />
            <Row icon={<Icon name="bell" size={19} />} title="Reminders" sub="Visit and vaccine alerts" />
            <Row icon={<Icon name="doc" size={19} />} title="My documents" sub="Aadhaar, bank passbook, MCP card" />
          </List>
        </Section>

        <Section title="Demonstration">
          <Card className="p-4">
            <div className="text-[13px] text-ink-2 leading-relaxed mb-3">
              The same interface serves both a pregnant woman and a mother with an infant. Switch
              between them to see how the content changes.
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[['pregnant', 'Pregnant woman', 'Sunita Devi'], ['mother', 'Mother of a baby', 'Rekha Kumari']]
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
          <Btn full tone="ghost" onClick={() => nav('/asha/more')}>Back to the worker app</Btn>
          <Btn full tone="ghost" onClick={() => { logout(); nav('/portals') }}>
            <Icon name="logout" size={18} /> Sign out
          </Btn>
          <p className="text-[11.5px] text-ink-3 text-center leading-relaxed pt-1">
            Prototype. Synthetic data only. Not connected to any real government health
            information system.
          </p>
        </div>
      </main>
      {langOpen && <LangSheet onClose={() => setLangOpen(false)} />}
    </>
  )
}
