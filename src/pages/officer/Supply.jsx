import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildBlock, dispatchToDevice, units } from '../../engine/officer'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, Btn, Pill, Notice, SimBadge, Empty, Stat } from '../../components/ui'

/* The block store.
 *
 * One of these requests is not a request at all — it is read from the live
 * worker's drug kit in the local database. Dispatching it writes the stock
 * back to her kit and leaves a line in her own medicine log, so an officer
 * sending IFA tablets here changes what her phone shows on the Med Kit screen.
 * That loop is the point: a dashboard that only counts is a report, and a
 * report does not get tablets to a woman who has none. */

const LABEL = { late: 'Urgent', due: 'Soon', info: 'Routine' }

export default function Supply() {
  const nav = useNavigate()
  const [b, setB] = useState(null)
  const [sent, setSent] = useState({})
  const [toast, setToast] = useState(null)

  const load = useCallback(() => { buildBlock().then(setB) }, [])
  useEffect(() => { load() }, [load])

  if (!b) return <div className="p-6 text-ink-3">Reading the store…</div>

  const open = b.requests.filter(r => !sent[r.id])
  const urgent = open.filter(r => r.urgency === 'late').length

  const send = async r => {
    if (r.fromDevice && r.medicineId) await dispatchToDevice({ medicineId: r.medicineId, qty: r.qty })
    setSent(s => ({ ...s, [r.id]: true }))
    const u = units(r.qty, r.unit)
    setToast(r.fromDevice
      ? `${r.qty} ${u} of ${r.item} went to ${r.asha?.name}'s kit on her phone`
      : `${r.qty} ${u} of ${r.item} marked out to ${r.asha?.name}`)
    setTimeout(() => setToast(null), 3200)
    if (r.fromDevice) setTimeout(load, 300)
  }

  return (
    <>
      <TopBar title="Block store" sub="Supplies the sub-centres are waiting for"
        back onBack={() => nav('/officer')} />

      <main className="flex-1 px-4 py-4 space-y-5 pb-8">
        <SimBadge>Simulated dispatch — no real store or supply chain is connected</SimBadge>

        <div className="grid grid-cols-2 gap-3">
          <Stat value={open.length} label="Requests waiting" tone={open.length ? 'due' : 'brand'} />
          <Stat value={urgent} label="Urgent" tone={urgent ? 'late' : 'ink'}
            sub="out of stock, or a woman is going without" />
        </div>

        {open.length === 0 && (
          <Empty icon="✓" title="Nothing waiting"
            sub="Every sub-centre has what it asked for." />
        )}

        <div className="space-y-2.5">
          {open.map(r => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className={`sink w-11 h-11 shrink-0 rounded-xl grid place-items-center
                  ${r.urgency === 'late' ? 'text-late' : r.urgency === 'due' ? 'text-due' : 'text-ink-2'}`}>
                  <Icon name="firstaid" size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[15.5px] leading-tight">{r.item}</div>
                  <div className="text-[13px] font-semibold num text-ink-2 mt-0.5">
                    {r.qty} {units(r.qty, r.unit)}
                  </div>
                  <button onClick={() => nav(`/officer/asha/${r.ashaId}`)}
                    className="press text-[12.5px] text-brand font-semibold mt-1.5 text-left">
                    {r.asha?.name} · {r.asha?.subcentre}
                  </button>
                  <p className="text-[12.5px] text-ink-2 mt-1.5 leading-relaxed">{r.why}</p>
                  <div className="text-[11.5px] text-ink-3 mt-1.5 num">
                    Waiting {r.waiting} {r.waiting === 1 ? 'day' : 'days'}
                    {r.fromDevice && ' · read from her phone just now'}
                  </div>
                </div>
                <Pill level={r.urgency}>{LABEL[r.urgency]}</Pill>
              </div>
              <Btn full size="md" className="mt-3" onClick={() => send(r)}>
                <Icon name="bag" size={17} /> Send {r.qty} {units(r.qty, r.unit)}
              </Btn>
            </Card>
          ))}
        </div>

        {Object.keys(sent).length > 0 && (
          <Section title={`Sent today · ${Object.keys(sent).length}`}>
            <Card className="p-4 space-y-2">
              {b.requests.filter(r => sent[r.id]).map(r => (
                <div key={r.id} className="flex items-center gap-2.5">
                  <span className="text-brand shrink-0"><Icon name="check" size={16} stroke={2.4} /></span>
                  <span className="text-[13px] flex-1 leading-snug">
                    {r.qty} {units(r.qty, r.unit)} of {r.item} → {r.asha?.name}
                  </span>
                </div>
              ))}
            </Card>
          </Section>
        )}

        <Notice tone="brand" title="One of these is real">
          {b.requests.some(r => r.fromDevice)
            ? 'The requests marked as read from her phone come out of the live worker’s own drug kit in this browser. Send one and open the worker app’s Med Kit screen: the stock is there, with a line in her log saying the block store sent it.'
            : 'When the live worker’s kit falls to its minimum, the shortage appears here on its own — she does not have to file anything.'}
        </Notice>
      </main>

      {toast && (
        <div className="fixed left-4 right-4 bottom-6 z-50 anim-up">
          <div className="btn-solid rounded-2xl px-4 py-3.5 text-white text-[13.5px] font-semibold text-center leading-snug">
            {toast}
          </div>
        </div>
      )}
    </>
  )
}
