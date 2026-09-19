import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db } from '../../db/db'
import { AppBar, Card, Section, Btn, Notice, Pill, TopBar } from '../../components/ui'
import Icon from '../../components/Icon'

/* ── colour thresholds ────────────────────────────────────────────── */
const level = (qty, min) =>
  qty === 0 ? 'out' : qty <= min ? 'low' : qty <= min * 2 ? 'ok' : 'full'

const LEVEL_STYLE = {
  out:  { bg: 'bg-red-50',    ring: 'ring-red-200',    text: 'text-red-600',    pill: 'late',  label: 'Out of stock' },
  low:  { bg: 'bg-amber-50',  ring: 'ring-amber-200',  text: 'text-amber-600',  pill: 'due',   label: 'Low stock' },
  ok:   { bg: 'bg-emerald-50', ring: 'ring-emerald-200', text: 'text-emerald-600', pill: 'done', label: 'In stock' },
  full: { bg: 'bg-sky-50',    ring: 'ring-sky-200',    text: 'text-sky-600',    pill: 'info',  label: 'Well stocked' },
}

/* ── Dispense modal ───────────────────────────────────────────────── */
function DispenseSheet({ item, initialTo = '', onClose, onDispense }) {
  const [qty, setQty] = useState(1)
  const [to, setTo] = useState(initialTo || item?.defaultTo || '')
  const [note, setNote] = useState('')
  useEffect(() => {
    if (initialTo || item?.defaultTo) {
      setTo(initialTo || item?.defaultTo || '')
    }
  }, [initialTo, item?.defaultTo])
  if (!item) return null

  const max = item.qty
  const submit = () => {
    if (qty < 1 || qty > max) return
    onDispense({ id: item.id, qty, to: to.trim(), note: note.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[420px] bg-paper rounded-t-3xl p-5 pb-8 space-y-4 animate-slide-up safe-bot">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-bold">Dispense {item.name}</h3>
          <button onClick={onClose} className="press w-9 h-9 grid place-items-center rounded-xl text-ink-3">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="text-[13px] text-ink-3">
          Available: <span className="font-bold text-ink num">{max} {item.unit}</span>
        </div>

        <label className="block">
          <span className="text-[13px] font-semibold text-ink-2">Quantity</span>
          <div className="flex items-center gap-2 mt-1.5">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}
              className="press w-10 h-10 rounded-xl bg-line grid place-items-center text-[20px] font-bold">−</button>
            <input type="number" min={1} max={max} value={qty}
              onChange={e => setQty(Math.min(max, Math.max(1, Number(e.target.value))))}
              className="w-16 h-10 rounded-xl bg-surface border border-line text-center text-[16px] font-bold num" />
            <button onClick={() => setQty(q => Math.min(max, q + 1))}
              className="press w-10 h-10 rounded-xl bg-line grid place-items-center text-[20px] font-bold">+</button>
            <span className="text-[13px] text-ink-3 ml-1">{item.unit}</span>
          </div>
        </label>

        <label className="block">
          <span className="text-[13px] font-semibold text-ink-2">Given to (optional)</span>
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="Beneficiary name"
            className="mt-1.5 w-full h-10 rounded-xl bg-surface border border-line px-3 text-[14px]" />
        </label>

        <label className="block">
          <span className="text-[13px] font-semibold text-ink-2">Note (optional)</span>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. ANC visit, HBNC day 3"
            className="mt-1.5 w-full h-10 rounded-xl bg-surface border border-line px-3 text-[14px]" />
        </label>

        <Btn full disabled={qty < 1 || qty > max} onClick={submit}>
          <Icon name="pill" size={18} /> Dispense {qty} {item.unit}
        </Btn>
      </div>
    </div>
  )
}

/* ── Restock modal ────────────────────────────────────────────────── */
function RestockSheet({ item, onClose, onRestock }) {
  const [qty, setQty] = useState(10)
  if (!item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[420px] bg-paper rounded-t-3xl p-5 pb-8 space-y-4 animate-slide-up safe-bot">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-bold">Restock {item.name}</h3>
          <button onClick={onClose} className="press w-9 h-9 grid place-items-center rounded-xl text-ink-3">
            <Icon name="close" size={18} />
          </button>
        </div>
        <label className="block">
          <span className="text-[13px] font-semibold text-ink-2">Quantity received</span>
          <div className="flex items-center gap-2 mt-1.5">
            <button onClick={() => setQty(q => Math.max(1, q - 5))}
              className="press w-10 h-10 rounded-xl bg-line grid place-items-center text-[20px] font-bold">−</button>
            <input type="number" min={1} value={qty}
              onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              className="w-16 h-10 rounded-xl bg-surface border border-line text-center text-[16px] font-bold num" />
            <button onClick={() => setQty(q => q + 5)}
              className="press w-10 h-10 rounded-xl bg-line grid place-items-center text-[20px] font-bold">+</button>
            <span className="text-[13px] text-ink-3 ml-1">{item.unit}</span>
          </div>
        </label>
        <Btn full onClick={() => onRestock({ id: item.id, qty })}>
          <Icon name="plus" size={18} /> Add {qty} {item.unit} to stock
        </Btn>
      </div>
    </div>
  )
}

/* ── History log ──────────────────────────────────────────────────── */
function LogSection({ logs }) {
  if (!logs.length) return null
  return (
    <Section title="Recent activity">
      <div className="bg-surface border border-line rounded-2xl divide-y divide-line-2">
        {logs.slice(0, 15).map((l, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <span className={`mt-0.5 shrink-0 w-7 h-7 rounded-lg grid place-items-center text-[12px] font-bold
              ${l.type === 'dispense' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {l.type === 'dispense' ? '−' : '+'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold leading-tight">{l.medicineName}</div>
              <div className="text-[12px] text-ink-3 mt-0.5">
                {l.qty} {l.unit} · {l.type === 'dispense' ? 'given' : 'restocked'}
                {l.to ? ` to ${l.to}` : ''}
                {l.note ? ` · ${l.note}` : ''}
              </div>
            </div>
            <div className="text-[11px] text-ink-3 shrink-0 num">
              {new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ── Main component ───────────────────────────────────────────────── */
export default function MedicineKit() {
  const [searchParams] = useSearchParams()
  const toParam = searchParams.get('to')
  const medParam = searchParams.get('med')
  const [items, setItems] = useState([])
  const [logs, setLogs] = useState([])
  const [dispenseItem, setDispenseItem] = useState(null)
  const [restockItem, setRestockItem] = useState(null)
  const [toast, setToast] = useState(null)

  const load = useCallback(async () => {
    const kit = await db.medicineKit.toArray()
    setItems(kit.sort((a, b) => {
      // out-of-stock first, then low, then rest
      const la = level(a.qty, a.minQty), lb = level(b.qty, b.minQty)
      const order = { out: 0, low: 1, ok: 2, full: 3 }
      return (order[la] ?? 4) - (order[lb] ?? 4)
    }))
    const history = await db.medicineLog.toArray()
    setLogs(history.sort((a, b) => b.date.localeCompare(a.date)))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (items.length && (toParam || medParam)) {
      const match = medParam ? items.find(i => i.id === medParam) : (items.find(i => i.id === 'med1') || items[0])
      if (match && !dispenseItem) {
        setDispenseItem({ ...match, defaultTo: toParam || '' })
      }
    }
  }, [items, toParam, medParam])

  const flash = msg => { setToast(msg); setTimeout(() => setToast(null), 2200) }

  const handleDispense = async ({ id, qty, to, note }) => {
    const item = await db.medicineKit.get(id)
    if (!item || item.qty < qty) return flash('Not enough stock!')
    await db.medicineKit.update(id, { qty: item.qty - qty, lastUsed: new Date().toISOString() })
    await db.medicineLog.add({
      medicineId: id, medicineName: item.name, type: 'dispense',
      qty, unit: item.unit, to, note, date: new Date().toISOString(),
    })
    setDispenseItem(null)
    flash(`Dispensed ${qty} ${item.unit} of ${item.name}`)
    load()
  }

  const handleRestock = async ({ id, qty }) => {
    const item = await db.medicineKit.get(id)
    if (!item) return
    await db.medicineKit.update(id, { qty: item.qty + qty, lastRestocked: new Date().toISOString() })
    await db.medicineLog.add({
      medicineId: id, medicineName: item.name, type: 'restock',
      qty, unit: item.unit, to: '', note: '', date: new Date().toISOString(),
    })
    setRestockItem(null)
    flash(`Restocked ${qty} ${item.unit} of ${item.name}`)
    load()
  }

  const outCount = items.filter(i => i.qty === 0).length
  const lowCount = items.filter(i => i.qty > 0 && i.qty <= i.minQty).length
  const totalItems = items.length
  const totalStock = items.reduce((n, i) => n + i.qty, 0)

  return (
    <>
      <AppBar title="Medicine kit" sub="Village inventory" />
      <main className="flex-1 px-4 py-4 space-y-6">

        {/* ─── Summary cards ─── */}
        <div className="raise rounded-2xl p-1">
          <div className="grid grid-cols-3 divide-x divide-line-2">
            {[[totalItems, 'items', 'text-ink'],
              [lowCount, 'low stock', lowCount ? 'text-amber-500' : 'text-ink-3'],
              [outCount, 'out of stock', outCount ? 'text-red-500' : 'text-ink-3']].map(([v, l, c]) => (
              <div key={l} className="px-2 py-3 text-center">
                <div className={`text-[26px] font-bold num leading-none tracking-[-0.02em] ${c}`}>{v}</div>
                <div className="text-[11.5px] text-ink-3 mt-1.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Alerts ─── */}
        {outCount > 0 && (
          <Notice tone="late" title={`${outCount} medicine${outCount > 1 ? 's' : ''} out of stock`}>
            Request resupply from the PHC immediately. Scroll down to see which items need restocking.
          </Notice>
        )}
        {lowCount > 0 && outCount === 0 && (
          <Notice tone="due" title={`${lowCount} medicine${lowCount > 1 ? 's' : ''} running low`}>
            Stock will run out soon. Plan a resupply on your next PHC visit.
          </Notice>
        )}

        {/* ─── Medicine list ─── */}
        <Section title={`Inventory (${totalStock} units total)`}>
          <div className="space-y-2.5">
            {items.map(item => {
              const lv = level(item.qty, item.minQty)
              const s = LEVEL_STYLE[lv]
              const pct = Math.min(100, (item.qty / (item.minQty * 3)) * 100)
              return (
                <div key={item.id} className={`${s.bg} ring-1 ${s.ring} rounded-2xl p-4 transition-all`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 w-9 h-9 shrink-0 rounded-xl grid place-items-center ${s.bg} ${s.text}`}>
                      <Icon name={item.icon || 'pill'} size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold leading-tight">{item.name}</span>
                        <Pill level={s.pill}>{s.label}</Pill>
                      </div>
                      <div className="text-[12px] text-ink-3 mt-0.5">{item.category}</div>

                      {/* bar */}
                      <div className="mt-2.5 h-2 rounded-full bg-white/60 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500
                          ${lv === 'out' ? 'bg-red-400' : lv === 'low' ? 'bg-amber-400' : lv === 'ok' ? 'bg-emerald-400' : 'bg-sky-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`text-[20px] font-bold num ${s.text}`}>{item.qty}</span>
                        <span className="text-[11px] text-ink-3">min {item.minQty} {item.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setDispenseItem(item)} disabled={item.qty === 0}
                      className="press flex-1 h-9 rounded-xl bg-white/70 border border-white text-[13px] font-semibold
                        disabled:opacity-40 flex items-center justify-center gap-1.5">
                      <Icon name="walk" size={14} /> Give
                    </button>
                    <button onClick={() => setRestockItem(item)}
                      className="press flex-1 h-9 rounded-xl bg-white/70 border border-white text-[13px] font-semibold
                        flex items-center justify-center gap-1.5">
                      <Icon name="plus" size={14} /> Restock
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        <LogSection logs={logs} />

        <p className="text-[11.5px] text-ink-3 leading-relaxed px-1 pb-4">
          Demo data. Actual kit contents follow your PHC's standard drug list.
        </p>
      </main>

      {/* ─── Sheets ─── */}
      <DispenseSheet
        item={dispenseItem}
        initialTo={dispenseItem?.defaultTo || toParam || ''}
        onClose={() => setDispenseItem(null)}
        onDispense={handleDispense}
      />
      <RestockSheet item={restockItem} onClose={() => setRestockItem(null)} onRestock={handleRestock} />

      {/* ─── Toast ─── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50
          bg-ink text-white text-[14px] font-semibold px-5 py-3 rounded-2xl shadow-lg
          animate-slide-up">
          {toast}
        </div>
      )}
    </>
  )
}
