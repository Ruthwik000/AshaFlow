import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractFormFromImage, hasOCR } from '../../ai'
import { explain } from '../../ai/config'
import { saveCustomForm } from '../../db/db'
import { PATH_LABELS } from '../../data/canonical'
import Icon from '../../components/Icon'
import { TopBar, Card, Btn, Notice, Section, Pill, Field, TextField } from '../../components/ui'

/* Shown when no Grok key is configured, so the flow is still demonstrable. */
const SAMPLE = {
  name: 'Antenatal care register — page 4',
  issuedBy: 'National Health Mission',
  language: 'en',
  simulated: true,
  sections: [{
    title: 'Details',
    fields: [
      { label: 'Name of pregnant woman', type: 'text',   required: true,  value: 'Sunita Devi',  maps: 'person.name',         confidence: 0.96 },
      { label: 'Age',                    type: 'number', required: true,  value: '24',           maps: 'person.age',          confidence: 0.94 },
      { label: "Husband's name",         type: 'text',   required: true,  value: 'Ramesh Kumar', maps: 'person.husbandName',  confidence: 0.91 },
      { label: 'House no.',              type: 'text',   required: true,  value: '14',           maps: 'household.houseNo',   confidence: 0.97 },
      { label: 'LMP',                    type: 'date',   required: true,  value: '02/05/2026',   maps: 'pregnancy.lmp',       confidence: 0.88 },
      { label: 'Weight (kg)',            type: 'number', required: true,  value: '52',           maps: 'vitals.weight',       confidence: 0.93 },
      { label: 'Hb (g/dL)',              type: 'number', required: true,  value: '9.8',          maps: 'vitals.hb',           confidence: 0.72 },
      { label: 'TT dose given',          type: 'boolean',required: true,  value: '1st',          maps: 'tt.dose1Given',       confidence: 0.64 },
      { label: 'Remarks',                type: 'text',   required: false, value: 'referred PHC', maps: '',                    confidence: 0.31 },
    ],
  }],
}

const STEPS = ['Sending the photograph', 'Reading the printed labels',
               'Matching them to the record', 'Checking the values']
const PATHS = Object.keys(PATH_LABELS)

async function resizeImage(dataUrl, maxDim = 1600) {
  return new Promise(res => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width <= maxDim && height <= maxDim) {
        res(dataUrl)
        return
      }
      if (width > height) {
        height = Math.round((height * maxDim) / width)
        width = maxDim
      } else {
        width = Math.round((width * maxDim) / height)
        height = maxDim
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      res(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.onerror = () => res(dataUrl)
    img.src = dataUrl
  })
}

export default function ScanForm() {
  const nav = useNavigate()
  const fileRef = useRef(null)
  const [stage, setStage] = useState('pick')
  const [step, setStep] = useState(0)
  const [preview, setPreview] = useState(null)
  const [doc, setDoc] = useState(null)
  const [err, setErr] = useState(null)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(null)

  const fields = doc ? doc.sections.flatMap(s => s.fields) : []
  const mapped = fields.filter(f => f.maps).length
  const low = fields.filter(f => f.confidence < 0.75).length

  const run = async file => {
    setErr(null); setStage('reading'); setStep(0)
    const tick = STEPS.map((_, i) => setTimeout(() => setStep(i + 1), (i + 1) * 700))

    try {
      let dataUrl = null
      if (file) {
        const rawUrl = await new Promise((res, rej) => {
          const r = new FileReader()
          r.onload = () => res(r.result); r.onerror = rej
          r.readAsDataURL(file)
        })
        dataUrl = await resizeImage(rawUrl)
        setPreview(dataUrl)
      }

      const result = (hasOCR() && dataUrl)
        ? await extractFormFromImage(dataUrl)
        : await new Promise(r => setTimeout(() => r(SAMPLE), 2400))

      tick.forEach(clearTimeout)
      setDoc(result)
      setName(result.name || 'Scanned form')
      setStage('review')
    } catch (e) {
      tick.forEach(clearTimeout)
      setErr(explain('Vision OCR', e))
      setStage('pick')
    }
  }

  const drop = i => setDoc(d => ({
    ...d, sections: d.sections.map(s => ({ ...s, fields: s.fields.filter((_, j) => j !== i) })),
  }))
  const remap = (i, path) => setDoc(d => ({
    ...d, sections: d.sections.map(s => ({
      ...s, fields: s.fields.map((f, j) => (j === i ? { ...f, maps: path } : f)),
    })),
  }))

  const saveForm = async () => {
    const row = await saveCustomForm({
      name: name.trim() || 'Scanned form',
      subtitle: 'Read from a paper page',
      issuedBy: doc.issuedBy || 'Scanned in the field',
      appliesTo: 'any',
      about: 'Built from a photograph of a paper form. Fields mapped to the record fill themselves; the rest are asked.',
      publishedOn: new Date().toISOString().slice(0, 10),
      sections: doc.sections.map(s => ({
        title: s.title || 'Details',
        fields: s.fields.map((f, i) => ({
          id: 'f' + i, label: f.label, type: f.type || 'text',
          required: !!f.required, from: f.maps || `scan.${slug(f.label)}`,
        })),
      })),
    })
    setSaved(row)
  }

  return (
    <>
      <TopBar title="Scan a form" sub={hasOCR() ? 'Camera or PDF' : 'Camera or PDF · demo mode'}
        back onBack={() => nav('/asha/add')} />

      <main className="flex-1 px-4 py-4 space-y-4 pb-32">

        {stage === 'pick' && (
          <>
            {!hasOCR() && (
              <Notice tone="due" title="No OCR key configured">
                Add a Grok key (<code>VITE_GROK_API_KEY</code>) or Gemini key (<code>VITE_GEMINI_API_KEY</code>) to <code>.env</code> to read a real
                photograph. Without one this walks through a worked sample so the flow can still be shown.
              </Notice>
            )}
            {err && (
              <div className="rounded-2xl bg-late-soft border border-late/25 p-4"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)' }}>
                <div className="flex items-center gap-1.5 font-bold text-[14px] text-late">
                  <Icon name="alert" size={16} /> {err.title}
                </div>
                <p className="text-[13px] text-ink-2 mt-2 leading-relaxed whitespace-pre-line">{err.fix}</p>
                <div className="grid grid-cols-2 gap-2.5 mt-3.5">
                  <Btn size="sm" onClick={() => nav('/asha/diagnostics')}>Check the keys</Btn>
                  <Btn size="sm" tone="ghost" onClick={() => run(null)}>Use the sample</Btn>
                </div>
              </div>
            )}

            <div className="raise rounded-3xl p-8 text-center">
              <div className="sink w-20 h-20 mx-auto rounded-3xl grid place-items-center text-brand mb-4">
                <Icon name="scan" size={30} />
              </div>
              <div className="font-bold text-[16px]">Photograph a paper form</div>
              <div className="text-[13px] text-ink-2 mt-1.5 leading-relaxed max-w-[31ch] mx-auto">
                A register page, an MCP card, or any government form. The printed labels are read and
                matched to the record, and you can keep the layout as a form to use again.
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden
              onChange={e => e.target.files?.[0] && run(e.target.files[0])} />
            <div className="grid grid-cols-2 gap-3">
              <Btn onClick={() => fileRef.current?.click()}><Icon name="camera" size={18} /> Camera</Btn>
              <Btn tone="ghost" onClick={() => fileRef.current?.click()}>Choose a file</Btn>
            </div>
            <button onClick={() => run(null)} className="press w-full text-[13px] font-semibold text-ink-3 py-2">
              Use the worked sample instead
            </button>
          </>
        )}

        {stage === 'reading' && (
          <Card className="p-5 space-y-4">
            {preview
              ? <img src={preview} alt="the page being read"
                  className="w-full max-h-52 object-cover rounded-2xl border border-line" />
              : <div className="sink rounded-2xl h-40 grid place-items-center text-ink-3 text-[13px]">
                  Antenatal register, page 4
                </div>}
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <span className={`w-6 h-6 shrink-0 rounded-full grid place-items-center text-[11px] font-bold
                  ${step > i ? 'btn-solid text-white' : step === i ? 'bg-agent-soft text-agent' : 'sink text-ink-3'}`}>
                  {step > i ? <Icon name="check" size={12} stroke={2.6} /> : i + 1}
                </span>
                <span className={`text-[14px] ${step > i ? 'text-ink font-medium' : 'text-ink-3'}`}>{s}</span>
              </div>
            ))}
          </Card>
        )}

        {stage === 'review' && doc && (
          <>
            {doc.simulated ? (
              <Notice tone="due" title="Worked sample">
                No OCR key is set, so this is a fixed example rather than your photograph.
              </Notice>
            ) : (
              <div className="flex items-center gap-2 px-1 text-[12px]">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-soft text-brand font-medium">
                  <Icon name="check" size={13} stroke={2.4} />
                  Read by {doc.provider === 'gemini' ? 'Gemini Flash' : 'Grok Vision'}
                </span>
                {doc.fallbackFrom && (
                  <span className="text-ink-3 text-[11.5px]">
                    (Grok failed · recovered via Gemini vision)
                  </span>
                )}
              </div>
            )}

            <div className="raise rounded-2xl p-4">
              <div className="font-bold text-[16px] leading-tight">{doc.name}</div>
              {doc.issuedBy && <div className="text-[12.5px] text-ink-3 mt-0.5">{doc.issuedBy}</div>}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 text-[12px] text-ink-2 num">
                <span>{fields.length} fields read</span><span>·</span>
                <span>{mapped} matched to the record</span>
                {low > 0 && <><span>·</span><span className="text-due font-semibold">{low} need checking</span></>}
              </div>
            </div>

            <Section title="What was read">
              <div className="raise rounded-2xl overflow-hidden divide-y divide-line-2">
                {fields.map((f, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] text-ink-3">{f.label}</div>
                        {f.value ? <div className="text-[15.5px] font-semibold num mt-0.5">{f.value}</div> : null}
                        <div className="text-[12px] mt-1">
                          {f.maps
                            ? <span className="text-ink-3">→ <code className="num">{f.maps}</code></span>
                            : <span className="text-due font-semibold">no match — will be asked every time</span>}
                        </div>
                      </div>
                      <span className={`text-[12px] font-bold num shrink-0 ${f.confidence < 0.75 ? 'text-due' : 'text-brand'}`}>
                        {Math.round((f.confidence ?? 0) * 100)}%
                      </span>
                    </div>
                    {(f.confidence < 0.75 || !f.maps) && (
                      <div className="flex gap-2 mt-2.5">
                        <select value={f.maps || ''} onChange={e => remap(i, e.target.value)}
                          aria-label={`Map ${f.label}`}
                          className="sink flex-1 min-h-[40px] rounded-lg px-2.5 text-[13px] font-medium">
                          <option value="">not mapped</option>
                          {PATHS.map(p => <option key={p} value={p}>{PATH_LABELS[p]}</option>)}
                        </select>
                        <Btn size="sm" tone="ghost" onClick={() => drop(i)}>Drop</Btn>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {!saved ? (
              <Card className="p-4">
                <Field label="Keep this as a form" id="fname"
                  hint="It joins your form list. Next time you only pick the family — everything on record fills itself.">
                  <TextField id="fname" value={name} onChange={setName} placeholder="Name this form" />
                </Field>
              </Card>
            ) : (
              <Notice tone="brand" title="Saved as a form"
                action={<div className="grid grid-cols-2 gap-2.5">
                  <Btn size="md" onClick={() => nav(`/asha/forms/${saved.code}`)}>Use it now</Btn>
                  <Btn size="md" tone="ghost" onClick={() => nav('/asha/forms')}>See my forms</Btn>
                </div>}>
                <b className="text-ink">{saved.name}</b> is in your form list with {fields.length} fields,
                {' '}{mapped} of which fill themselves from a household's record.
              </Notice>
            )}

            <Notice tone="agent" title="Nothing is saved to anyone's record">
              Reading proposes; you decide. Keeping the form saves the layout, not the handwriting —
              the values belong to whichever family you choose when you fill it.
            </Notice>
          </>
        )}
      </main>

      {stage === 'review' && !saved && (
        <div className="sticky bottom-0 px-4 py-3 bg-paper/94 backdrop-blur border-t border-line safe-bot space-y-2.5">
          <Btn full onClick={saveForm} disabled={!name.trim()}>Save this as a form</Btn>
          <Btn full tone="ghost" size="md" onClick={() => nav('/asha/families?pick=1')}>
            Just start a visit instead
          </Btn>
        </div>
      )}
    </>
  )
}

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 28)
