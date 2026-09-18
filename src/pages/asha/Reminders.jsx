import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { REMINDERS } from '../../data/seed'
import { TopBar, Card, Section, List, Toggle, Btn, Notice } from '../../components/ui'
import Icon from '../../components/Icon'

const ICON = { repeat: 'repeat', visit: 'pin', money: 'rupee', sync: 'sync' }

export default function Reminders() {
  const nav = useNavigate()
  const [items, setItems] = useState(REMINDERS)
  const toggle = id => setItems(r => r.map(x => x.id === id ? { ...x, on: !x.on } : x))
  const on = items.filter(i => i.on).length

  return (
    <>
      <TopBar title="Reminders" sub={`${on} of ${items.length} on`} back onBack={() => nav('/asha')} />
      <main className="flex-1 px-4 py-4 space-y-5 pb-8">
        <Section title="Your reminders">
          <List>
            {items.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="raise-sm w-9 h-9 shrink-0 rounded-xl grid place-items-center text-brand text-[15px]">
                  <Icon name={ICON[r.kind] || 'bell'} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold text-[14.5px] leading-tight ${r.on ? '' : 'text-ink-3'}`}>{r.title}</div>
                  <div className="text-[12.5px] text-ink-3 mt-0.5 num">{r.when}</div>
                </div>
                <Toggle on={r.on} onClick={() => toggle(r.id)} label={r.title} />
              </div>
            ))}
          </List>
        </Section>

        <Btn full tone="ghost" size="md">＋ Add a reminder</Btn>

        <Notice tone="info" title="These work offline">
          Reminders are scheduled on the phone, so they still fire in a village with no signal.
          Visit reminders are created automatically from what the schedules say is due.
        </Notice>
      </main>
    </>
  )
}
