import { useState, useEffect } from 'react'
import { Btn } from './ui'
import Icon from './Icon'

/* Every input is thumb-sized, single-purpose and confirms with one tap.
   No scrolling forms, no keyboards where a pad will do. */

export function YesNo({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[{ v: true, l: 'Yes', hi: 'हाँ', i: 'check', tone: 'btn-solid text-white' },
        { v: false, l: 'No', hi: 'नहीं', i: 'close', tone: 'btn-danger text-white' }].map(o => {
        const on = value === o.v
        return (
          <button key={String(o.v)} onClick={() => onChange(o.v)}
            className={`press min-h-[136px] rounded-3xl flex flex-col items-center justify-center gap-1
              ${on ? o.tone : 'raise text-ink'}`}>
            <Icon name={o.i} size={40} stroke={2.4} />
            <span className="text-[19px] font-bold">{o.l}</span>
            <span className={`text-[13px] ${on ? 'opacity-80' : 'text-ink-3'}`}>{o.hi}</span>
          </button>
        )
      })}
    </div>
  )
}

export function NumberPad({ value, onChange, unit, min, max, step = 1 }) {
  const [txt, setTxt] = useState(value != null ? String(value) : '')
  useEffect(() => { setTxt(value != null ? String(value) : '') }, [value])

  const push = d => {
    let next = txt
    if (d === 'del') next = txt.slice(0, -1)
    else if (d === '.') { if (txt.includes('.') || step >= 1) return; next = (txt || '0') + '.' }
    else next = txt + d
    if (next.length > 12) return
    setTxt(next)
    onChange(next === '' ? undefined : Number(next))
  }

  const n = txt === '' ? null : Number(txt)
  const bad = n != null && ((min != null && n < min) || (max != null && n > max))
  const keys = ['1','2','3','4','5','6','7','8','9', step < 1 ? '.' : '', '0', 'del']

  return (
    <div>
      <div className={`sink rounded-2xl px-4 py-4 mb-3 text-center ${bad ? '!border-late' : ''}`}>
        <div className="text-[40px] font-bold leading-none num text-ink min-h-[42px]">
          {txt || <span className="text-line">0</span>}
        </div>
        {unit && <div className="text-[13px] text-ink-3 mt-1.5">{unit}</div>}
      </div>
      {bad && (
        <p className="text-[13px] text-late mb-2 text-center font-medium">
          Enter a value between {min} and {max}.
        </p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k, i) => k === '' ? <span key={i} /> : (
          <button key={i} onClick={() => push(k)}
            className="press raise min-h-[60px] rounded-2xl text-[22px] font-semibold text-ink num">
            {k === 'del' ? <Icon name="backspace" size={24} className="mx-auto" /> : k}
          </button>
        ))}
      </div>
    </div>
  )
}

export function BPInput({ value = {}, onChange }) {
  const [side, setSide] = useState('sys')
  const set = (k, v) => onChange({ ...value, [k]: v })
  const common = [[110, 70], [120, 80], [130, 85], [140, 90]]
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[{ k: 'sys', l: 'Upper (systolic)', v: value.sys },
          { k: 'dia', l: 'Lower (diastolic)', v: value.dia }].map(f => (
          <button key={f.k} onClick={() => setSide(f.k)}
            className={`press rounded-2xl p-3 text-center ${side === f.k ? 'raise !border-brand !bg-brand-soft' : 'raise'}`}>
            <div className="text-[30px] font-bold num leading-none text-ink">{f.v ?? '—'}</div>
            <div className="text-[11px] text-ink-2 mt-1.5">{f.l}</div>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {common.map(([s, d]) => (
          <button key={s} onClick={() => onChange({ sys: s, dia: d })}
            className="press raise-sm min-h-[42px] px-3.5 rounded-xl text-[14px] font-semibold text-ink-2 num">
            {s}/{d}
          </button>
        ))}
      </div>
      <NumberPad value={value[side]} onChange={v => set(side, v)}
        unit={side === 'sys' ? 'mm Hg — upper number' : 'mm Hg — lower number'} min={40} max={260} />
    </div>
  )
}

export function ChoiceGrid({ value, onChange, options }) {
  return (
    <div className={`grid gap-3 ${options.length > 4 ? 'grid-cols-2' : options.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {options.map(o => {
        const on = value === o.v
        return (
          <button key={String(o.v)} onClick={() => onChange(o.v)}
            className={`press min-h-[80px] rounded-2xl px-4 flex items-center justify-center text-center
              ${on ? 'btn-solid text-white' : 'raise text-ink'}`}>
            <span className="text-[17px] font-semibold">{o.l}</span>
          </button>
        )
      })}
    </div>
  )
}

export function DatePick({ value, onChange, quick = [], id = 'datefield' }) {
  const iso = d => new Date(d).toISOString().slice(0, 10)
  const ago = n => iso(new Date(Date.now() - n * 86400000))
  return (
    <div>
      <input id={id} type="date" value={value || ''} max={iso(new Date())}
        onChange={e => onChange(e.target.value || undefined)}
        className="sink w-full min-h-[64px] rounded-2xl px-4 text-[20px] font-semibold text-ink num" />
      {quick.length > 0 && (
        <>
          <p className="text-[12px] text-ink-3 mt-4 mb-2 px-1">Or choose roughly</p>
          <div className="grid grid-cols-2 gap-2">
            {quick.map(q => {
              const d = ago(q.days)
              const on = value === d
              return (
                <button key={q.l} onClick={() => onChange(d)}
                  className={`press min-h-[58px] rounded-2xl px-3 text-[15px] font-semibold
                    ${on ? 'btn-solid text-white' : 'raise text-ink-2'}`}>
                  {q.l}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function TextInput({ value, onChange, placeholder, id = 'textfield' }) {
  return (
    <input id={id} type="text" value={value || ''} placeholder={placeholder}
      onChange={e => onChange(e.target.value || undefined)} autoComplete="off"
      className="sink w-full min-h-[64px] rounded-2xl px-4 text-[20px] font-semibold text-ink
                 placeholder:text-ink-3/50 placeholder:font-normal" />
  )
}

/* Several answers to one question — the danger-sign checklists on the HBNC
   card, CBAC Part B, and the vaccines given at one session. Choosing the
   "none" option clears the rest, and choosing anything real clears "none",
   because "no danger signs" and "jaundice" cannot both be true. */
export function MultiSelect({ value, onChange, options, noneValue }) {
  const picked = Array.isArray(value) ? value : []
  const toggle = v => {
    if (noneValue && v === noneValue) return onChange([noneValue])
    const next = picked.includes(v) ? picked.filter(x => x !== v) : [...picked.filter(x => x !== noneValue), v]
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {options.map(o => {
        const on = picked.includes(o.v)
        const isNone = noneValue && o.v === noneValue
        return (
          <button key={String(o.v)} onClick={() => toggle(o.v)}
            className={`press w-full min-h-[58px] rounded-2xl px-4 flex items-center gap-3 text-left
              ${on ? (isNone ? 'btn-dark text-white' : 'btn-solid text-white') : 'raise text-ink'}`}>
            <span className={`w-6 h-6 rounded-md grid place-items-center shrink-0 border-2
              ${on ? 'bg-white/20 border-white/70' : 'border-line-2'}`}>
              {on && <Icon name="check" size={15} stroke={3} />}
            </span>
            <span className="text-[16px] font-semibold leading-tight">{o.l}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Renders whichever input the question declares. */
export function QuestionInput({ q, value, onChange, id }) {
  switch (q.type) {
    case 'yesno':  return <YesNo value={value} onChange={onChange} />
    case 'number': return <NumberPad value={value} onChange={onChange} unit={q.unit} min={q.min} max={q.max} step={q.step} />
    case 'choice': return <ChoiceGrid value={value} onChange={onChange} options={q.options} />
    case 'date':   return <DatePick value={value} onChange={onChange} quick={q.quick} id={id ? `${id}-date` : undefined} />
    case 'bp':     return <BPInput value={value || {}} onChange={onChange} />
    case 'multi':  return <MultiSelect value={value} onChange={onChange} options={q.options} noneValue={q.noneValue} />
    default:       return <TextInput value={value} onChange={onChange} placeholder={q.placeholder}
                            id={id ? `${id}-text` : undefined} />
  }
}

export { Btn }
