import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, getLearned, saveLearned, saveFormSubmission } from '../../db/db'
import { formByCode } from '../../data/schemeForms'
import { buildSubjectFacts, fillForm, formPayload } from '../../engine/prefill'
import { QuestionInput } from '../../components/inputs'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, Btn, Bar, Pill, Notice, fmtDate } from '../../components/ui'

const SRC = {
  record:  { l: 'from her record', c: 'text-info' },
  derived: { l: 'calculated',      c: 'text-brand' },
  entered: { l: 'you typed this',  c: 'text-ink-2' },
  missing: { l: 'needs an answer', c: 'text-due' },
}

const EMPTY = v => v === undefined || v === null || v === ''

const show = v => v === true ? 'Yes' : v === false ? 'No'
  : v === undefined || v === null || v === '' ? '—'
  : /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? fmtDate(v) : String(v)

export default function FormFill() {
  const { code, memberId } = useParams()
  const nav = useNavigate()
  const form = formByCode[code]

  const [ctx, setCtx] = useState(null)
  const [answers, setAnswers] = useState({})
  // The set of questions is decided once, when the record is read. If it were
  // recomputed as answers arrive, a field would vanish on its first keystroke.
  const [askList, setAskList] = useState([])
  const [openSec, setOpenSec] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const member = await db.members.get(memberId)
      if (!member) return setCtx({ missing: true })
      const [household, encounters, learned] = await Promise.all([
        db.households.get(member.householdId),
        db.encounters.where('memberId').equals(memberId).toArray(),
        getLearned(memberId),
      ])
      const { facts, trace } = buildSubjectFacts({ household, member, encounters, learned })
      setAskList(fillForm(form, facts, trace, {}).missing)
      setCtx({ member, household, facts, trace, learned })
    })()
  }, [memberId])

  const filled = useMemo(
    () => ctx?.facts ? fillForm(form, ctx.facts, ctx.trace, answers) : null,
    [ctx, form, answers]
  )

  if (!form) return <div className="p-6 text-ink-3">Form not found</div>
  if (!ctx) return <div className="p-6 text-ink-3">Reading her record…</div>
  if (ctx.missing) return <div className="p-6 text-ink-3">Person not found</div>

  const set = (path, v) => setAnswers(a => ({ ...a, [path]: v }))
  const answeredCount = askList.filter(f => !EMPTY(answers[f.from])).length

  const submit = async () => {
    setSaving(true)
    await saveLearned(memberId, answers)
    const row = await saveFormSubmission({
      formCode: form.code, formName: form.name, formVersion: form.version,
      memberId, memberName: ctx.member.name,
      householdId: ctx.household?.id, houseNo: ctx.household?.houseNo,
      village: ctx.household?.village,
      payload: formPayload(filled),
      stats: filled.stats,
      typedCount: Object.keys(answers).length,
    })
    nav(`/asha/submissions?new=${row.id}`, { replace: true })
  }

  return (
    <>
      <TopBar title={form.name} sub={`${ctx.member.name} · House ${ctx.household?.houseNo}`}
        back onBack={() => nav(`/asha/forms/${code}`)} />

      <main className="flex-1 px-4 py-4 space-y-5 pb-32">

        <Card className="p-4">
          <div className="flex items-baseline justify-between mb-2.5">
            <span className="text-[13.5px] font-semibold">Already filled for you</span>
            <span className="text-[15px] font-bold num">{filled.stats.known} of {filled.stats.total}</span>
          </div>
          <Bar value={filled.stats.pct} />
          <p className="text-[12.5px] text-ink-2 mt-3 leading-relaxed">
            {filled.stats.known} fields came from her record. {askList.length} need an answer
            {askList.filter(f => f.required).length < askList.length &&
              ` — ${askList.filter(f => f.required).length} of them required`}.
          </p>
        </Card>

        {askList.length > 0 && (
          <Section title={`Needs your answer · ${answeredCount} of ${askList.length} done`}>
            <div className="space-y-3">
              {askList.map(f => {
                const done = !EMPTY(answers[f.from])
                return (
                  <Card key={f.id} className="p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[15px] leading-snug">{f.label}</div>
                        {f.hint && <div className="text-[12.5px] text-ink-3 mt-1 leading-snug">{f.hint}</div>}
                      </div>
                      {done
                        ? <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full btn-solid grid place-items-center text-white">
                            <Icon name="check" size={13} stroke={2.6} />
                          </span>
                        : f.required
                          ? <Pill level="due">Required</Pill>
                          : <span className="text-[11.5px] text-ink-3 shrink-0 mt-1">optional</span>}
                    </div>
                    <div data-field={f.id}>
                      <QuestionInput id={`f-${f.id}`}
                        q={{ type: f.type === 'boolean' ? 'yesno' : f.type, options: f.options,
                             placeholder: f.label, unit: f.unit }}
                        value={answers[f.from]}
                        onChange={v => set(f.from, v)} />
                    </div>
                    <div className="text-[11.5px] text-ink-3 mt-2.5 num">
                      saves as <code>{f.from}</code> — never asked again
                    </div>
                  </Card>
                )
              })}
            </div>
          </Section>
        )}

        {askList.length === 0 && (
          <Notice tone="brand" title="Nothing left to ask">
            Every field on this form was already in her record. Check it below and submit.
          </Notice>
        )}

        <Section title="The whole form">
          <div className="space-y-2.5">
            {filled.sections.map(sec => {
              const isOpen = openSec === sec.title
              const gaps = sec.fields.filter(f => f.source === 'missing').length
              return (
                <Card key={sec.title} className="overflow-hidden">
                  <button onClick={() => setOpenSec(isOpen ? null : sec.title)}
                    className="press w-full flex items-center gap-3 p-4 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[14.5px]">{sec.title}</div>
                      <div className="text-[12px] text-ink-3 mt-0.5 num">
                        {sec.fields.length - gaps} of {sec.fields.length} filled
                      </div>
                    </div>
                    {gaps > 0 && <Pill level="due">{gaps} to go</Pill>}
                    <span className={`text-ink-3 shrink-0 transition ${isOpen ? 'rotate-90' : ''}`}>
                      <Icon name="chevron" size={16} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-line-2 anim-up">
                      {sec.note && (
                        <p className="px-4 py-2.5 text-[12px] text-ink-2 bg-brand-tint border-b border-line-2">
                          {sec.note}
                        </p>
                      )}
                      <div className="divide-y divide-line-2">
                        {sec.fields.map(f => (
                          <div key={f.id} className="px-4 py-2.5 flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] text-ink-3">{f.label}</div>
                              <div className={`text-[14.5px] font-semibold num mt-0.5
                                ${f.source === 'missing' ? 'text-due font-normal' : ''}`}>
                                {f.source === 'missing' ? 'not answered yet' : show(f.value)}
                              </div>
                              {f.why && <div className="text-[11.5px] text-ink-3 mt-1">{f.why}</div>}
                            </div>
                            <span className={`text-[10.5px] font-bold uppercase tracking-wide shrink-0 mt-1
                              ${SRC[f.source].c}`}>
                              {f.source === 'record' ? 'record' : f.source === 'derived' ? 'calc'
                                : f.source === 'entered' ? 'typed' : 'blank'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </Section>

        <p className="text-[11.5px] text-ink-3 px-1 leading-relaxed">
          Submitting saves the form on this phone and queues it for the next sync. Anything you typed
          is kept against this person, so the next form does not ask for it again.
        </p>
      </main>

      <div className="sticky bottom-0 px-4 py-3 bg-paper/94 backdrop-blur border-t border-line safe-bot">
        <Btn full disabled={!filled.complete || saving} onClick={submit}>
          {saving ? 'Saving…'
            : filled.complete ? 'Submit this form'
            : `${filled.blocking.length} required field${filled.blocking.length > 1 ? 's' : ''} left`}
        </Btn>
      </div>
    </>
  )
}
