import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db, createMember } from '../../db/db'
import { formByCode } from '../../data/schemeForms'
import Icon from '../../components/Icon'
import { TopBar, Card, Btn, Field, TextField, Chips, Notice, List, Row } from '../../components/ui'

const ROLES = [
  { v: 'pregnant', l: 'Pregnant' }, { v: 'mother', l: 'Mother' },
  { v: 'infant', l: 'Infant' }, { v: 'child', l: 'Child' },
  { v: 'adult', l: 'Adult' }, { v: 'elder', l: 'Elder' },
]
const SEX = [{ v: 'F', l: 'Female' }, { v: 'M', l: 'Male' }]
const CASTE = [{ v: 'SC', l: 'SC' }, { v: 'ST', l: 'ST' }, { v: 'OBC', l: 'OBC' }, { v: 'GEN', l: 'General' }]

export default function NewPerson() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const formCode = sp.get('form')
  const form = formCode ? formByCode[formCode] : null
  const preHousehold = sp.get('household')

  const [households, setHouseholds] = useState([])
  const [householdId, setHouseholdId] = useState(preHousehold || '')
  const [d, setD] = useState({ name: '', age: '', sex: 'F', role: 'pregnant',
                               husbandName: '', mobile: '', caste: '', lmp: '', dob: '' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setD(x => ({ ...x, [k]: v }))

  useEffect(() => { db.households.toArray().then(setHouseholds) }, [])

  const ready = householdId && d.name.trim() && d.age && d.role
  const isBaby = d.role === 'infant' || d.role === 'child'

  const save = async () => {
    setBusy(true)
    const m = await createMember({ ...d, householdId })
    if (formCode) nav(`/asha/forms/${formCode}/fill/${m.id}`, { replace: true })
    else nav(`/asha/family/${householdId}`, { replace: true })
  }

  return (
    <>
      <TopBar title="Add a person" sub={form ? `then fill ${form.name}` : 'New member of a household'} back />
      <main className="flex-1 px-4 py-4 space-y-4 pb-32">

        {form && (
          <Notice tone="info" title={`For ${form.name}`}>
            Add her here first. The form opens straight afterwards, and because nothing is on record
            yet it will ask you for everything — all of which is then kept for next time.
          </Notice>
        )}

        <div>
          <div className="text-[14px] font-semibold text-ink-2 mb-2.5 px-0.5">Which household?</div>
          <List>
            {households.map(h => (
              <Row key={h.id}
                icon={<span className={householdId === h.id ? 'text-brand' : 'text-ink-3'}>
                  <Icon name={householdId === h.id ? 'check' : 'home'} size={18}
                    stroke={householdId === h.id ? 2.5 : 1.7} />
                </span>}
                title={`House ${h.houseNo} · ${h.headName}`}
                sub={`${h.village} · ${h.membersCount} members`}
                onClick={() => setHouseholdId(h.id)} />
            ))}
            <Row icon={<Icon name="plus" size={18} />} title="A household not on this list"
              sub="Add the family first, then the person"
              onClick={() => nav(`/asha/families/new?next=person${formCode ? `&form=${formCode}` : ''}`)} />
          </List>
        </div>

        <Card className="p-4 space-y-4">
          <Field label="Name" required id="pname">
            <TextField id="pname" value={d.name} onChange={v => set('name', v)} placeholder="Full name" />
          </Field>
          <Field label="Age in years" required id="page">
            <TextField id="page" type="number" value={d.age} onChange={v => set('age', v)} placeholder="e.g. 24" />
          </Field>
          <Field label="Sex" required>
            <Chips value={d.sex} onChange={v => set('sex', v)} options={SEX} cols={2} />
          </Field>
          <Field label="Who is she to this household?" required>
            <Chips value={d.role} onChange={v => set('role', v)} options={ROLES} cols={3} />
          </Field>
        </Card>

        {d.role === 'pregnant' && (
          <Card className="p-4">
            <Field label="Date of last menstrual period"
              hint="One answer here fills the delivery date, all four ANC dates, the Td schedule and the baby's whole first-year vaccine calendar."
              id="plmp">
              <TextField id="plmp" type="date" value={d.lmp} onChange={v => set('lmp', v)} />
            </Field>
          </Card>
        )}

        {isBaby && (
          <Card className="p-4">
            <Field label="Date of birth" id="pdob">
              <TextField id="pdob" type="date" value={d.dob} onChange={v => set('dob', v)} />
            </Field>
          </Card>
        )}

        <Card className="p-4 space-y-4">
          <Field label={d.sex === 'F' ? "Husband's or father's name" : "Father's name"} id="phus">
            <TextField id="phus" value={d.husbandName} onChange={v => set('husbandName', v)} placeholder="Full name" />
          </Field>
          <Field label="Mobile number" id="pmob">
            <TextField id="pmob" type="number" value={d.mobile} onChange={v => set('mobile', v)} placeholder="10 digits" />
          </Field>
          <Field label="Category">
            <Chips value={d.caste} onChange={v => set('caste', v)} options={CASTE} cols={4} />
          </Field>
        </Card>

        <p className="text-[11.5px] text-ink-3 px-1 leading-relaxed">
          Saved on this phone and queued for the next sync. Everything here becomes part of her
          record, so no form asks for it again.
        </p>
      </main>

      <div className="sticky bottom-0 px-4 py-3 bg-paper/94 backdrop-blur border-t border-line safe-bot">
        <Btn full disabled={!ready || busy} onClick={save}>
          {busy ? 'Saving…' : form ? `Save and open ${form.subtitle || 'the form'}` : 'Save this person'}
        </Btn>
      </div>
    </>
  )
}
