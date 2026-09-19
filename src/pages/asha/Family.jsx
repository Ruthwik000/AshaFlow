import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { useStore } from '../../store/useStore'
import { WOMAN } from '../../data/seed'
import { ENROLMENTS, PROOFS } from '../../data/seed'
import { memberStatus, householdSummary } from '../../engine/caseload'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, List, Row, Btn, Pill, Notice, fmtDate, daysFromNow } from '../../components/ui'

const KIND = {
  pregnant:   { icon: 'baby',   tone: 'text-brand bg-brand-soft' },
  newborn:    { icon: 'baby',   tone: 'text-late bg-late-soft' },
  infant:     { icon: 'baby',   tone: 'text-due bg-due-soft' },
  under5:     { icon: 'growth', tone: 'text-due bg-due-soft' },
  mother:     { icon: 'user',   tone: 'text-info bg-info-soft' },
  adolescent: { icon: 'user',   tone: 'text-ink-2 bg-line-2' },
  ncd:        { icon: 'pulse',  tone: 'text-info bg-info-soft' },
  elder:      { icon: 'pulse',  tone: 'text-info bg-info-soft' },
  adult:      { icon: 'user',   tone: 'text-ink-3 bg-line-2' },
}
const ENROL_LEVEL = { active: 'done', blocked: 'late', due: 'due', waiting: 'info' }
const PROOF_LEVEL = { verified: 'done', submitted: 'info', mismatch: 'late', missing: 'due' }
const PROOF_ICON = { aadhaar: '▣', bank: '▤', mcp: '▥', visit: '▦', ration: '▧', birth: '▨', nikshay: '▩' }

const TABS = [['schemes', 'Schemes'], ['proofs', 'Proofs'], ['people', 'People'], ['history', 'History']]

const WATER_LABEL = { tap: 'Tap', handpump: 'Hand pump', well: 'Well', other: 'Other' }
const FUEL_LABEL = { lpg: 'LPG', wood: 'Wood', mixed: 'LPG and wood' }
const HOUSE_LABEL = { kutcha: 'Kutcha', semi: 'Semi-pucca', pucca: 'Pucca' }
const yn = v => (v === true ? 'Yes' : v === false ? 'No' : null)

/** Everything recorded about the house itself, shown only where it exists. */
function householdDetails(h) {
  return [
    ['House number', h.houseNo],
    ['Village', [h.village, h.hamlet].filter(Boolean).join(' · ')],
    ['Mobile', h.mobile],
    ['Ration card', h.rationCard === 'none' ? 'None' : h.rationCard || (h.bplCard ? 'BPL' : null)],
    ['Ayushman Bharat card', yn(h.pmjay)],
    ["Bank account in her name", yn(h.bankAccount)],
    ['Category', h.caste],
    ['Toilet in the house', yn(h.hasToilet)],
    ['Drinking water', WATER_LABEL[h.waterSource] || h.waterSource],
    ['Cooking fuel', FUEL_LABEL[h.cookingFuel]],
    ['House type', HOUSE_LABEL[h.houseType]],
    ['People recorded', h.membersCount],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '')
}

export default function Family() {
  const { id } = useParams()
  const nav = useNavigate()
  const setWomanMode = useStore(s => s.setWomanMode)
  const [d, setD] = useState(null)
  const [tab, setTab] = useState('schemes')

  useEffect(() => {
    Promise.all([
      db.households.get(id),
      db.members.where('householdId').equals(id).toArray(),
      db.tasks.where('householdId').equals(id).toArray(),
      db.encounters.where('householdId').equals(id).toArray(),
      db.enrolments.where('householdId').equals(id).toArray(),
    ]).then(([h, m, t, e, en]) =>
      setD({ h, m, t, en, e: e.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))) }))
  }, [id])

  if (!d?.h) return <div className="p-6 text-ink-3">Loading…</div>
  const { h, m, t, e } = d
  const ids = m.map(x => x.id)
  // seeded enrolments plus anything recorded on this phone at intake
  const enrol = [...ENROLMENTS.filter(x => ids.includes(x.memberId)), ...(d.en || [])]
  const proofs = PROOFS.filter(p => p.householdId === id)
  const nameOf = mid => m.find(x => x.id === mid)?.name || '—'
  const summary = householdSummary(m)
  const blocked = enrol.filter(x => x.state === 'blocked').length
  const missing = proofs.filter(p => p.state === 'missing' || p.state === 'mismatch').length

  return (
    <>
      <TopBar title={h.headName} sub={`House ${h.houseNo} · ${h.village}`} back />

      <main className="flex-1 px-4 py-4 pb-32">
        <div className="raise rounded-2xl p-1 mb-4">
          <div className="grid grid-cols-4 divide-x divide-line-2">
            {[[m.length, 'people'], [summary.pregnant, 'pregnant'],
              [summary.under5, 'under 5'], [t.length, 'due']].map(([v, l]) => (
              <div key={l} className="px-1 py-2.5 text-center">
                <div className={`text-[19px] font-bold num leading-none
                  ${l === 'due' && v > 0 ? 'text-late' : l === 'pregnant' && v > 0 ? 'text-brand' : ''}`}>{v}</div>
                <div className="text-[10.5px] text-ink-3 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {(blocked > 0 || missing > 0) && (
          <div className="mb-4">
            <Notice tone="late" title="Something is blocking this household">
              {blocked > 0 && `${blocked} scheme payment held. `}
              {missing > 0 && `${missing} proof document missing or mismatched.`}
            </Notice>
          </div>
        )}

        <div className="sink rounded-2xl p-1 flex gap-1 mb-4">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`press flex-1 min-h-[40px] rounded-xl text-[13px] font-semibold transition
                ${tab === k ? 'raise-sm text-ink' : 'text-ink-3'}`}>{l}</button>
          ))}
        </div>

        {tab === 'schemes' && (
          <div className="space-y-2.5">
            {enrol.length === 0 && (
              <div className="px-1 py-6 text-[13px] text-ink-3">
                Nobody in this household is on a scheme yet. Open the People tab to see who is eligible.
              </div>
            )}
            {enrol.map((x, i) => (
              <Card key={x.id || `en${i}`} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[15px] leading-tight">{x.label}</div>
                    <div className="text-[12.5px] text-ink-3 mt-0.5">{nameOf(x.memberId)}</div>
                    <div className={`text-[13.5px] mt-2 font-medium
                      ${x.state === 'blocked' ? 'text-late' : x.state === 'due' ? 'text-due' : 'text-ink-2'}`}>
                      {x.phase}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Pill level={ENROL_LEVEL[x.state]}>{x.state}</Pill>
                    <div className="text-[11px] text-ink-3 mt-1.5 num">{fmtDate(x.updated)}</div>
                  </div>
                </div>
              </Card>
            ))}
            <p className="text-[12px] text-ink-3 px-1 pt-1 leading-relaxed">
              Phases come from the encounter record, not from a separate tracker — the same single entry
              advances every one of these.
            </p>
          </div>
        )}

        {tab === 'proofs' && (
          <div className="space-y-2.5">
            {proofs.map(p => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="raise-sm w-10 h-10 shrink-0 rounded-xl grid place-items-center text-brand text-[15px]">
                    {PROOF_ICON[p.kind] || '▤'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[14.5px] leading-tight">{p.label}</div>
                    <div className="text-[12px] text-ink-3 mt-0.5 num">
                      {p.memberId ? nameOf(p.memberId) + ' · ' : ''}{p.date ? fmtDate(p.date) : 'not on file'}
                      {p.size ? ` · ${p.size}` : ''}
                    </div>
                    {p.issue && <div className="text-[12.5px] text-late mt-1.5 leading-snug">{p.issue}</div>}
                  </div>
                  <Pill level={PROOF_LEVEL[p.state]}>{p.state}</Pill>
                </div>
                {(p.state === 'missing' || p.state === 'mismatch') && (
                  <Btn size="sm" tone="ghost" className="mt-3 w-full">
                    {p.state === 'missing' ? '📷 Capture this document' : '📷 Replace it'}
                  </Btn>
                )}
              </Card>
            ))}
            <Btn full tone="ghost" size="md" className="mt-1">＋ Add a document</Btn>
            <p className="text-[12px] text-ink-3 px-1 pt-1 leading-relaxed">
              Documents stay on this phone, encrypted. They are attached to a claim only when the
              worker submits one.
            </p>
          </div>
        )}

        {tab === 'people' && (
          <>
            <div className="space-y-2.5">
              {m.map(p => {
                const st = memberStatus(p)
                const k = KIND[st.kind] || KIND.adult
                const mine = enrol.filter(x => x.memberId === p.id)
                const asBeneficiary = Object.entries(WOMAN).find(([, v]) => v.memberId === p.id)?.[0]
                return (
                  <Card
                    key={p.id}
                    onClick={() => nav(`/asha/person/${p.id}`)}
                    className="p-4 cursor-pointer hover:border-brand/50 transition relative press">
                    <div className="flex items-start gap-3">
                      <span className={`w-11 h-11 shrink-0 rounded-xl grid place-items-center ${k.tone}`}>
                        <Icon name={k.icon} size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-bold text-[16px] leading-tight text-ink">{p.name}</div>
                          <span className="text-ink-3 shrink-0"><Icon name="chevron" size={16} /></span>
                        </div>
                        <div className="text-[12.5px] text-ink-3 mt-0.5">
                          {p.sex === 'F' ? 'Female' : 'Male'} · {p.role}
                        </div>
                        <div className={`text-[13.5px] font-semibold mt-1.5
                          ${st.urgent ? 'text-late' : st.kind === 'pregnant' ? 'text-brand' : 'text-ink-2'}`}>
                          {st.label}
                        </div>
                        {st.detail && <div className="text-[12.5px] text-ink-2 mt-0.5">{st.detail}</div>}
                      </div>
                    </div>

                    {mine.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-line-2">
                        <div className="text-[11.5px] text-ink-3 mb-1.5">Enrolled in</div>
                        <div className="flex flex-wrap gap-1.5">
                          {mine.map((x, i) => (
                            <span key={i} className={`text-[11.5px] font-semibold px-2 py-0.5 rounded
                              ${x.state === 'blocked' ? 'bg-late-soft text-late'
                                : x.state === 'due' ? 'bg-due-soft text-due' : 'bg-brand-soft text-brand'}`}>
                              {x.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-line-2 flex items-center justify-between text-[12.5px] font-semibold text-brand">
                      <span>View Health, Vaccine &amp; Diet Progress</span>
                      <span>›</span>
                    </div>

                    {asBeneficiary && (
                      <Btn size="sm" tone="ghost" className="mt-2.5 w-full"
                        onClick={(e) => { e.stopPropagation(); setWomanMode(asBeneficiary); nav('/woman') }}>
                        Open her own portal
                      </Btn>
                    )}
                  </Card>
                )
              })}
            </div>
            <Btn full tone="ghost" size="md" className="mt-3"
              onClick={() => nav(`/asha/people/new?household=${h.id}`)}>
              ＋ Add a person to this family
            </Btn>

            <Section title="Household details" className="pt-5">
              <List>
                {householdDetails(h).map(([k, v]) => (
                  <Row key={k} title={k} right={<span className="text-[13px] text-ink-2 font-medium">{v}</span>} />
                ))}
              </List>
              {h.note && (
                <p className="text-[12.5px] text-ink-2 mt-2.5 px-1 leading-relaxed">{h.note}</p>
              )}
            </Section>
          </>
        )}

        {tab === 'history' && (
          <div className="space-y-2.5">
            {t.length > 0 && (
              <Section title="Due now">
                <List>
                  {t.map(x => (
                    <Row key={x.id} title={x.title} sub={`${x.reason} · ${daysFromNow(x.due)}`}
                      right={<Pill level={x.level} />} />
                  ))}
                </List>
              </Section>
            )}
            <Section title="Past visits" className="pt-2">
              <List>
                {e.length === 0 && <div className="px-4 py-5 text-[13px] text-ink-3">No visits recorded yet.</div>}
                {e.map(x => (
                  <Row key={x.id} title={x.summary || x.type}
                    sub={`${fmtDate(x.createdAt)} · ${x.outputCount || 0} records generated`}
                    right={x.synced ? <Pill level="done">Synced</Pill> : <Pill level="due">Queued</Pill>}
                    onClick={x.facts && Object.keys(x.facts).length ? () => nav(`/asha/outputs/${x.id}`) : undefined} />
                ))}
              </List>
            </Section>
          </div>
        )}
      </main>

      <div className="sticky bottom-0 px-4 py-3 bg-paper/94 backdrop-blur border-t border-line safe-bot">
        <Btn full onClick={() => nav(`/asha/visit/${h.id}`)}>＋ New visit for this family</Btn>
      </div>
    </>
  )
}
