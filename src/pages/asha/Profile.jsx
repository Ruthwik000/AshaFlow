import { useNavigate } from 'react-router-dom'
import { PROFILE } from '../../data/seed'
import { useStore } from '../../store/useStore'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, List, Row, Btn, Pill, Avatar, IconBtn, rupee, fmtDate } from '../../components/ui'

export default function Profile() {
  const nav = useNavigate()
  const logout = useStore(s => s.logout)
  const p = PROFILE
  const pending = p.verified.filter(v => v.state !== 'ok').length

  return (
    <>
      <TopBar title="Profile" back onBack={() => nav('/asha')}
        right={<IconBtn icon="settings" label="Settings" onClick={() => nav('/asha/more')} />} />

      <main className="flex-1 px-4 py-4 space-y-5 pb-8">

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Avatar name={p.name} size={64} />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[20px] leading-tight tracking-[-0.015em]">{p.name}</div>
              <div className="text-[12.5px] text-ink-2 mt-0.5">{p.role}</div>
              <div className="text-[12.5px] text-ink-3 num mt-1">{p.ashaId}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <Btn size="md" tone="ghost"><Icon name="phone" size={17} /> Call</Btn>
            <Btn size="md" tone="ghost" onClick={() => nav('/asha/more')}>
              <Icon name="settings" size={17} /> Settings
            </Btn>
          </div>
        </Card>

        <Section title="This month">
          <div className="raise rounded-2xl p-1">
            <div className="grid grid-cols-3 divide-x divide-line-2">
              {[[p.thisMonth.visits, 'visits'], [p.thisMonth.households, 'households'],
                [p.thisMonth.records, 'records made']].map(([v, l]) => (
                <div key={l} className="px-2 py-3.5 text-center">
                  <div className="text-[24px] font-bold num leading-none tracking-[-0.02em]">{v}</div>
                  <div className="text-[11px] text-ink-3 mt-1.5">{l}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 divide-x divide-line-2 border-t border-line-2">
              <div className="px-2 py-3.5 text-center">
                <div className="text-[22px] font-bold num leading-none text-brand tracking-[-0.02em]">
                  {rupee(p.thisMonth.earned)}
                </div>
                <div className="text-[11px] text-ink-3 mt-1.5">earned</div>
              </div>
              <div className="px-2 py-3.5 text-center">
                <div className="text-[22px] font-bold num leading-none tracking-[-0.02em]">
                  {Math.round(p.thisMonth.minutesSaved / 60)}h {p.thisMonth.minutesSaved % 60}m
                </div>
                <div className="text-[11px] text-ink-3 mt-1.5">writing saved</div>
              </div>
            </div>
          </div>
          <p className="text-[11.5px] text-ink-3 mt-2 px-1 leading-relaxed">
            Time saved is modelled from the entries the app filled in for you, not measured with a stopwatch.
          </p>
        </Section>

        <Section title={pending ? `Verification · ${pending} needs attention` : 'Verification'}>
          <List>
            {p.verified.map(v => (
              <div key={v.label} className="flex items-start gap-3 px-4 py-3.5">
                <span className={`w-7 h-7 shrink-0 rounded-full grid place-items-center mt-0.5
                  ${v.state === 'ok' ? 'btn-solid text-white' : 'bg-due-soft text-due'}`}>
                  <Icon name={v.state === 'ok' ? 'check' : 'bell'} size={14} stroke={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[14.5px] leading-tight">{v.label}</div>
                  <div className="text-[12.5px] text-ink-3 mt-0.5 leading-snug">{v.note}</div>
                </div>
                {v.state !== 'ok' && <Pill level="due">Due</Pill>}
              </div>
            ))}
          </List>
        </Section>

        <Section title="Where you work">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-brand mt-0.5"><Icon name="pin" size={19} /></span>
              <div>
                <div className="font-semibold text-[15px] leading-tight">{p.village}</div>
                <div className="text-[12.5px] text-ink-3 mt-0.5">{p.block} · {p.district} · {p.state}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-line-2">
              {[[p.covers.households, 'houses'], [p.covers.people, 'people'],
                [p.covers.pregnant, 'pregnant'], [p.covers.infants, 'infants']].map(([v, l]) => (
                <div key={l} className="text-center">
                  <div className="text-[17px] font-bold num leading-none">{v}</div>
                  <div className="text-[10.5px] text-ink-3 mt-1">{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        <Section title="Who you report to">
          <List>
            <Row icon={<Icon name="user" size={19} />} title={p.anm} sub={`ANM · ${p.anmPhone}`}
              right={<IconBtn icon="phone" label="Call ANM" size={36} />} />
            <Row icon={<Icon name="bank" size={19} />} title={p.phc} sub="Primary Health Centre" />
          </List>
        </Section>

        <Section title="Payment details">
          <List>
            <Row icon={<Icon name="bank" size={19} />} title="Bank account" sub={p.bank}
              right={<Pill level="done">Seeded</Pill>} />
            <Row icon={<Icon name="shield" size={19} />} title="ABHA number" sub={p.abha} />
            <Row icon={<Icon name="phone" size={19} />} title="Mobile" sub={p.phone} />
          </List>
          <p className="text-[11.5px] text-ink-3 mt-2 px-1 leading-relaxed">
            Aadhaar seeding is what lets an incentive actually reach the account. It is the single most
            common reason a claim is approved but never paid.
          </p>
        </Section>

        <Section title="Training">
          <List>
            {p.training.map(t => (
              <Row key={t.name} icon={<Icon name="award" size={19} />} title={t.name}
                sub={t.year === '—' ? 'not yet completed' : `completed ${t.year}`}
                right={t.state === 'ok' ? <Pill level="done">Done</Pill> : <Pill level="due">Due</Pill>} />
            ))}
          </List>
        </Section>

        <Section title="Your documents">
          <List>
            {p.ownDocs.map(d => (
              <Row key={d.label} icon={<Icon name="doc" size={19} />} title={d.label}
                sub="stored on this phone, encrypted" right={<Pill level="done">Verified</Pill>} />
            ))}
          </List>
        </Section>

        <div className="pt-1 space-y-2.5">
          <Btn full tone="ghost" onClick={() => { logout(); nav('/portals') }}>
            <Icon name="logout" size={18} /> Sign out
          </Btn>
          <p className="text-[11.5px] text-ink-3 text-center leading-relaxed">
            Serving since {fmtDate(p.since)} · demonstration profile, synthetic data
          </p>
        </div>
      </main>
    </>
  )
}
