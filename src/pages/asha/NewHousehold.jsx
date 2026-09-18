import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createHousehold } from '../../db/db'
import Icon from '../../components/Icon'
import { TopBar, Card, Btn, Field, TextField, Chips, Notice } from '../../components/ui'

const VILLAGES = [{ v: 'Rampur', l: 'Rampur' }, { v: 'Kishanpur', l: 'Kishanpur' },
                  { v: 'Bela', l: 'Bela' }, { v: 'Sohagpur', l: 'Sohagpur' }]
const WATER = [{ v: 'tap', l: 'Tap' }, { v: 'handpump', l: 'Hand pump' },
               { v: 'well', l: 'Well' }, { v: 'other', l: 'Other' }]
const YESNO = [{ v: true, l: 'Yes' }, { v: false, l: 'No' }]

export default function NewHousehold() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const next = sp.get('next')            // 'person' → go straight on to adding someone
  const form = sp.get('form')            // carry a scheme form through the whole chain

  const [d, setD] = useState({ houseNo: '', headName: '', village: 'Rampur',
                               membersCount: '', bplCard: null, hasToilet: null, waterSource: '' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setD(x => ({ ...x, [k]: v }))
  const ready = d.houseNo.trim() && d.headName.trim() && d.village

  const save = async () => {
    setBusy(true)
    const h = await createHousehold({ ...d, membersCount: Number(d.membersCount) || 1 })
    if (next === 'person') {
      nav(`/asha/people/new?household=${h.id}${form ? `&form=${form}` : ''}`, { replace: true })
    } else {
      nav(`/asha/family/${h.id}`, { replace: true })
    }
  }

  return (
    <>
      <TopBar title="Add a family" sub="A household not yet on your list" back />
      <main className="flex-1 px-4 py-4 space-y-4 pb-32">
        <Notice tone="brand" title="Only the basics">
          Everything you enter here is stored once and reused by every form and every visit for this
          household afterwards.
        </Notice>

        <Card className="p-4 space-y-4">
          <Field label="House number" required id="hno">
            <TextField id="hno" value={d.houseNo} onChange={v => set('houseNo', v)} placeholder="e.g. 47" />
          </Field>
          <Field label="Head of the family" required id="head">
            <TextField id="head" value={d.headName} onChange={v => set('headName', v)} placeholder="Full name" />
          </Field>
          <Field label="Village" required>
            <Chips value={d.village} onChange={v => set('village', v)} options={VILLAGES} cols={2} />
          </Field>
          <Field label="How many people live here?" id="cnt">
            <TextField id="cnt" type="number" value={d.membersCount}
              onChange={v => set('membersCount', v)} placeholder="e.g. 5" />
          </Field>
        </Card>

        <Card className="p-4 space-y-4">
          <Field label="BPL card">
            <Chips value={d.bplCard} onChange={v => set('bplCard', v)} options={YESNO} cols={2} />
          </Field>
          <Field label="Toilet in the house">
            <Chips value={d.hasToilet} onChange={v => set('hasToilet', v)} options={YESNO} cols={2} />
          </Field>
          <Field label="Drinking water source">
            <Chips value={d.waterSource} onChange={v => set('waterSource', v)} options={WATER} cols={2} />
          </Field>
        </Card>
      </main>

      <div className="sticky bottom-0 px-4 py-3 bg-paper/94 backdrop-blur border-t border-line safe-bot">
        <Btn full disabled={!ready || busy} onClick={save}>
          {busy ? 'Saving…' : next === 'person' ? 'Save and add a person' : 'Save this family'}
        </Btn>
      </div>
    </>
  )
}
