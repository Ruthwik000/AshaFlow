import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createHousehold, createMember, createEnrolment } from '../../db/db'
import { schemesForRole, SUGGESTED } from '../../data/enrolOptions'
import {
  SEXES, RELATIONS, STATUSES, reconcile, statusBlocked, relationBlocked, statusFromAge,
} from '../../engine/roles'
import Icon from '../../components/Icon'
import { TopBar, Card, Btn, Field, TextField, Chips, Notice } from '../../components/ui'

const VILLAGES = [{ v: 'Rampur', l: 'Rampur' }, { v: 'Kishanpur', l: 'Kishanpur' },
                  { v: 'Bela', l: 'Bela' }, { v: 'Sohagpur', l: 'Sohagpur' }]
const WATER = [{ v: 'tap', l: 'Tap' }, { v: 'handpump', l: 'Hand pump' },
               { v: 'well', l: 'Well' }, { v: 'other', l: 'Other' }]
const YESNO = [{ v: true, l: 'Yes' }, { v: false, l: 'No' }]
const RATION = [{ v: 'AAY', l: 'Antyodaya' }, { v: 'BPL', l: 'BPL' },
                { v: 'APL', l: 'APL' }, { v: 'none', l: 'None' }]
const CASTE = [{ v: 'SC', l: 'SC' }, { v: 'ST', l: 'ST' }, { v: 'OBC', l: 'OBC' }, { v: 'GEN', l: 'General' }]
const HOUSE = [{ v: 'kutcha', l: 'Kutcha' }, { v: 'semi', l: 'Semi-pucca' }, { v: 'pucca', l: 'Pucca' }]
const FUEL = [{ v: 'lpg', l: 'LPG' }, { v: 'wood', l: 'Wood' }, { v: 'mixed', l: 'Both' }]



const blankMember = () => ({
  key: Math.random().toString(36).slice(2),
  name: '', age: '', sex: 'F', role: 'adult', relation: 'wife',
  lmp: '', dob: '', mobile: '', schemes: [], note: null,
})

function MultiChips({ value = [], onChange, options, cols = 2 }) {
  const toggle = v => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {options.map(o => {
        const on = value.includes(o.v)
        return (
          <button key={o.v} onClick={() => toggle(o.v)}
            className={`press min-h-[46px] rounded-xl px-2.5 text-[13px] font-semibold text-left
              flex items-center gap-2 ${on ? 'btn-solid text-white' : 'raise text-ink-2'}`}>
            <span className={`w-4 h-4 shrink-0 rounded grid place-items-center border
              ${on ? 'bg-white/25 border-white/50' : 'border-line bg-surface'}`}>
              {on && <Icon name="check" size={11} stroke={3} />}
            </span>
            <span className="leading-tight">{o.l}</span>
          </button>
        )
      })}
    </div>
  )
}

function MemberCard({ m, n, onChange, onRemove, open, onToggle }) {
  /* Every edit goes through reconcile, so the three fields can never end up
     describing a pregnant father. */
  const apply = patch => {
    const { person, note } = reconcile(m, patch)
    onChange({ ...person, note })
  }
  const setAge = age => {
    const guess = statusFromAge(age)
    apply(guess && !m.touchedRole
      ? { age, role: guess, schemes: SUGGESTED[guess] || [] }
      : { age })
  }

  const isBaby = m.role === 'infant' || m.role === 'child'
  const opts = schemesForRole(m.role).map(s => ({ v: s.code, l: s.label }))

  const relationOpts = RELATIONS.map(r => ({ ...r, off: relationBlocked(r.v, m) }))
  const statusOpts = STATUSES.map(x => ({ ...x, off: statusBlocked(x.v, m) }))

  return (
    <div className="raise-sm rounded-xl overflow-hidden">
      <button onClick={onToggle} className="press w-full flex items-center gap-3 px-3.5 py-3 text-left">
        <span className="sink w-9 h-9 shrink-0 rounded-lg grid place-items-center text-brand">
          <Icon name={m.role === 'pregnant' ? 'heart' : isBaby ? 'baby' : 'user'} size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[14.5px] leading-tight truncate">
            {m.name.trim() || `Person ${n}`}
          </div>
          <div className="text-[12px] text-ink-3 mt-0.5 truncate">
            {[m.age && `${m.age} yrs`, STATUSES.find(r => r.v === m.role)?.l,
              m.schemes.length && `${m.schemes.length} ${m.schemes.length === 1 ? 'scheme' : 'schemes'}`]
              .filter(Boolean).join(' · ') || 'Tap to fill in'}
          </div>
        </div>
        <span className={`text-ink-3 shrink-0 transition ${open ? 'rotate-90' : ''}`}>
          <Icon name="chevron" size={15} />
        </span>
      </button>

      {open && (
        <div className="border-t border-line-2 p-3.5 space-y-4 anim-up">
          <Field label="Name" id={`mn${m.key}`}>
            <TextField id={`mn${m.key}`} value={m.name} onChange={v => apply({ name: v })} placeholder="Full name" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age" id={`ma${m.key}`}>
              <TextField id={`ma${m.key}`} type="number" value={m.age} onChange={setAge} placeholder="Years" />
            </Field>
            <Field label="Sex">
              <Chips value={m.sex} onChange={v => apply({ sex: v })} options={SEXES} cols={2} />
            </Field>
          </div>
          <Field label="Relation to the head">
            <Chips value={m.relation} onChange={v => apply({ relation: v })} options={relationOpts} cols={3} />
          </Field>
          <Field label="Status" hint="This decides which schemes and visits apply.">
            <Chips value={m.role} options={statusOpts} cols={3}
              onChange={v => apply({ role: v, touchedRole: true, schemes: SUGGESTED[v] || [] })} />
          </Field>

          {m.note && (
            <div className="flex items-start gap-1.5 rounded-lg bg-info-soft px-2.5 py-2">
              <span className="text-info shrink-0 mt-0.5"><Icon name="info" size={12} /></span>
              <span className="text-[11.5px] text-info leading-snug">
                That did not fit, so I {m.note}.
              </span>
            </div>
          )}

          {m.role === 'pregnant' && (
            <Field label="Date of last menstrual period" id={`ml${m.key}`}
              hint="One answer fills the delivery date, all four ANC dates, the Td schedule and the baby's first-year vaccine calendar.">
              <TextField id={`ml${m.key}`} type="date" value={m.lmp} onChange={v => apply({ lmp: v })} />
            </Field>
          )}
          {isBaby && (
            <Field label="Date of birth" id={`md${m.key}`}>
              <TextField id={`md${m.key}`} type="date" value={m.dob} onChange={v => apply({ dob: v })} />
            </Field>
          )}

          {opts.length > 0 && (
            <Field label="Schemes this person is on"
              hint="Ticked by default for this status. Untick anything that does not apply.">
              <MultiChips value={m.schemes} onChange={v => apply({ schemes: v })} options={opts} cols={1} />
            </Field>
          )}

          <button onClick={onRemove}
            className="press w-full min-h-[44px] rounded-xl raise-sm text-[13.5px] font-semibold text-late">
            Remove this person
          </button>
        </div>
      )}
    </div>
  )
}

export default function NewHousehold() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const next = sp.get('next')            // 'person' → go straight on to adding someone
  const form = sp.get('form')            // carry a scheme form through the whole chain

  const [d, setD] = useState({
    houseNo: '', headName: '', village: 'Rampur', hamlet: '', mobile: '',
    caste: '', religion: '', membersCount: '',
    rationCard: '', bplCard: null, pmjay: null, bankAccount: null,
    hasToilet: null, waterSource: '', cookingFuel: '', houseType: '', note: '',
  })
  const [members, setMembers] = useState([])
  const [openKey, setOpenKey] = useState(null)
  const [more, setMore] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (k, v) => setD(x => ({ ...x, [k]: v }))
  const ready = d.houseNo.trim() && d.headName.trim() && d.village
  const named = members.filter(m => m.name.trim())
  const schemeCount = members.reduce((n, m) => n + (m.name.trim() ? m.schemes.length : 0), 0)

  const addMember = () => {
    const m = blankMember()
    setMembers(xs => [...xs, m])
    setOpenKey(m.key)
  }
  const patch = (key, m) => setMembers(xs => xs.map(x => (x.key === key ? { ...m, key } : x)))
  const drop = key => setMembers(xs => xs.filter(x => x.key !== key))

  const save = async () => {
    setBusy(true)
    const count = Number(d.membersCount) || named.length || 1
    const h = await createHousehold({
      ...d,
      bplCard: d.bplCard ?? (d.rationCard === 'BPL' || d.rationCard === 'AAY'),
      membersCount: Math.max(count, named.length),
    })

    for (const m of named) {
      const row = await createMember({
        householdId: h.id, name: m.name.trim(), age: m.age, sex: m.sex, role: m.role,
        relation: m.relation, lmp: m.lmp, dob: m.dob,
        mobile: m.mobile || d.mobile, caste: d.caste,
      })
      for (const code of m.schemes) {
        const s = schemesForRole(m.role).find(x => x.code === code)
        await createEnrolment({
          memberId: row.id, householdId: h.id, scheme: code,
          label: s?.label || code, phase: s?.phase, state: 'active',
        })
      }
    }

    if (next === 'person') {
      nav(`/asha/people/new?household=${h.id}${form ? `&form=${form}` : ''}`, { replace: true })
    } else {
      nav(`/asha/family/${h.id}`, { replace: true })
    }
  }

  return (
    <>
      <TopBar title="Add a family" sub="A household not yet on your list" back />
      <main className="flex-1 px-4 py-4 space-y-4 pb-36">
        <Notice tone="brand" title="Entered once, used everywhere">
          The house, the people in it and the schemes they are on are stored together. Every form and
          every visit for this household reads from here afterwards, so none of it is asked twice.
        </Notice>

        {/* ---------------------------------------------------------- house */}
        <Card className="p-4 space-y-4">
          <div className="text-[13px] font-semibold text-ink-3 uppercase tracking-wide">The house</div>
          <Field label="House number" required id="hno">
            <TextField id="hno" value={d.houseNo} onChange={v => set('houseNo', v)} placeholder="e.g. 47" />
          </Field>
          <Field label="Head of the family" required id="head">
            <TextField id="head" value={d.headName} onChange={v => set('headName', v)} placeholder="Full name" />
          </Field>
          <Field label="Village" required>
            <Chips value={d.village} onChange={v => set('village', v)} options={VILLAGES} cols={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hamlet or tola" id="ham">
              <TextField id="ham" value={d.hamlet} onChange={v => set('hamlet', v)} placeholder="Optional" />
            </Field>
            <Field label="Mobile" id="hmob">
              <TextField id="hmob" type="number" value={d.mobile} onChange={v => set('mobile', v)} placeholder="10 digits" />
            </Field>
          </div>
        </Card>

        {/* -------------------------------------------------------- members */}
        <Card className="p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="text-[13px] font-semibold text-ink-3 uppercase tracking-wide">Family members</div>
            <div className="text-[12px] text-ink-3 num">
              {named.length} added{schemeCount ? ` · ${schemeCount} schemes` : ''}
            </div>
          </div>

          {members.length === 0 && (
            <p className="text-[13px] text-ink-3 leading-relaxed">
              Add everyone who lives here. Whoever is pregnant, every child under five and every adult
              over thirty then appears in your caseload straight away.
            </p>
          )}

          <div className="space-y-2">
            {members.map((m, i) => (
              <MemberCard key={m.key} m={m} n={i + 1}
                open={openKey === m.key}
                onToggle={() => setOpenKey(k => (k === m.key ? null : m.key))}
                onChange={v => patch(m.key, v)}
                onRemove={() => drop(m.key)} />
            ))}
          </div>

          <button onClick={addMember}
            className="press raise-sm w-full min-h-[50px] rounded-xl flex items-center justify-center
                       gap-2 text-[14px] font-semibold text-brand">
            <Icon name="plus" size={17} stroke={2.2} /> Add a person
          </button>
        </Card>

        {/* --------------------------------------------------- entitlements */}
        <Card className="p-4 space-y-4">
          <div className="text-[13px] font-semibold text-ink-3 uppercase tracking-wide">
            Cards and entitlements
          </div>
          <Field label="Ration card" hint="Decides Antyodaya and BPL-linked benefits.">
            <Chips value={d.rationCard} onChange={v => set('rationCard', v)} options={RATION} cols={2} />
          </Field>
          <Field label="Ayushman Bharat (PM-JAY) card">
            <Chips value={d.pmjay} onChange={v => set('pmjay', v)} options={YESNO} cols={2} />
          </Field>
          <Field label="Bank account in the woman's own name"
            hint="PMMVY and JSY money cannot be released without one.">
            <Chips value={d.bankAccount} onChange={v => set('bankAccount', v)} options={YESNO} cols={2} />
          </Field>
          <Field label="Category">
            <Chips value={d.caste} onChange={v => set('caste', v)} options={CASTE} cols={4} />
          </Field>
        </Card>

        {/* -------------------------------------------------- more details */}
        <Card className="overflow-hidden">
          <button onClick={() => setMore(v => !v)} className="press w-full px-4 py-3.5 flex items-center gap-3 text-left">
            <span className="sink w-9 h-9 shrink-0 rounded-lg grid place-items-center text-ink-2">
              <Icon name="home" size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[14.5px] leading-tight">Other household details</div>
              <div className="text-[12px] text-ink-3 mt-0.5">Toilet, water, fuel, house type, a note</div>
            </div>
            <span className={`text-ink-3 shrink-0 transition ${more ? 'rotate-90' : ''}`}>
              <Icon name="chevron" size={15} />
            </span>
          </button>

          {more && (
            <div className="border-t border-line-2 p-4 space-y-4 anim-up">
              <Field label="How many people live here?" hint="Leave blank to use the people you added above." id="cnt">
                <TextField id="cnt" type="number" value={d.membersCount}
                  onChange={v => set('membersCount', v)} placeholder={String(named.length || 5)} />
              </Field>
              <Field label="Toilet in the house">
                <Chips value={d.hasToilet} onChange={v => set('hasToilet', v)} options={YESNO} cols={2} />
              </Field>
              <Field label="Drinking water source">
                <Chips value={d.waterSource} onChange={v => set('waterSource', v)} options={WATER} cols={2} />
              </Field>
              <Field label="Cooking fuel">
                <Chips value={d.cookingFuel} onChange={v => set('cookingFuel', v)} options={FUEL} cols={3} />
              </Field>
              <Field label="House type">
                <Chips value={d.houseType} onChange={v => set('houseType', v)} options={HOUSE} cols={3} />
              </Field>
              <Field label="Anything worth remembering" id="note"
                hint="Best time to visit, who to ask for, a difficulty to keep in mind.">
                <TextField id="note" value={d.note} onChange={v => set('note', v)} placeholder="Optional" />
              </Field>
            </div>
          )}
        </Card>

        <p className="text-[11.5px] text-ink-3 px-1 leading-relaxed">
          Saved on this phone and queued for the next sync. Demonstration data only — no real person's
          health information is collected here.
        </p>
      </main>

      <div className="sticky bottom-0 px-4 py-3 bg-paper/94 backdrop-blur border-t border-line safe-bot">
        <Btn full disabled={!ready || busy} onClick={save}>
          {busy ? 'Saving…'
            : next === 'person' ? 'Save and add a person'
            : named.length ? `Save family and ${named.length} ${named.length === 1 ? 'person' : 'people'}`
            : 'Save this family'}
        </Btn>
      </div>
    </>
  )
}
