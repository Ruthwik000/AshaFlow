import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PATH_LABELS } from '../../data/canonical'
import { TopBar, Card, Btn, Notice, Section, List, Row, Pill } from '../../components/ui'
import Icon from '../../components/Icon'

const AGENT_DRAFT = [
  { label: 'Name of beneficiary',       type: 'text',   req: true,  maps: 'person.name',       page: 4,  conf: 0.97 },
  { label: 'Mother’s age (years)', type: 'number', req: true,  maps: 'person.age',        page: 4,  conf: 0.94 },
  { label: 'Date of last menstrual period', type: 'date', req: true, maps: 'pregnancy.lmp',    page: 5,  conf: 0.96 },
  { label: 'Weight at registration',    type: 'number', req: true,  maps: 'vitals.weight',     page: 6,  conf: 0.91 },
  { label: 'Hb level (g/dL)',           type: 'number', req: true,  maps: 'vitals.hb',         page: 6,  conf: 0.93 },
  { label: 'Name of village / ward',    type: 'text',   req: true,  maps: 'household.village', page: 4,  conf: 0.89 },
  { label: 'JSY beneficiary status',    type: 'boolean',req: true,  maps: '',                  page: 9,  conf: 0.41 },
  { label: 'Delivery outcome code',     type: 'choice', req: false, maps: '',                  page: 11, conf: 0.38 },
]
const STEPS = ['Loading and splitting the PDF', 'Embedding into the vector store',
  'Retrieving canonical candidates', 'Extracting a structured schema']
const PATHS = Object.keys(PATH_LABELS)

export default function NewSchema() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [mode, setMode] = useState(sp.get('from') === 'scan' ? 'manual' : null)
  const [stage, setStage] = useState('idle')
  const [step, setStep] = useState(0)
  const [rows, setRows] = useState(AGENT_DRAFT.map(r => ({ ...r, status: 'pending' })))
  const [manual, setManual] = useState([{ label: '', type: 'text', maps: '', req: true }])
  const [name, setName] = useState('')

  const run = () => {
    setStage('running'); setStep(0)
    STEPS.forEach((_, i) => setTimeout(() => setStep(i + 1), (i + 1) * 650))
    setTimeout(() => setStage('review'), 2800)
  }
  const set = (i, status) => setRows(r => r.map((x, j) => j === i ? { ...x, status } : x))
  const approved = rows.filter(r => r.status === 'approved').length
  const low = rows.filter(r => r.conf < 0.6).length

  return (
    <>
      <TopBar title="Build a new form" sub="A programme we do not have yet" back onBack={() => nav('/asha/add')} />
      <main className="flex-1 px-4 py-4 space-y-4 pb-32">

        {!mode && (
          <>
            {[{ k: 'pdf', mark: 'doc', t: 'Read it from a PDF', tag: 'Agent',
                b: 'Upload the published government form. Every field is extracted, matched to the canonical record and shown with a confidence score for you to approve.' },
              { k: 'manual', mark: 'edit', t: 'Add the fields by hand', tag: null,
                b: 'For a short form, or when you already know exactly which fields you need.' }].map(o => (
              <button key={o.k} onClick={() => setMode(o.k)} className="press raise w-full text-left rounded-3xl p-5">
                <div className="flex items-start gap-3.5">
                  <span className="raise-sm w-12 h-12 shrink-0 rounded-2xl grid place-items-center text-brand">
                    <Icon name={o.mark} size={22} /></span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-[17px] tracking-[-0.01em]">{o.t}</div>
                      {o.tag && <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded bg-agent-soft text-agent">{o.tag}</span>}
                    </div>
                    <div className="text-[13px] text-ink-2 mt-2 leading-relaxed">{o.b}</div>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {mode === 'pdf' && stage === 'idle' && (
          <>
            <Notice tone="agent" title="What happens to the PDF">
              It is split, embedded, and each extracted label retrieves its nearest canonical matches before
              anything is proposed. The result goes to a drafts list — a person approves each row before
              it reaches any phone.
            </Notice>
            <div className="raise rounded-3xl p-8 text-center border-dashed">
              <div className="sink w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-3 text-ink-3"><Icon name="doc" size={26} /></div>
              <div className="font-bold text-[15px]">Drop a programme PDF</div>
              <div className="text-[12.5px] text-ink-3 mt-1">RCH manual · CBAC form · HBNC format</div>
            </div>
            <Btn full onClick={run}>Use the sample: MCTS-2 ANC form.pdf</Btn>
          </>
        )}

        {mode === 'pdf' && stage === 'running' && (
          <Card className="p-5 space-y-3.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <span className={`w-6 h-6 shrink-0 rounded-full grid place-items-center text-[11px] font-bold
                  ${step > i ? 'btn-solid text-white' : step === i ? 'bg-agent-soft text-agent' : 'sink text-ink-3'}`}>
                  {step > i ? <Icon name="check" size={13} stroke={3} /> : i + 1}
                </span>
                <span className={`text-[14px] ${step > i ? 'text-ink font-medium' : 'text-ink-3'}`}>{s}</span>
              </div>
            ))}
          </Card>
        )}

        {mode === 'pdf' && stage === 'review' && (
          <>
            <Notice tone="due" title={`${low} fields need a human decision`}>
              Anything under 0.6 confidence is flagged and cannot be approved in bulk. Every row cites the
              page it came from.
            </Notice>
            <Section title={`Proposed fields · ${approved} of ${rows.length} approved`}>
              <div className="space-y-2.5">
                {rows.map((r, i) => (
                  <Card key={i} className={`p-4 ${r.status === 'rejected' ? 'opacity-45' : ''}`}>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[14.5px] leading-tight">{r.label}</div>
                        <div className="text-[12px] text-ink-3 mt-1 num">{r.type} · {r.req ? 'required' : 'optional'} · page {r.page}</div>
                        <div className="text-[12.5px] mt-1.5">
                          {r.maps ? <>→ <code className="sink px-1.5 py-0.5 rounded num text-[11.5px]">{r.maps}</code></>
                                  : <span className="text-due font-semibold">no confident canonical match</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`text-[12px] font-bold num ${r.conf < 0.6 ? 'text-due' : 'text-brand'}`}>
                          {(r.conf * 100).toFixed(0)}%
                        </div>
                        {r.status !== 'pending' && (
                          <div className="mt-1.5">
                            <Pill level={r.status === 'approved' ? 'done' : 'late'}>
                              {r.status === 'approved' ? 'Kept' : 'Dropped'}
                            </Pill>
                          </div>
                        )}
                      </div>
                    </div>
                    {r.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Btn size="sm" onClick={() => set(i, 'approved')}>Approve</Btn>
                        <Btn size="sm" tone="ghost" onClick={() => set(i, 'rejected')}>Reject</Btn>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </Section>
          </>
        )}

        {mode === 'manual' && (
          <>
            <Card className="p-4">
              <label className="text-[12.5px] text-ink-2 font-medium">Form name</label>
              <input value={name} onChange={e => setName(e.target.value)} id="schemaname"
                placeholder="e.g. HBNC day-7 visit"
                className="sink w-full min-h-[52px] rounded-xl px-3.5 mt-2 text-[16px] font-semibold
                           placeholder:text-ink-3/50 placeholder:font-normal" />
            </Card>

            {manual.map((f, i) => (
              <Card key={i} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-ink-3 num">Field {i + 1}</span>
                  {manual.length > 1 && (
                    <button onClick={() => setManual(m => m.filter((_, j) => j !== i))}
                      className="text-[12px] font-semibold text-late">Remove</button>
                  )}
                </div>
                <input value={f.label} placeholder="Question on the form"
                  onChange={e => setManual(m => m.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  className="sink w-full min-h-[48px] rounded-xl px-3.5 text-[15px] placeholder:text-ink-3/50" />
                <div className="grid grid-cols-2 gap-2.5">
                  <select value={f.type} aria-label="Field type"
                    onChange={e => setManual(m => m.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
                    className="sink w-full min-h-[48px] rounded-xl px-3 text-[14px] font-medium">
                    {['text', 'number', 'date', 'boolean', 'choice'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={f.maps} aria-label="Canonical path"
                    onChange={e => setManual(m => m.map((x, j) => j === i ? { ...x, maps: e.target.value } : x))}
                    className="sink w-full min-h-[48px] rounded-xl px-3 text-[14px] font-medium">
                    <option value="">map to…</option>
                    {PATHS.map(p => <option key={p} value={p}>{PATH_LABELS[p]}</option>)}
                  </select>
                </div>
                {f.maps && (
                  <p className="text-[12px] text-brand">
                    Reuses <code className="num">{f.maps}</code> — it will never be asked twice.
                  </p>
                )}
              </Card>
            ))}

            <Btn full tone="ghost" size="md"
              onClick={() => setManual(m => [...m, { label: '', type: 'text', maps: '', req: true }])}>
              ＋ Add another field
            </Btn>

            <Notice tone="brand" title="Why mapping matters">
              Every field you map to an existing canonical path is a field the worker never answers again —
              the solver pulls it from what she already told you.
            </Notice>
          </>
        )}
      </main>

      {((mode === 'pdf' && stage === 'review') || mode === 'manual') && (
        <div className="sticky bottom-0 px-4 py-3 bg-paper/94 backdrop-blur border-t border-line safe-bot">
          <Btn full disabled={mode === 'pdf' ? approved === 0 : !name}
            onClick={() => nav('/asha/add')}>
            {mode === 'pdf' ? `Publish with ${approved} fields` : 'Save this form'}
          </Btn>
          <p className="text-[11.5px] text-ink-3 text-center mt-2.5 leading-relaxed">
            Published forms reach every phone on the next sync. No app update.
          </p>
        </div>
      )}
    </>
  )
}
