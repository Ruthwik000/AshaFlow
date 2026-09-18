import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useStore, say } from '../../store/useStore'
import programmes from '../../data/programmes'
import { planEncounter, questionFor } from '../../engine/solver'
import { QuestionInput } from '../../components/inputs'
import { TopBar, Btn, Speaker, Bar } from '../../components/ui'
import Icon from '../../components/Icon'

export default function AskOnce() {
  const nav = useNavigate()
  const draft = useStore(s => s.draft)
  const answer = useStore(s => s.answer)
  const unanswer = useStore(s => s.unanswer)

  const [pending, setPending] = useState(undefined)
  const [openCounter, setOpenCounter] = useState(false)
  const [valid, setValid] = useState(true)
  const [flash, setFlash] = useState(null)
  const prevAsked = useRef(null)

  const facts = draft?.facts || {}

  const plan = useMemo(
    () => planEncounter({ programmes, facts, encounterType: draft?.type }),
    [facts, draft?.type]
  )

  const currentKey = plan.remaining[0]
  const q = currentKey ? questionFor(currentKey, facts) : null
  const index = plan.answered.length
  const total = plan.questions.length

  // When skip logic removes questions, show it rather than letting the number
  // quietly change — this is the thing the whole project is claiming.
  useEffect(() => {
    if (prevAsked.current != null && prevAsked.current > plan.stats.asked) {
      const n = prevAsked.current - plan.stats.asked
      setFlash(`${n} question${n > 1 ? 's' : ''} not needed`)
      const t = setTimeout(() => setFlash(null), 2600)
      prevAsked.current = plan.stats.asked
      return () => clearTimeout(t)
    }
    prevAsked.current = plan.stats.asked
  }, [plan.stats.asked])

  useEffect(() => { setPending(undefined); setValid(true) }, [currentKey])

  if (!draft) return <Navigate to="/asha" replace />
  if (!currentKey) return <Navigate to="/asha/review" replace />

  const ready = valid && (q.type === 'bp'
    ? pending?.sys != null && pending?.dia != null
    : q.type === 'multi'
      ? Array.isArray(pending) && pending.length > 0
      : pending !== undefined && pending !== '')

  const commit = () => {
    if (!ready) return
    let paths, label
    if (q.type === 'bp') {
      paths = { 'vitals.bpSys': pending.sys, 'vitals.bpDia': pending.dia }
      label = `${pending.sys}/${pending.dia} mm Hg`
    } else if (q.type === 'multi') {
      paths = { [currentKey]: pending }
      const names = pending.filter(v => v !== q.noneValue)
        .map(v => q.options.find(o => o.v === v)?.l || v)
      label = names.length ? names.join(', ') : 'None'
    } else {
      paths = { [currentKey]: pending }
      const opt = q.options?.find(o => o.v === pending)
      label = opt ? opt.l : q.type === 'yesno' ? (pending ? 'Yes' : 'No') : String(pending)
    }
    say(label)
    answer(paths, { key: currentKey, paths: Object.keys(paths), label: q.q, value: label, at: Date.now() })
    setPending(undefined)
  }

  const goBack = () => {
    const last = draft.answeredOrder.filter(o => o.key !== 'visit.consentGiven').slice(-1)[0]
    if (last) unanswer(last.key)
    else nav(-1)
  }

  return (
    <>
      <TopBar title={draft.memberName || 'New visit'} sub={draft.type} back onBack={goBack}
        right={
          <button onClick={() => setOpenCounter(v => !v)}
            className="h-9 px-3 rounded-full bg-ink text-white text-[12px] font-bold num active:opacity-80">
            {plan.stats.baseline} → {plan.stats.asked}
          </button>
        } />

      {openCounter && (
        <div className="bg-ink text-white px-4 py-4 anim-up">
          <div className="space-y-1.5 text-[13px]">
            {[
              ['5 registers need', plan.stats.baseline, 'entries'],
              ['Same thing asked twice', -(plan.stats.baseline - plan.stats.unique), ''],
              ['App works these out', -plan.stats.derived, ''],
              ['Already known', -plan.stats.remembered, ''],
              ['Not needed for her', -plan.stats.skipped, ''],
            ].map(([l, v, u]) => (
              <div key={l} className="flex justify-between gap-4">
                <span className="text-white/70">{l}</span>
                <span className="font-bold num">{v > 0 ? v : v === 0 ? '0' : v} {u}</span>
              </div>
            ))}
            <div className="flex justify-between gap-4 pt-2 mt-2 border-t border-white/20">
              <span className="font-bold">You ask</span>
              <span className="font-bold num text-[17px]">{plan.stats.asked} questions</span>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-semibold text-ink-2 num">Question {index + 1} of {total}</span>
          <span className="text-[13px] text-ink-3 num">{total - index} left</span>
        </div>
        <Bar value={(index / Math.max(total, 1)) * 100} />
      </div>

      {flash && (
        <div className="mx-4 mt-3 rounded-xl bg-brand-soft border border-brand/25 px-3.5 py-2.5 anim-pop">
          <span className="text-[13px] font-semibold text-brand-700 flex items-center gap-1.5">
            <Icon name="check" size={15} stroke={2.6} /> {flash}
          </span>
        </div>
      )}

      <main key={currentKey} className="flex-1 px-4 pt-5 pb-4 flex flex-col anim-up">
        <div className="text-center mb-5">
          <div className="raise w-[68px] h-[68px] rounded-3xl grid place-items-center mx-auto mb-3.5 text-brand">
            <Icon name={q.icon} size={32} stroke={1.6} />
          </div>
          <div className="flex items-start justify-center gap-2">
            <h1 className="text-[24px] font-bold leading-snug text-balance">{q.q}</h1>
          </div>
          {q.hi && <p className="text-[16px] text-ink-2 mt-1.5">{q.hi}</p>}
          <div className="mt-3 flex justify-center"><Speaker text={`${q.q}`} /></div>
          {q.hint && (
            <p className="text-[12.5px] text-brand font-semibold mt-3 bg-brand-soft inline-block px-3 py-1.5 rounded-full">
              {q.hint}
            </p>
          )}
        </div>

        <div className="flex-1">
          <QuestionInput q={q} value={pending} onChange={setPending} onValid={setValid} />
        </div>

        <div className="pt-5 space-y-2 safe-bot">
          <Btn full onClick={commit} disabled={!ready}>
            {!valid ? 'Check that number'
              : ready ? 'Next'
              : q.type === 'multi' ? 'Tick what applies' : 'Choose an answer'}
          </Btn>
          {q.optional && (
            <button onClick={() => { answer({ [currentKey]: null }, { key: currentKey, paths: [currentKey], label: q.q, value: 'Skipped' }) }}
              className="w-full min-h-[44px] text-[14px] font-semibold text-ink-3">
              Skip this one
            </button>
          )}
        </div>
      </main>
    </>
  )
}
