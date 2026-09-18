import { useState } from 'react'
import { TopBar, Card, Btn, Notice, Section, Pill } from '../../components/ui'
import Icon from '../../components/Icon'

const DRAFT = [
  { label: 'Name of beneficiary',        type: 'text',    req: true,  maps: 'person.name',        page: 4,  conf: 0.97 },
  { label: 'Mother’s age (years)',  type: 'number',  req: true,  maps: 'person.age',         page: 4,  conf: 0.94 },
  { label: 'Date of last menstrual period', type: 'date', req: true,  maps: 'pregnancy.lmp',      page: 5,  conf: 0.96 },
  { label: 'Weight at registration',     type: 'number',  req: true,  maps: 'vitals.weight',      page: 6,  conf: 0.91 },
  { label: 'Hb level (g/dL)',            type: 'number',  req: true,  maps: 'vitals.hb',          page: 6,  conf: 0.93 },
  { label: 'Name of village / ward',     type: 'text',    req: true,  maps: 'household.village',  page: 4,  conf: 0.89 },
  { label: 'Beneficiary contact no.',    type: 'number',  req: false, maps: 'person.mobile',      page: 4,  conf: 0.88 },
  { label: 'JSY beneficiary status',     type: 'boolean', req: true,  maps: '',                   page: 9,  conf: 0.41 },
  { label: 'Delivery outcome code',      type: 'choice',  req: false, maps: '',                   page: 11, conf: 0.38 },
]

export default function AddProgramme() {
  const [stage, setStage] = useState('upload')
  const [rows, setRows] = useState(DRAFT.map(d => ({ ...d, status: 'pending' })))
  const [step, setStep] = useState(0)

  const run = () => {
    setStage('running'); setStep(0)
    const steps = [1, 2, 3, 4]
    steps.forEach((s, i) => setTimeout(() => setStep(s), (i + 1) * 700))
    setTimeout(() => setStage('review'), 3000)
  }

  const set = (i, status) => setRows(r => r.map((x, j) => j === i ? { ...x, status } : x))
  const approved = rows.filter(r => r.status === 'approved').length
  const lowConf = rows.filter(r => r.conf < 0.6).length

  const STEPS = [
    'Loading and splitting the PDF',
    'Embedding chunks into pgvector',
    'Retrieving canonical field candidates',
    'Extracting a structured schema',
  ]

  return (
    <>
      <TopBar title="Schema Reader" sub="Upload a form, get a programme" back />
      <main className="flex-1 px-4 py-4 space-y-5 pb-8">
        {stage === 'upload' && (
          <>
            <Notice tone="agent" title="What this agent does">
              It reads a published government data-entry form, extracts every field, and proposes a
              mapping onto the canonical record. It writes to a <i>drafts</i> table — a person
              approves each row before anything reaches the field.
            </Notice>
            <Card className="p-8 text-center border-dashed">
              <div className="sink w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-3 text-ink-2"><Icon name="doc" size={30} /></div>
              <div className="font-semibold text-[15px]">Drop a programme PDF here</div>
              <div className="text-[12.5px] text-ink-3 mt-1">RCH manual, CBAC form, HBNC format…</div>
            </Card>
            <Btn full onClick={run}>Use the sample: MCTS-2 ANC form.pdf</Btn>
          </>
        )}

        {stage === 'running' && (
          <Card className="p-5 space-y-3.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <span className={`w-6 h-6 shrink-0 rounded-full grid place-items-center text-[12px] font-bold
                  ${step > i ? 'bg-brand text-white' : step === i ? 'bg-agent-soft text-agent' : 'bg-line-2 text-ink-3'}`}>
                  {step > i ? <Icon name="check" size={13} stroke={3} /> : i + 1}
                </span>
                <span className={`text-[14px] ${step > i ? 'text-ink font-medium' : 'text-ink-3'}`}>{s}</span>
              </div>
            ))}
          </Card>
        )}

        {stage === 'review' && (
          <>
            <Notice tone="due" title={`${lowConf} fields need a human decision`}>
              Anything below 0.6 confidence is flagged and cannot be bulk-approved. Every row cites
              the page it came from.
            </Notice>

            <Section title={`Proposed fields · ${approved} of ${rows.length} approved`}>
              <div className="space-y-2">
                {rows.map((r, i) => (
                  <Card key={i} className={`p-3.5 ${r.status === 'rejected' ? 'opacity-45' : ''}`}>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[14px] leading-tight">{r.label}</div>
                        <div className="text-[12px] text-ink-3 mt-1 num">
                          {r.type} · {r.req ? 'required' : 'optional'} · page {r.page}
                        </div>
                        <div className="text-[12.5px] mt-1.5">
                          {r.maps
                            ? <>maps to <code className="bg-line-2 px-1.5 py-0.5 rounded num">{r.maps}</code></>
                            : <span className="text-due font-semibold">no confident canonical match</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`text-[12px] font-bold num ${r.conf < 0.6 ? 'text-due' : 'text-brand'}`}>
                          {(r.conf * 100).toFixed(0)}%
                        </div>
                        {r.status !== 'pending' && (
                          <div className="mt-1">
                            <Pill level={r.status === 'approved' ? 'done' : 'late'}>
                              {r.status === 'approved' ? 'Approved' : 'Rejected'}
                            </Pill>
                          </div>
                        )}
                      </div>
                    </div>
                    {r.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Btn size="sm" tone="soft" onClick={() => set(i, 'approved')}>Approve</Btn>
                        <Btn size="sm" tone="ghost" onClick={() => set(i, 'rejected')}>Reject</Btn>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </Section>

            <Btn full disabled={approved === 0}>
              Publish as programme #{6} ({approved} fields)
            </Btn>
            <p className="text-[12px] text-ink-3 leading-relaxed px-1">
              Publishing bumps the version and serves it at <code>/api/programmes</code>. Every phone
              picks it up on its next sync and starts producing a sixth output — with no new app build.
            </p>
          </>
        )}
      </main>
    </>
  )
}
