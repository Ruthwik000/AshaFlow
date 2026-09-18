import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { useStore } from '../../store/useStore'
import programmes from '../../data/programmes'
import { planEncounter } from '../../engine/solver'
import { TopBar, Card } from '../../components/ui'
import Icon from '../../components/Icon'

/* Every type below loads its own question set out of the same engine. The
   question wording comes from the instrument the ASHA already carries:
   the RCH registration page, the HBNC card, the MCP card immunisation page,
   the CBAC checklist, the IDSP fever line list, the village register. */
const TYPES = [
  { k: 'Pregnancy',        icon: 'pregnant',    sub: 'ANC registration or follow-up', form: 'RCH / MCP card' },
  { k: 'Newborn',          icon: 'baby',        sub: 'HBNC home visit',               form: 'HBNC card' },
  { k: 'Child vaccine',    icon: 'syringe',     sub: 'Immunisation due',              form: 'MCP card / U-WIN' },
  { k: 'Health check',     icon: 'stethoscope', sub: 'NCD screening, 30 years and above', form: 'CBAC checklist' },
  { k: 'Illness',          icon: 'thermometer', sub: 'Fever, cough, loose motions',   form: 'IDSP line list' },
  { k: 'Household survey', icon: 'clipboard',   sub: 'Register and eligible couples', form: 'Village register' },
]

export default function VisitType() {
  const { householdId } = useParams()
  const nav = useNavigate()
  const startDraft = useStore(s => s.startDraft)
  const [h, setH] = useState(null)
  const [members, setMembers] = useState([])
  const [type, setType] = useState(null)

  useEffect(() => {
    db.households.get(householdId).then(setH)
    db.members.where('householdId').equals(householdId).toArray().then(setMembers)
  }, [householdId])

  // The counter on each tile is computed, not written in. Change a schema file
  // and the tile changes with it.
  const plans = useMemo(() => Object.fromEntries(TYPES.map(t => [
    t.k, planEncounter({ programmes, facts: h?.facts || {}, encounterType: t.k }),
  ])), [h])

  const start = (t, member) => {
    startDraft({
      householdId, memberId: member?.id || null, memberName: member?.name || null,
      type: t, facts: { ...(h?.facts || {}), __encounterType: t },
    })
    nav('/asha/consent')
  }

  const candidates = members.filter(m => m.role !== 'adult' || type === 'Health check' || type === 'Illness')

  return (
    <>
      <TopBar title="What kind of visit?" sub={h ? `House ${h.houseNo} · ${h.headName}` : ''} back />
      <main className="flex-1 px-4 py-4">
        {!type && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(t => {
                const p = plans[t.k]
                return (
                  <button key={t.k} onClick={() => setType(t.k)}
                    className="press raise min-h-[150px] rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 relative">
                    <span className="sink w-12 h-12 rounded-2xl grid place-items-center text-brand mb-0.5">
                      <Icon name={t.icon} size={26} stroke={1.7} />
                    </span>
                    <span className="text-[15px] font-bold text-center leading-tight">{t.k}</span>
                    <span className="text-[11.5px] text-ink-3 text-center leading-snug">{t.sub}</span>
                    <span className="absolute top-2 right-2 text-[9.5px] font-bold uppercase tracking-wide
                                     bg-brand-soft text-brand-700 px-1.5 py-0.5 rounded num">
                      {p.stats.baseline} → {p.stats.asked}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="raise rounded-2xl p-4 mt-4">
              <p className="text-[12.5px] text-ink-2 leading-relaxed">
                Each tile shows <b>fields the registers want</b> → <b>questions you answer</b>, worked out
                live from the five schema files. The question wording is taken from the form the ASHA
                already carries for that visit.
              </p>
              <div className="mt-3 space-y-1">
                {TYPES.map(t => (
                  <div key={t.k} className="flex items-center gap-2 text-[11.5px] text-ink-3">
                    <Icon name={t.icon} size={14} />
                    <span className="flex-1">{t.k}</span>
                    <span>{t.form}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {type && (
          <>
            <p className="text-[13px] text-ink-2 mb-3 px-1">Who is this visit for?</p>
            <div className="space-y-2">
              {candidates.map(m => (
                <Card key={m.id} onClick={() => start(type, m)} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[16px]">{m.name}</div>
                      <div className="text-[12.5px] text-ink-3 capitalize">{m.age} years · {m.role}</div>
                    </div>
                    <Icon name="chevron" size={18} className="text-ink-3" />
                  </div>
                </Card>
              ))}
              <Card onClick={() => start(type, null)} className="p-4">
                <div className="font-semibold text-[16px]">Someone else or the whole household</div>
              </Card>
            </div>
            <button onClick={() => setType(null)}
              className="mt-4 text-[13px] text-ink-3 font-semibold px-1 flex items-center gap-1">
              <Icon name="chevron" size={14} className="rotate-180" /> Choose a different visit type
            </button>
          </>
        )}
      </main>
    </>
  )
}
