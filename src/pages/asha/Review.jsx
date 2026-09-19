import { useMemo, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import programmes from '../../data/programmes'
import { planCoreEncounter } from '../../engine/solver'
import { buildOutputs } from '../../engine/mapper'
import { saveEncounter } from '../../db/db'
import { QUESTION_BANK } from '../../data/canonical'
import { TopBar, Btn, Card, Section } from '../../components/ui'
import Icon from '../../components/Icon'

export default function Review() {
  const nav = useNavigate()
  const draft = useStore(s => s.draft)
  const unanswer = useStore(s => s.unanswer)
  const clearDraft = useStore(s => s.clearDraft)
  const [saving, setSaving] = useState(false)

  const facts = draft?.facts || {}
  const isFollowUp = draft?.isFollowUp || false
  const plan = useMemo(() => planCoreEncounter({ programmes, facts, encounterType: draft?.type, isFollowUp }), [facts, draft?.type, isFollowUp])
  const built = useMemo(() => buildOutputs({ programmes, facts }), [facts])

  if (!draft && !saving) return <Navigate to="/asha" replace />

  const answers = (draft.answeredOrder || []).filter(o => o.key !== 'visit.consentGiven')

  const save = async () => {
    setSaving(true)
    const enc = await saveEncounter({
      householdId: draft.householdId, memberId: draft.memberId, type: draft.type,
      summary: `${draft.type} — ${draft.memberName || 'household'}`,
      facts, answeredOrder: draft.answeredOrder,
      outputCount: built.outputs.length, date: new Date().toISOString().slice(0, 10),
    })
    nav(`/asha/outputs/${enc.id}`, { replace: true })
    setTimeout(clearDraft, 0)
  }

  return (
    <>
      <TopBar title="Check the answers" sub={`${answers.length} answered · ${draft.memberName || ''}`} back />

      <main className="flex-1 px-4 py-4 space-y-6 pb-32">
        <Section title="Her answers">
          <div className="bg-surface border border-line rounded-2xl divide-y divide-line-2">
            {answers.map(a => (
              <button key={a.key} onClick={() => { unanswer(a.key); nav('/asha/capture') }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-line-2">
                <span className="w-8 h-8 rounded-lg bg-brand-soft grid place-items-center text-brand shrink-0">
                  <Icon name={QUESTION_BANK[a.key]?.icon || 'doc'} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] text-ink-3 truncate">{a.label}</div>
                  <div className="text-[16px] font-semibold num">{a.value}</div>
                </div>
                <span className="text-[12px] text-brand font-semibold shrink-0">Change</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Filled in by the app">
          <Card className="p-4">
            <div className="text-[15px] font-semibold mb-1">
              {plan.stats.derived} fields calculated · {plan.stats.remembered} remembered
            </div>
            <p className="text-[13.5px] text-ink-2 leading-relaxed">
              Delivery date, ANC dates, Td dates and the baby's full vaccine calendar — all worked
              out from her answers.
            </p>
          </Card>
        </Section>
      </main>

      <div className="sticky bottom-0 px-4 py-3 bg-paper/95 backdrop-blur border-t border-line safe-bot">
        <Btn full onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save — make 5 records'}
        </Btn>
      </div>
    </>
  )
}
