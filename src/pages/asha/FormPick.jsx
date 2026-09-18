import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { findForm } from '../../data/formRegistry'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, List, Row, Notice, Empty } from '../../components/ui'

const FITS = {
  pregnant: m => m.role === 'pregnant',
  mother:   m => m.role === 'mother' || m.role === 'infant',
  any:      () => true,
}

export default function FormPick() {
  const { code } = useParams()
  const nav = useNavigate()
  const [form, setForm] = useState(undefined)
  const [rows, setRows] = useState([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => { findForm(code).then(setForm) }, [code])

  useEffect(() => {
    Promise.all([db.households.toArray(), db.members.toArray()]).then(([hs, ms]) =>
      setRows(ms.map(m => ({ ...m, household: hs.find(h => h.id === m.householdId) })))
    )
  }, [])

  if (form === undefined) return <div className="p-6 text-ink-3">Loading…</div>
  if (!form) return <div className="p-6 text-ink-3">Form not found</div>

  const fit = FITS[form.appliesTo] || FITS.any
  const suggested = rows.filter(fit)
  const others = rows.filter(m => !fit(m))
  const list = showAll ? [...suggested, ...others] : suggested

  return (
    <>
      <TopBar title="Who is this for?" sub={form.name} back onBack={() => nav('/asha/forms')} />

      <main className="flex-1 px-4 py-4 space-y-4 pb-8">
        <Notice tone="info" title={form.name}>{form.about}</Notice>

        <Section title={showAll ? 'Everyone' : `Suggested · ${suggested.length}`}>
          {list.length === 0 && <Empty title="Nobody matches" sub="Try showing everyone." />}
          <List>
            {list.map(m => (
              <Row key={m.id}
                icon={<Icon name={m.role === 'infant' ? 'baby' : 'user'} size={19} />}
                title={m.name}
                sub={`${m.age === 0 ? 'infant' : `${m.age} years`} · ${m.role} · House ${m.household?.houseNo}, ${m.household?.village}`}
                onClick={() => nav(`/asha/forms/${code}/fill/${m.id}`)} />
            ))}
          </List>
        </Section>

        {others.length > 0 && (
          <button onClick={() => setShowAll(v => !v)}
            className="press w-full text-[13px] font-semibold text-brand py-2">
            {showAll ? 'Show only suggested' : `Show everyone (${others.length} more)`}
          </button>
        )}

        <Section title="Not on the list">
          <button onClick={() => nav(`/asha/people/new?form=${code}`)}
            className="press raise w-full text-left rounded-2xl p-4 flex items-start gap-3.5">
            <span className="btn-solid w-11 h-11 shrink-0 rounded-xl grid place-items-center text-white">
              <Icon name="plus" size={20} stroke={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[15.5px] leading-tight">Someone not registered yet</div>
              <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed">
                Add her first, then the form opens. Nothing is on record yet, so it will ask you for
                every field — and keep all of it for next time.
              </p>
            </div>
            <span className="text-ink-3 shrink-0 mt-2"><Icon name="chevron" size={17} /></span>
          </button>
        </Section>
      </main>
    </>
  )
}
