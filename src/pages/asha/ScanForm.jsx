import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar, Card, Btn, Notice, Section, Pill, List, Row } from '../../components/ui'
import Icon from '../../components/Icon'

const EXTRACTED = [
  { label: 'Name of pregnant woman', value: 'Sunita Devi',  maps: 'person.name',        conf: 0.96 },
  { label: 'Age',                    value: '24',           maps: 'person.age',         conf: 0.94 },
  { label: 'Husband',                value: 'Ramesh Kumar', maps: 'person.husbandName', conf: 0.91 },
  { label: 'House no.',              value: '14',           maps: 'household.houseNo',  conf: 0.97 },
  { label: 'LMP',                    value: '02/05/2026',   maps: 'pregnancy.lmp',      conf: 0.88 },
  { label: 'Weight',                 value: '52',           maps: 'vitals.weight',      conf: 0.93 },
  { label: 'Hb',                     value: '9.8',          maps: 'vitals.hb',          conf: 0.72 },
  { label: 'TT dose',                value: '1st given',    maps: 'tt.dose1Given',      conf: 0.64 },
  { label: 'Remarks',                value: 'referred PHC', maps: '',                   conf: 0.31 },
]

const STEPS = ['Reading the page', 'Finding the field labels', 'Matching to the canonical record', 'Checking the values']

export default function ScanForm() {
  const nav = useNavigate()
  const [stage, setStage] = useState('pick')
  const [step, setStep] = useState(0)
  const [rows, setRows] = useState(EXTRACTED)

  const run = () => {
    setStage('reading'); setStep(0)
    STEPS.forEach((_, i) => setTimeout(() => setStep(i + 1), (i + 1) * 650))
    setTimeout(() => setStage('review'), 2800)
  }

  const low = rows.filter(r => r.conf < 0.75).length
  const mapped = rows.filter(r => r.maps).length

  return (
    <>
      <TopBar title="Scan a form" sub="Camera or PDF" back onBack={() => nav('/asha/add')} />
      <main className="flex-1 px-4 py-4 space-y-4 pb-32">

        {stage === 'pick' && (
          <>
            <div className="raise rounded-3xl p-8 text-center">
              <div className="sink w-20 h-20 mx-auto rounded-3xl grid place-items-center text-ink-2 mb-4"><Icon name="scan" size={34} /></div>
              <div className="font-bold text-[16px]">Photograph a filled form</div>
              <div className="text-[13px] text-ink-2 mt-1.5 leading-relaxed max-w-[30ch] mx-auto">
                A register page, an MCP card, or a form someone else filled in on paper.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Btn onClick={run}><span className="inline-flex items-center gap-1.5"><Icon name="camera" size={16} />Camera</span></Btn>
              <Btn tone="ghost" onClick={run}>Choose a file</Btn>
            </div>
            <Notice tone="info" title="Why this matters">
              Paper registers are legally required and most households already have years of them.
              Scanning lets a new install start with real data instead of an empty database.
            </Notice>
          </>
        )}

        {stage === 'reading' && (
          <Card className="p-5 space-y-4">
            <div className="sink rounded-2xl h-40 grid place-items-center text-ink-3 text-[13px]">
              ANC register page 4
            </div>
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

        {stage === 'review' && (
          <>
            <div className="raise rounded-2xl p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-ink-2">Read from the page</span>
                <span className="text-[13px] font-bold num">{mapped} of {rows.length} matched</span>
              </div>
              {low > 0 && (
                <p className="text-[12.5px] text-due font-semibold mt-2">
                  {low} values need your eyes before they are used.
                </p>
              )}
            </div>

            <Section title="Check each value">
              <List>
                {rows.map((r, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] text-ink-3">{r.label}</div>
                        <div className="text-[16px] font-semibold num leading-tight mt-0.5">{r.value}</div>
                        <div className="text-[12px] mt-1">
                          {r.maps
                            ? <span className="text-ink-3">→ <code className="num">{r.maps}</code></span>
                            : <span className="text-due font-semibold">no confident match — will not be used</span>}
                        </div>
                      </div>
                      <span className={`text-[12px] font-bold num shrink-0 ${r.conf < 0.75 ? 'text-due' : 'text-brand'}`}>
                        {(r.conf * 100).toFixed(0)}%
                      </span>
                    </div>
                    {r.conf < 0.75 && r.maps && (
                      <div className="grid grid-cols-2 gap-2 mt-2.5">
                        <Btn size="sm" tone="ghost">Correct it</Btn>
                        <Btn size="sm" tone="ghost" onClick={() => setRows(x => x.filter((_, j) => j !== i))}>Drop</Btn>
                      </div>
                    )}
                  </div>
                ))}
              </List>
            </Section>

            <Notice tone="agent" title="Nothing is saved yet">
              Extraction proposes; you decide. Only the values you keep enter the record, and the original
              image is attached as the proof behind them.
            </Notice>
          </>
        )}
      </main>

      {stage === 'review' && (
        <div className="sticky bottom-0 px-4 py-3 bg-paper/94 backdrop-blur border-t border-line safe-bot space-y-2.5">
          <Btn full onClick={() => nav('/asha/families?pick=1&prefill=1')}>
            Use these to start a visit
          </Btn>
          <Btn full tone="ghost" size="md" onClick={() => nav('/asha/new-schema?from=scan')}>
            Save the layout as a new form
          </Btn>
        </div>
      )}
    </>
  )
}
