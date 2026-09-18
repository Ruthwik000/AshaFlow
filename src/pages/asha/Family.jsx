import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { useStore } from '../../store/useStore'
import { WOMAN } from '../../data/seed'
import { ENROLMENTS, PROOFS } from '../../data/seed'
import { TopBar, Card, Section, List, Row, Btn, Pill, Notice, fmtDate, daysFromNow } from '../../components/ui'
import Icon from '../../components/Icon'

const ROLE_ICON = { pregnant: 'pregnant', mother: 'user', child: 'baby', infant: 'baby', elder: 'heart', adult: 'user' }
const ENROL_LEVEL = { active: 'done', blocked: 'late', due: 'due', waiting: 'info' }
const PROOF_LEVEL = { verified: 'done', submitted: 'info', mismatch: 'late', missing: 'due' }
const PROOF_ICON = { aadhaar: 'id', bank: 'bank', mcp: 'clipboard', visit: 'calendar', ration: 'card', birth: 'baby', nikshay: 'lungs' }

const TABS = [['schemes', 'Schemes'], ['proofs', 'Proofs'], ['people', 'People'], ['history', 'History']]

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
    ]).then(([h, m, t, e]) =>
      setD({ h, m, t, e: e.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))) }))
  }, [id])

  if (!d?.h) return <div className="p-6 text-ink-3">Loading…</div>
  const { h, m, t, e } = d
  const ids = m.map(x => x.id)
  const enrol = ENROLMENTS.filter(x => ids.includes(x.memberId))
  const proofs = PROOFS.filter(p => p.householdId === id)
  const nameOf = mid => m.find(x => x.id === mid)?.name || '—'
  const blocked = enrol.filter(x => x.state === 'blocked').length
  const missing = proofs.filter(p => p.state === 'missing' || p.state === 'mismatch').length

  return (
    <>
      <TopBar title={h.headName} sub={`House ${h.houseNo} · ${h.village}`} back />

      <main className="flex-1 px-4 py-4 pb-32">
        <div className="raise rounded-2xl p-1 mb-4">
          <div className="grid grid-cols-4 divide-x divide-line-2">
            {[[h.membersCount, 'people'], [enrol.length, 'schemes'], [proofs.length, 'proofs'], [t.length, 'due']]
              .map(([v, l]) => (
                <div key={l} className="px-1 py-2.5 text-center">
                  <div className="text-[19px] font-bold num leading-none">{v}</div>
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
            {enrol.map((x, i) => (
              <Card key={i} className="p-4">
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
                    <Icon name={PROOF_ICON[p.kind] || 'doc'} size={18} />
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
                    <span className="inline-flex items-center gap-1.5"><Icon name="camera" size={15} />
                      {p.state === 'missing' ? 'Capture this document' : 'Replace it'}</span>
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
            <List>
              {m.map(p => {
                const asBeneficiary = Object.entries(WOMAN)
                  .find(([, v]) => v.memberId === p.id)?.[0]
                return (
                  <Row key={p.id} icon={<Icon name={ROLE_ICON[p.role] || 'user'} size={18} />}
                    title={p.name}
                    sub={`${p.age === 0 ? `${p.dob ? Math.round((Date.now() - new Date(p.dob)) / 2629800000) : 0} months` : `${p.age} years`} · ${p.role} · ${enrol.filter(x => x.memberId === p.id).length} schemes`}
                    right={asBeneficiary
                      ? <Btn size="sm" tone="ghost"
                          onClick={() => { setWomanMode(asBeneficiary); nav('/woman') }}>
                          Her portal
                        </Btn>
                      : undefined} />
                )
              })}
            </List>
            <Btn full tone="ghost" size="md" className="mt-3"
              onClick={() => nav(`/asha/people/new?household=${h.id}`)}>
              ＋ Add a person to this family
            </Btn>
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
