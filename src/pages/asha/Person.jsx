import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { WOMAN, WOMAN_TIMELINE, HER_VITALS, ENROLMENTS, PROOFS } from '../../data/seed'
import { memberStatus, monthsOld, weeksPregnant } from '../../engine/caseload'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, List, Row, Btn, Pill, Notice, fmtDate, daysFromNow, Bar } from '../../components/ui'
import { useStore } from '../../store/useStore'

const TABS = [
  { k: 'overview', l: 'Overview', icon: 'heart' },
  { k: 'vaccines', l: 'Vaccines', icon: 'syringe' },
  { k: 'medicines', l: 'Medicines & Diet', icon: 'pill' },
  { k: 'vitals', l: 'Visits & Vitals', icon: 'pulse' },
  { k: 'schemes', l: 'Schemes', icon: 'wallet' },
]

export default function Person() {
  const { id } = useParams()
  const nav = useNavigate()
  const setWomanMode = useStore(s => s.setWomanMode)
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('overview')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const member = await db.members.get(id)
      if (!member) {
        // Search in all seeded/generated members if not in index directly
        const allM = await db.members.toArray()
        const found = allM.find(m => m.id === id)
        if (found) {
          const h = await db.households.get(found.householdId)
          const enc = await db.encounters.where('householdId').equals(found.householdId).toArray()
          const t = await db.tasks.where('householdId').equals(found.householdId).toArray()
          const en = await db.enrolments.where('householdId').equals(found.householdId).toArray()
          setData({ m: found, h, enc, t, en })
          return
        }
      }
      if (member) {
        const h = await db.households.get(member.householdId)
        const enc = await db.encounters.where('householdId').equals(member.householdId).toArray()
        const t = await db.tasks.where('householdId').equals(member.householdId).toArray()
        const en = await db.enrolments.where('householdId').equals(member.householdId).toArray()
        setData({ m: member, h, enc, t, en })
      }
    }
    load()
  }, [id])

  if (!data?.m) {
    return (
      <div className="p-6 text-center text-ink-3">
        <div className="w-12 h-12 rounded-full border-2 border-brand border-t-transparent animate-spin mx-auto mb-3" />
        Loading beneficiary profile…
      </div>
    )
  }

  const { m, h, enc = [], t = [], en = [] } = data
  const st = memberStatus(m)
  const isPregnant = m.role === 'pregnant'
  const isMother = m.role === 'mother'
  const isInfant = m.role === 'infant' || (m.role === 'child' && (m.age === 0 || m.age === 1))
  const isChild = m.role === 'child' && m.age >= 2
  const isElder = m.role === 'elder' || m.age >= 60
  const isNcd = m.role === 'ncd' || (m.age >= 30 && !isPregnant && !isMother)

  // Woman portal persona if mapped
  const asBeneficiaryKey = Object.entries(WOMAN).find(([, v]) => v.memberId === m.id)?.[0]
  const womanData = asBeneficiaryKey ? WOMAN[asBeneficiaryKey] : null
  const womanTimeline = asBeneficiaryKey ? (WOMAN_TIMELINE[asBeneficiaryKey] || []) : []

  // Calculate Pregnancy Metrics
  const weeks = weeksPregnant(m) ?? (womanData?.week || 22)
  const month = Math.min(9, Math.max(1, Math.floor(weeks / 4.35) + 1))
  const trimester = weeks < 13 ? 1 : weeks < 28 ? 2 : 3
  
  // Calculate EDD
  const eddDate = m.lmp
    ? new Date(new Date(m.lmp).getTime() + 280 * 86400000).toISOString().split('T')[0]
    : (womanData?.edd || '2027-02-06')
  
  const daysLeft = Math.max(0, Math.round((new Date(eddDate).getTime() - Date.now()) / 86400000))
  const pregProgressPct = Math.min(100, Math.round((weeks / 40) * 100))

  // Calculate Infant metrics
  const ageMonths = monthsOld(m)
  const childWeeks = Math.max(1, Math.round(ageMonths * 4.35))

  // Enrolments & Proofs
  const memberEnrolments = [...ENROLMENTS.filter(x => x.memberId === m.id), ...(en.filter(x => x.memberId === m.id))]
  const memberProofs = PROOFS.filter(p => p.memberId === m.id || p.householdId === h?.id)

  // Vitals data
  const vitalsList = m.id === 'm1' ? HER_VITALS : [
    { date: '2026-09-08', weight: 52.0, bpSys: 118, bpDia: 78, hb: 9.8 },
    { date: '2026-07-28', weight: 51.0, bpSys: 120, bpDia: 80, hb: 9.9 },
    { date: '2026-06-14', weight: 49.6, bpSys: 118, bpDia: 78, hb: 10.1 },
    { date: '2026-05-02', weight: 48.0, bpSys: 116, bpDia: 76, hb: 10.4 },
  ]
  const latestVitals = vitalsList[0]

  // Copy helper
  const copyAbha = text => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  // High risk pregnancy evaluation
  const isHighRisk = isPregnant && (
    (latestVitals?.hb && latestVitals.hb < 10) ||
    (latestVitals?.bpSys && latestVitals.bpSys >= 140) ||
    m.age < 18 || m.age > 35
  )

  return (
    <>
      <TopBar
        title={m.name}
        sub={`${m.sex === 'F' ? 'Female' : 'Male'}, ${m.age} yrs · House ${h?.houseNo || '—'}, ${h?.village || ''}`}
        back
      />

      <main className="flex-1 px-4 py-3 pb-32 space-y-4">
        {/* ── Beneficiary Profile Header Card ───────────────────────── */}
        <Card className="p-4 relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <span className={`w-14 h-14 rounded-2xl grid place-items-center shrink-0 text-[26px] font-bold ${
              isPregnant ? 'bg-brand-soft text-brand'
              : isInfant || isChild ? 'bg-due-soft text-due'
              : 'bg-info-soft text-info'
            }`}>
              <Icon name={isPregnant ? 'pregnant' : isInfant ? 'baby' : isChild ? 'growth' : 'user'} size={28} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[19px] font-bold leading-tight tracking-tight text-ink truncate">
                  {m.name}
                </h2>
                {isHighRisk && (
                  <Pill level="late">High Risk</Pill>
                )}
              </div>

              <div className="text-[13px] text-ink-2 mt-0.5">
                {m.role === 'pregnant' ? (
                  <span className="font-semibold text-brand">
                    Month {month} of 9 · Week {weeks}
                  </span>
                ) : isInfant ? (
                  <span className="font-semibold text-due">
                    {ageMonths === 0 ? 'Newborn' : `${ageMonths} months old`}
                  </span>
                ) : (
                  <span className="font-medium capitalize">{m.role} · {m.age} years</span>
                )}
                {h?.headName && <span className="text-ink-3"> · W/o {h.headName}</span>}
              </div>

              {/* Identity & IDs strip */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="sink text-[11px] font-medium px-2 py-0.5 rounded text-ink-2">
                  House {h?.houseNo}
                </span>
                <span className="sink text-[11px] font-medium px-2 py-0.5 rounded text-ink-2">
                  {h?.village}
                </span>
                <button
                  onClick={() => copyAbha(h?.facts?.['person.abhaId'] || '12-3456-7890-1234')}
                  className="press sink text-[11px] font-semibold px-2 py-0.5 rounded text-brand flex items-center gap-1">
                  <span>ABHA: {h?.facts?.['person.abhaId'] || '12-3456-7890-1234'}</span>
                  <span className="text-[10px] opacity-75">{copied ? '✓' : '⧉'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-line-2">
            <a
              href={`tel:${h?.mobile || '9876543210'}`}
              className="press btn-quiet rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-[13px] font-semibold">
              <Icon name="phone" size={16} /> Call Beneficiary
            </a>
            <button
              onClick={() => nav(`/asha/medicine?to=${encodeURIComponent(m.name)}`)}
              className="press btn-solid rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 text-[13px] font-semibold">
              <Icon name="pill" size={16} /> Dispense Med
            </button>
          </div>
        </Card>

        {/* ── Sub-navigation Tabs ───────────────────────────────────── */}
        <div className="sink rounded-2xl p-1 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(tb => (
            <button
              key={tb.k}
              onClick={() => setTab(tb.k)}
              className={`press flex-1 min-w-[72px] min-h-[38px] rounded-xl text-[12.5px] font-semibold transition flex items-center justify-center gap-1.5 px-2.5 whitespace-nowrap
                ${tab === tb.k ? 'raise-sm text-brand font-bold' : 'text-ink-3'}`}>
              <Icon name={tb.icon} size={15} />
              <span>{tb.l}</span>
            </button>
          ))}
        </div>

        {/* ═════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW & PREGNANCY STATUS
            ═════════════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-4 anim-up">
            {isPregnant && (
              <>
                {/* Gestational Progress Card */}
                <Card className="p-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <div>
                      <div className="text-[11.5px] uppercase font-bold text-ink-3 tracking-wider">Gestational Stage</div>
                      <div className="text-[20px] font-bold text-brand leading-tight mt-0.5">
                        Month {month} of 9 <span className="text-[14px] text-ink-2 font-normal">(Week {weeks})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="raise-sm bg-brand-soft text-brand font-bold text-[12px] px-2.5 py-1 rounded-lg">
                        Trimester {trimester}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar with milestone ticks */}
                  <div className="mt-3">
                    <Bar value={pregProgressPct} />
                    <div className="flex justify-between text-[11px] text-ink-3 font-semibold mt-1.5 px-0.5">
                      <span className={trimester >= 1 ? 'text-brand' : ''}>Tri 1 (1–12w)</span>
                      <span className={trimester >= 2 ? 'text-brand' : ''}>Tri 2 (13–27w)</span>
                      <span className={trimester >= 3 ? 'text-brand' : ''}>Tri 3 (28–40w)</span>
                    </div>
                  </div>

                  {/* Key Milestones Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-line-2 text-center">
                    <div className="sink rounded-xl p-2">
                      <div className="text-[10px] uppercase text-ink-3 font-bold">LMP Date</div>
                      <div className="text-[13.5px] font-bold num mt-0.5 text-ink">
                        {m.lmp ? fmtDate(m.lmp) : '2 May 2026'}
                      </div>
                    </div>
                    <div className="sink rounded-xl p-2 bg-brand-soft/40 border border-brand/20">
                      <div className="text-[10px] uppercase text-brand font-bold">Expected Due</div>
                      <div className="text-[13.5px] font-bold num mt-0.5 text-brand">
                        {fmtDate(eddDate)}
                      </div>
                    </div>
                    <div className="sink rounded-xl p-2">
                      <div className="text-[10px] uppercase text-ink-3 font-bold">Countdown</div>
                      <div className="text-[13.5px] font-bold num mt-0.5 text-late">
                        {daysLeft} days
                      </div>
                    </div>
                  </div>
                </Card>

                {/* High Risk / Clinical Alerts */}
                {isHighRisk ? (
                  <Notice tone="late" title="High Risk Pregnancy Flagged">
                    <div className="space-y-1 mt-1 text-[12.5px]">
                      {latestVitals?.hb && latestVitals.hb < 10 && (
                        <div>• <b>Mild Anemia detected:</b> Haemoglobin is {latestVitals.hb} g/dL (Target &ge; 11.0 g/dL). Daily double IFA or therapeutic syrup recommended.</div>
                      )}
                      {latestVitals?.bpSys >= 140 && (
                        <div>• <b>Elevated Blood Pressure:</b> {latestVitals.bpSys}/{latestVitals.bpDia} mmHg. Refer to MO at PHC.</div>
                      )}
                      <div>• Schedule next ANC visit with ANM/Doctor at PHC.</div>
                    </div>
                  </Notice>
                ) : (
                  <Notice tone="done" title="Pregnancy Progressing Normally">
                    Blood pressure ({latestVitals?.bpSys || 118}/{latestVitals?.bpDia || 78} mmHg) and vitals are within normal range. Maintain regular ANC schedule.
                  </Notice>
                )}

                {/* Next Visit & Action */}
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="raise-sm w-10 h-10 shrink-0 rounded-xl grid place-items-center text-brand">
                      <Icon name="calendar" size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-ink-3 uppercase tracking-wider">Next Scheduled Action</div>
                      <div className="text-[16px] font-bold text-ink leading-tight mt-0.5">
                        ANC-3 Check-up &amp; Td-2 Vaccine
                      </div>
                      <div className="text-[12.5px] text-ink-2 mt-1">
                        Due in 16 days · Rampur Primary Health Centre
                      </div>
                    </div>
                  </div>
                  <Btn full size="md" className="mt-3" onClick={() => nav(`/asha/visit/${h.id}`)}>
                    ＋ Record Home Visit for Sunita
                  </Btn>
                </Card>
              </>
            )}

            {/* If Infant / Child */}
            {isInfant && (
              <>
                <Card className="p-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <div>
                      <div className="text-[11.5px] uppercase font-bold text-ink-3 tracking-wider">Infant Growth</div>
                      <div className="text-[20px] font-bold text-due leading-tight mt-0.5">
                        {ageMonths === 0 ? 'Under 1 Month' : `${ageMonths} Months Old`}
                      </div>
                    </div>
                    <Pill level="done">Normal Growth</Pill>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2 text-center">
                    <div className="sink rounded-xl p-2">
                      <div className="text-[10px] text-ink-3 font-bold">Birth Weight</div>
                      <div className="text-[14px] font-bold num mt-0.5">2.9 kg</div>
                    </div>
                    <div className="sink rounded-xl p-2">
                      <div className="text-[10px] text-ink-3 font-bold">Current Wt</div>
                      <div className="text-[14px] font-bold num mt-0.5 text-due">5.2 kg</div>
                    </div>
                    <div className="sink rounded-xl p-2">
                      <div className="text-[10px] text-ink-3 font-bold">Poshan Band</div>
                      <div className="text-[13px] font-bold mt-0.5 text-brand">Green</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-xl bg-late-soft text-late grid place-items-center shrink-0">
                      <Icon name="syringe" size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold text-late uppercase tracking-wider">Vaccine Due Today</div>
                      <div className="text-[16px] font-bold text-ink leading-tight mt-0.5">
                        Penta-2, OPV-2 &amp; Rota-2
                      </div>
                      <div className="text-[12px] text-ink-3 mt-0.5">10-week dose schedule · Anganwadi Centre</div>
                    </div>
                  </div>
                  <Btn full size="md" className="mt-3" onClick={() => nav(`/asha/visit/${h.id}`)}>
                    Record Immunization Given
                  </Btn>
                </Card>
              </>
            )}

            {/* If Elder / NCD */}
            {(isElder || isNcd) && (
              <Card className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-[16px]">NCD &amp; Health Screening</h3>
                  <Pill level="due">CBAC Pending</Pill>
                </div>
                <div className="space-y-2 text-[13px] text-ink-2">
                  <div className="flex justify-between py-1.5 border-b border-line-2">
                    <span>CBAC Assessment</span>
                    <span className="font-semibold text-due">Annual check due</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-line-2">
                    <span>Blood Pressure Check</span>
                    <span className="font-semibold text-ink">Last: 124/82 mmHg</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Random Blood Sugar</span>
                    <span className="font-semibold text-ink">110 mg/dL (Normal)</span>
                  </div>
                </div>
                <Btn full size="md" tone="ghost" className="mt-3" onClick={() => nav(`/asha/visit/${h.id}`)}>
                  Conduct CBAC Screening
                </Btn>
              </Card>
            )}

            {/* Quick Link to Beneficiary's Own Portal if mapped */}
            {asBeneficiaryKey && (
              <Card className="p-4 bg-sunken/40">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-bold">Beneficiary App View</div>
                    <div className="text-[12px] text-ink-3">See what {m.name} sees on her phone</div>
                  </div>
                  <Btn size="sm" tone="ghost" onClick={() => { setWomanMode(asBeneficiaryKey); nav('/woman') }}>
                    Open Her View ›
                  </Btn>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 2: VACCINATIONS & IMMUNIZATION SCHEDULE
            ═════════════════════════════════════════════════════════════ */}
        {tab === 'vaccines' && (
          <div className="space-y-4 anim-up">
            {isPregnant ? (
              <>
                <Section title="Maternal Immunization (UIP Guidelines)">
                  <div className="space-y-2.5">
                    {/* Td 1 */}
                    <Card className="p-3.5 border-l-4 border-l-brand">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[15px] font-bold text-ink">Td-1 (Tetanus &amp; adult Diphtheria)</div>
                          <div className="text-[12.5px] text-ink-3 mt-0.5">Dose 1 given early in pregnancy</div>
                          <div className="text-[12px] text-brand font-semibold mt-1">
                            ✓ Administered on 6 Sep 2026 · Left arm
                          </div>
                        </div>
                        <Pill level="done">Given</Pill>
                      </div>
                      <div className="text-[11.5px] text-ink-3 mt-2 pt-2 border-t border-line-2">
                        Given by ANM Kavita Singh at Rampur Sub-Centre
                      </div>
                    </Card>

                    {/* Td 2 */}
                    <Card className="p-3.5 border-l-4 border-l-due">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[15px] font-bold text-ink">Td-2 (Tetanus &amp; adult Diphtheria)</div>
                          <div className="text-[12.5px] text-ink-3 mt-0.5">4 weeks after Td-1 (protects newborn tetanus)</div>
                          <div className="text-[12px] text-due font-semibold mt-1">
                            ⏳ Due on 28 Sep 2026 (in 16 days)
                          </div>
                        </div>
                        <Pill level="due">Due Soon</Pill>
                      </div>
                      <Btn size="sm" tone="ghost" className="mt-3 w-full" onClick={() => nav(`/asha/visit/${h.id}`)}>
                        Mark Given / Record Visit
                      </Btn>
                    </Card>

                    {/* Td Booster */}
                    <Card className="p-3.5 border-l-4 border-l-line">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[15px] font-semibold text-ink-2">Td Booster</div>
                          <div className="text-[12px] text-ink-3 mt-0.5">
                            Applicable only if received 2 Td doses in a pregnancy within last 3 years
                          </div>
                        </div>
                        <Pill level="info">Not needed</Pill>
                      </div>
                    </Card>
                  </div>
                </Section>

                <Notice tone="info" title="Why Td Vaccination Matters">
                  Two doses of Td during pregnancy protect both the mother and newborn child against maternal and neonatal tetanus, a fatal but completely preventable infection.
                </Notice>
              </>
            ) : isInfant || isChild ? (
              <>
                <Section title="National Immunization Schedule (UIP)">
                  <div className="space-y-2.5">
                    {/* Birth Doses */}
                    <Card className="p-3.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[14.5px] font-bold">At Birth (within 24 hrs)</div>
                          <div className="text-[12.5px] text-ink-2 mt-0.5">BCG, OPV-0, Hepatitis B birth dose</div>
                          <div className="text-[11.5px] text-brand font-semibold mt-1">✓ Administered at Rampur PHC</div>
                        </div>
                        <Pill level="done">Done</Pill>
                      </div>
                    </Card>

                    {/* 6 Weeks */}
                    <Card className="p-3.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[14.5px] font-bold">6 Weeks</div>
                          <div className="text-[12.5px] text-ink-2 mt-0.5">Penta-1, OPV-1, Rota-1, PCV-1, fIPV-1</div>
                          <div className="text-[11.5px] text-brand font-semibold mt-1">✓ Given on 30 Jul 2026</div>
                        </div>
                        <Pill level="done">Done</Pill>
                      </div>
                    </Card>

                    {/* 10 Weeks */}
                    <Card className="p-3.5 border-2 border-late/40 bg-late-soft/20">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[14.5px] font-bold text-late">10 Weeks (Due Now)</div>
                          <div className="text-[12.5px] text-ink font-semibold mt-0.5">Penta-2, OPV-2, Rota-2</div>
                          <div className="text-[11.5px] text-late font-bold mt-1">⚠️ Overdue by 2 days</div>
                        </div>
                        <Pill level="late">Overdue</Pill>
                      </div>
                      <Btn size="sm" className="mt-3 w-full" onClick={() => nav(`/asha/visit/${h.id}`)}>
                        Record Vaccine Dose
                      </Btn>
                    </Card>

                    {/* 14 Weeks */}
                    <Card className="p-3.5 opacity-85">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[14.5px] font-semibold">14 Weeks</div>
                          <div className="text-[12px] text-ink-3 mt-0.5">Penta-3, OPV-3, Rota-3, PCV-2, fIPV-2</div>
                          <div className="text-[11.5px] text-ink-3 mt-1">Upcoming in October 2026</div>
                        </div>
                        <Pill level="due">Upcoming</Pill>
                      </div>
                    </Card>

                    {/* 9–12 Months */}
                    <Card className="p-3.5 opacity-70">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[14.5px] font-semibold">9–12 Months</div>
                          <div className="text-[12px] text-ink-3 mt-0.5">MR-1, JE-1, PCV Booster, Vitamin A (Dose 1)</div>
                        </div>
                        <Pill level="info">Scheduled</Pill>
                      </div>
                    </Card>
                  </div>
                </Section>
              </>
            ) : (
              <div className="p-4 text-center text-ink-3">
                No active childhood or maternal immunization due for this age category.
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 3: MEDICINES, SUPPLEMENTS & DAILY DIET MENU ("meinw")
            ═════════════════════════════════════════════════════════════ */}
        {tab === 'medicines' && (
          <div className="space-y-4 anim-up">
            {isPregnant ? (
              <>
                {/* IFA Red Tablets */}
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 grid place-items-center font-bold text-[18px] shrink-0">
                      💊
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-bold text-ink leading-tight">
                        IFA Red Tablets (Iron &amp; Folic Acid)
                      </div>
                      <div className="text-[12.5px] text-ink-3 mt-0.5">
                        Standard 180 tablets course (100mg Iron + 500mcg Folic Acid)
                      </div>
                    </div>
                    <Pill level="due">60 / 180</Pill>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[12px] font-semibold mb-1">
                      <span>Dispensed: 60 tablets</span>
                      <span className="text-brand">Remaining: 120 tablets</span>
                    </div>
                    <Bar value={(60 / 180) * 100} />
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[12px] text-amber-900 leading-relaxed">
                    <b>Counseling Guide:</b> Take 1 tablet daily after dinner or before bed. Swallow with lemon water or amla. <b>Never take with tea, coffee, or milk!</b>
                  </div>

                  <Btn size="md" className="mt-3 w-full"
                    onClick={() => nav(`/asha/medicine?to=${encodeURIComponent(m.name)}&med=med1`)}>
                    <Icon name="firstaid" size={17} /> Dispense IFA from Kit
                  </Btn>
                </Card>

                {/* Calcium & Vitamin D3 */}
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 grid place-items-center font-bold text-[18px] shrink-0">
                      🦴
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-bold text-ink leading-tight">
                        Calcium &amp; Vitamin D3 Tablets
                      </div>
                      <div className="text-[12.5px] text-ink-3 mt-0.5">
                        360 tablets course (500mg elemental calcium, 2 daily from week 14)
                      </div>
                    </div>
                    <Pill level="done">In Progress</Pill>
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/60 text-[12px] text-sky-900 leading-relaxed">
                    <b>Counseling Guide:</b> Take 2 tablets daily (1 morning, 1 afternoon). <b>Maintain at least 2 hours gap from Iron tablet!</b>
                  </div>
                </Card>

                {/* Albendazole */}
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center font-bold text-[18px] shrink-0">
                      ✓
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-bold text-ink leading-tight">
                        Albendazole Deworming (400mg)
                      </div>
                      <div className="text-[12.5px] text-ink-3 mt-0.5">
                        Single chewable dose in 2nd trimester
                      </div>
                      <div className="text-[12px] text-brand font-semibold mt-1">
                        ✓ Completed at Week 16 visit
                      </div>
                    </div>
                    <Pill level="done">Completed</Pill>
                  </div>
                </Card>

                {/* ── Daily Diet & Poshan Menu ("meinw") ───────────────── */}
                <Section title="Recommended Daily Diet Menu (Poshan Abhiyaan)">
                  <Card className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-[22px]">🥬</span>
                      <div>
                        <div className="font-bold text-[14px] text-ink">Iron &amp; Folate Rich Foods</div>
                        <div className="text-[12.5px] text-ink-2 mt-0.5">
                          Spinach (palak), methi leaves, drumstick (sahjan), jaggery (gur) with roasted chana.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-2 border-t border-line-2">
                      <span className="text-[22px]">🥛</span>
                      <div>
                        <div className="font-bold text-[14px] text-ink">Protein &amp; Calcium Rich Foods</div>
                        <div className="text-[12.5px] text-ink-2 mt-0.5">
                          2 glasses boiled milk, curd, paneer, cooked lentils (dal), eggs or fish.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-2 border-t border-line-2">
                      <span className="text-[22px]">🍊</span>
                      <div>
                        <div className="font-bold text-[14px] text-ink">Vitamin C (For Iron Absorption)</div>
                        <div className="text-[12.5px] text-ink-2 mt-0.5">
                          Guava (amrud), amla, lemon water, seasonal oranges. Drink 8–10 glasses of water.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-2 border-t border-line-2">
                      <span className="text-[22px]">📦</span>
                      <div>
                        <div className="font-bold text-[14px] text-ink">Anganwadi Ration (Take-Home Ration)</div>
                        <div className="text-[12.5px] text-ink-2 mt-0.5">
                          Fortified Dalia / Khichdi premix collected on 8 Sep 2026. Status: <b className="text-brand">Distributed</b>.
                        </div>
                      </div>
                    </div>
                  </Card>
                </Section>
              </>
            ) : (
              <Card className="p-4 space-y-3">
                <div className="font-bold text-[15px]">Supplements &amp; Nutrition</div>
                <div className="text-[13px] text-ink-2">
                  {isInfant ? (
                    <>
                      <div className="font-semibold text-brand">Exclusive Breastfeeding (0–6 months)</div>
                      <div className="text-ink-3 mt-1">No water, no gripe water, only mother&apos;s milk. Vitamin D3 drops daily.</div>
                      <div className="mt-2 font-semibold">ORS &amp; Zinc Kit</div>
                      <div className="text-ink-3">Available with ASHA for diarrhea management.</div>
                    </>
                  ) : isChild ? (
                    <>
                      <div>Vitamin A syrup doses every 6 months.</div>
                      <div>Biannual Albendazole deworming (National Deworming Day).</div>
                    </>
                  ) : (
                    <div>Regular nutritious meals, iodized salt, and clean drinking water.</div>
                  )}
                </div>
                <Btn full tone="ghost" size="md" onClick={() => nav(`/asha/medicine?to=${encodeURIComponent(m.name)}`)}>
                  Open Medicine Kit Tracker
                </Btn>
              </Card>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 4: ANC VISITS & CLINICAL VITALS
            ═════════════════════════════════════════════════════════════ */}
        {tab === 'vitals' && (
          <div className="space-y-4 anim-up">
            {isPregnant ? (
              <>
                {/* 4-ANC Milestone Tracker */}
                <Section title="4-ANC Checkup Milestones">
                  <div className="space-y-2.5">
                    {/* ANC 1 */}
                    <Card className="p-3.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[14.5px] font-bold">ANC 1 (within 12 weeks)</div>
                          <div className="text-[12px] text-ink-3 mt-0.5">Registration, baseline BP, Hb, urine test</div>
                          <div className="text-[11.5px] text-brand font-semibold mt-1">
                            ✓ Done at Rampur PHC · Wt: 49.6 kg, BP: 118/78, Hb: 10.1
                          </div>
                        </div>
                        <Pill level="done">Done</Pill>
                      </div>
                    </Card>

                    {/* ANC 2 */}
                    <Card className="p-3.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[14.5px] font-bold">ANC 2 (14–26 weeks)</div>
                          <div className="text-[12px] text-ink-3 mt-0.5">Weight gain check, BP, ultrasound anomaly scan</div>
                          <div className="text-[11.5px] text-brand font-semibold mt-1">
                            ✓ Done · Wt: 51.0 kg, BP: 120/80, Hb: 9.9
                          </div>
                        </div>
                        <Pill level="done">Done</Pill>
                      </div>
                    </Card>

                    {/* ANC 3 */}
                    <Card className="p-3.5 border-2 border-due/50 bg-due-soft/20">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[14.5px] font-bold text-due">ANC 3 (28–34 weeks)</div>
                          <div className="text-[12px] text-ink-2 mt-0.5">Fetal growth, BP, fundal height, Hb test</div>
                          <div className="text-[11.5px] text-due font-bold mt-1">
                            ⏳ Scheduled for 28 Sep 2026
                          </div>
                        </div>
                        <Pill level="due">Due Soon</Pill>
                      </div>
                    </Card>

                    {/* ANC 4 */}
                    <Card className="p-3.5 opacity-75">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[14.5px] font-semibold text-ink-2">ANC 4 (36 weeks to delivery)</div>
                          <div className="text-[12px] text-ink-3 mt-0.5">Delivery readiness, birth planning, hospital referral</div>
                        </div>
                        <Pill level="info">Scheduled</Pill>
                      </div>
                    </Card>
                  </div>
                </Section>

                {/* Vitals History Table */}
                <Section title="Vitals &amp; Health Checks History">
                  <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead className="bg-sunken border-b border-line text-[11px] font-bold uppercase text-ink-3">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Weight</th>
                            <th className="py-2.5 px-3">BP</th>
                            <th className="py-2.5 px-3">Hb</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line-2 num">
                          {vitalsList.map((v, i) => (
                            <tr key={i} className={i === 0 ? 'bg-brand-soft/20 font-semibold' : ''}>
                              <td className="py-2.5 px-3">{fmtDate(v.date)}</td>
                              <td className="py-2.5 px-3">{v.weight} kg</td>
                              <td className="py-2.5 px-3">{v.bpSys}/{v.bpDia}</td>
                              <td className="py-2.5 px-3">
                                <span className={v.hb < 10 ? 'text-late font-bold' : 'text-brand'}>
                                  {v.hb} g/dL
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </Section>
              </>
            ) : (
              <Card className="p-4">
                <div className="font-bold text-[15px] mb-2">Visits &amp; Encounters</div>
                {enc.length === 0 ? (
                  <div className="text-[13px] text-ink-3">No past clinical encounters on record.</div>
                ) : (
                  <div className="space-y-2">
                    {enc.map(e => (
                      <div key={e.id} className="sink rounded-xl p-3">
                        <div className="font-bold text-[14px]">{e.summary || e.type}</div>
                        <div className="text-[12px] text-ink-3 mt-0.5">{fmtDate(e.createdAt || e.date)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 5: GOVERNMENT SCHEMES & ENTITLEMENTS
            ═════════════════════════════════════════════════════════════ */}
        {tab === 'schemes' && (
          <div className="space-y-3 anim-up">
            {memberEnrolments.length === 0 ? (
              <Card className="p-6 text-center text-[13px] text-ink-3">
                No active scheme records attached to this beneficiary.
              </Card>
            ) : (
              memberEnrolments.map((x, i) => (
                <Card key={x.id || i} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-[15.5px] text-ink">{x.label}</div>
                      <div className="text-[13px] text-ink-2 font-medium mt-0.5">{x.phase}</div>
                      <div className="text-[11.5px] text-ink-3 mt-1 num">Updated: {fmtDate(x.updated)}</div>
                    </div>
                    <Pill level={x.state === 'blocked' ? 'late' : x.state === 'due' ? 'due' : 'done'}>
                      {x.state}
                    </Pill>
                  </div>
                  {x.state === 'blocked' && (
                    <div className="mt-3 p-2.5 rounded-xl bg-red-50 text-[12px] text-red-700 leading-snug">
                      ⚠️ <b>Hold reason:</b> Aadhaar not seeded to bank account. Assist with bank visit.
                    </div>
                  )}
                </Card>
              ))
            )}

            {isPregnant && (
              <Card className="p-4 bg-sunken/40">
                <div className="text-[13.5px] font-bold text-ink">Janani Suraksha Yojana (JSY)</div>
                <div className="text-[12.5px] text-ink-2 mt-0.5">
                  ₹1,400 direct incentive for institutional delivery at government health facility (Rampur PHC).
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* ── Fixed Bottom Bar: Record Visit CTA ─────────────────────── */}
      <div className="sticky bottom-0 px-4 py-3 bg-paper/95 backdrop-blur border-t border-line safe-bot">
        <div className="flex gap-2.5">
          <Btn
            full
            onClick={() => nav(`/asha/visit/${h?.id}`)}>
            ＋ New Visit for {m.name.split(' ')[0]}
          </Btn>
        </div>
      </div>
    </>
  )
}
