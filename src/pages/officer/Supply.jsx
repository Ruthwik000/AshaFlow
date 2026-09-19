import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildBlock, dispatchToDevice, units, getDepotBatches } from '../../engine/officer'
import Icon from '../../components/Icon'
import OfficerBar from '../../components/OfficerBar'
import { Card, Section, Btn, Pill, Notice, SimBadge, Empty, Stat } from '../../components/ui'

/* The block store & DVDMS Depot Fulfillment.
 *
 * Connected to state Drug & Vaccine Distribution Management System (DVDMS / e-Aushadhi).
 * Features:
 * - Strict FEFO (First-Expired, First-Out) batch allocation.
 * - Automatic expiry guards: expired depot batches are strictly blocked from dispatch.
 * - One-tap kit approval directly writing stock into the worker's device and logging it.
 */

const LABEL = { late: 'Urgent', due: 'Soon', info: 'Routine' }

export default function Supply() {
  const nav = useNavigate()
  const [b, setB] = useState(null)
  const [sent, setSent] = useState({})
  const [selectedBatches, setSelectedBatches] = useState({})
  const [toast, setToast] = useState(null)

  const load = useCallback(() => { buildBlock().then(setB) }, [])
  useEffect(() => { load() }, [load])

  if (!b) return <div className="p-6 text-ink-3">Reading the DVDMS store…</div>

  const open = b.requests.filter(r => !sent[r.id])
  const urgent = open.filter(r => r.urgency === 'late').length

  const getBatchForRequest = r => {
    if (selectedBatches[r.id]) return selectedBatches[r.id]
    const batches = getDepotBatches(r.item).filter(bt => !bt.blocked)
    return batches[0] || { batchNo: 'AUTO-FEFO-01', exp: '2027-12-31', daysLeft: 460 }
  }

  const send = async r => {
    const batch = getBatchForRequest(r)
    if (batch.blocked) {
      setToast(`Blocked: Batch ${batch.batchNo} is expired. Cannot dispatch!`)
      setTimeout(() => setToast(null), 3000)
      return
    }

    if (r.fromDevice && r.medicineId) {
      await dispatchToDevice({ medicineId: r.medicineId, qty: r.qty, batchNo: batch.batchNo })
    }
    setSent(s => ({ ...s, [r.id]: { ...r, batchNo: batch.batchNo, voucherNo: `GP-${Math.floor(1000 + Math.random() * 9000)}` } }))
    const u = units(r.qty, r.unit)
    setToast(r.fromDevice
      ? `✓ Approved: ${r.qty} ${u} of ${r.item} (Batch ${batch.batchNo}) sent to ${r.asha?.name}'s phone`
      : `✓ DVDMS Voucher Generated: ${r.qty} ${u} of ${r.item} (Batch ${batch.batchNo}) → ${r.asha?.name}`)
    setTimeout(() => setToast(null), 3500)
    if (r.fromDevice) setTimeout(load, 300)
  }

  return (
    <>
      <OfficerBar title="Depot & Supply Store" sub="DVDMS / e-Aushadhi Fulfillment Hub"
        back onBack={() => nav('/officer')} />

      <main className="flex-1 px-4 py-4 space-y-5 pb-8">
        {/* DVDMS State Depot Header Badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-[12px] font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span><b>DVDMS Depot:</b> Barabanki Central PHC Store Connected</span>
          </div>
          <button
            onClick={() => nav('/officer/heatmap')}
            className="press px-2.5 py-1 rounded-lg bg-white border border-sky-300 text-brand font-bold text-[11.5px] shrink-0">
            Stockout Heatmap ›
          </button>
        </div>

        {/* Bento Stat Tiles */}
        <div className="grid grid-cols-2 gap-3">
          <Stat value={open.length} label="Kit Requests" tone={open.length ? 'due' : 'brand'}
            sub="sub-centre indents waiting" />
          <Stat value={urgent} label="Urgent Shortages" tone={urgent ? 'late' : 'ink'}
            sub="out of stock in village" />
        </div>

        {/* Action link to Village Stockout Heatmap */}
        <Card className="p-4 bg-gradient-to-r from-red-50/70 to-amber-50/70 border border-amber-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-late">Seasonal Stockout Radar</div>
              <div className="text-[15px] font-bold text-ink mt-0.5">Village Drug Stockout Heatmap</div>
              <div className="text-[12.5px] text-ink-2 mt-1">
                Monsoon vector surge active. Kishanpur &amp; Sohagpur have critical shortages of Chloroquine &amp; ORS.
              </div>
            </div>
            <Btn size="sm" onClick={() => nav('/officer/heatmap')} className="shrink-0">
              View Heatmap
            </Btn>
          </div>
        </Card>

        {open.length === 0 && (
          <Empty icon="✓" title="All Sub-Centres Supplied"
            sub="Every ASHA worker has required medicine stock." />
        )}

        {/* List of Waiting Indents with FEFO Batch Selector */}
        <Section title={`Pending Re-supply Requests · ${open.length}`}>
          <div className="space-y-3">
            {open.map(r => {
              const batches = getDepotBatches(r.item)
              const currentBatch = getBatchForRequest(r)

              return (
                <Card key={r.id} className="p-4 relative">
                  <div className="flex items-start gap-3">
                    <span className={`sink w-11 h-11 shrink-0 rounded-xl grid place-items-center
                      ${r.urgency === 'late' ? 'text-late' : r.urgency === 'due' ? 'text-due' : 'text-ink-2'}`}>
                      <Icon name="firstaid" size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <div className="font-bold text-[16px] leading-tight text-ink">{r.item}</div>
                        <Pill level={r.urgency}>{LABEL[r.urgency]}</Pill>
                      </div>

                      <div className="text-[13.5px] font-bold num text-brand mt-0.5">
                        Indent: {r.qty} {units(r.qty, r.unit)}
                      </div>

                      <button onClick={() => nav(`/officer/asha/${r.ashaId}`)}
                        className="press text-[12.5px] text-ink font-semibold mt-1 text-left block">
                        {r.asha?.name} · <span className="text-ink-3">{r.asha?.subcentre} ({r.asha?.village})</span>
                      </button>

                      <p className="text-[12.5px] text-ink-2 mt-1 leading-snug">{r.why}</p>

                      <div className="text-[11.5px] text-ink-3 mt-1.5 num">
                        Waiting {r.waiting} {r.waiting === 1 ? 'day' : 'days'}
                        {r.fromDevice && <span className="text-brand font-semibold"> · Live phone link</span>}
                      </div>

                      {/* Batch Selection with FEFO & Expiry Tracking */}
                      <div className="mt-3 pt-2.5 border-t border-line-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[11.5px] font-semibold text-ink-3">
                          <span>Depot Batch (FEFO Rule):</span>
                          <span className="text-brand font-bold">First Expired, First Out</span>
                        </div>

                        <div className="space-y-1.5">
                          {batches.map(bt => {
                            const isSelected = currentBatch.batchNo === bt.batchNo
                            return (
                              <div
                                key={bt.batchNo}
                                onClick={() => !bt.blocked && setSelectedBatches(s => ({ ...s, [r.id]: bt }))}
                                className={`p-2.5 rounded-xl border text-[12px] flex items-center justify-between cursor-pointer transition ${
                                  bt.blocked
                                    ? 'bg-red-50/50 border-red-200 text-red-700 opacity-60 cursor-not-allowed line-through'
                                    : isSelected
                                    ? 'bg-brand-soft/40 border-brand text-brand font-bold ring-1 ring-brand'
                                    : 'bg-paper/80 border-line text-ink-2'
                                }`}>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span>{bt.batchNo}</span>
                                    {bt.fefoRank === 0 && !bt.blocked && (
                                      <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                                        Near-Expiry (FEFO)
                                      </span>
                                    )}
                                    {bt.blocked && (
                                      <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.2 rounded font-bold not-line-through">
                                        🚫 EXPIRED
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10.5px] text-ink-3 mt-0.5 not-line-through">
                                    Mfg: {bt.mfg} · Stock: {bt.qty} in store
                                  </div>
                                </div>
                                <div className="text-right num not-line-through">
                                  <div>Exp: {bt.exp}</div>
                                  <div className={`text-[10.5px] ${bt.daysLeft < 0 ? 'text-late' : bt.daysLeft < 90 ? 'text-due' : 'text-ink-3'}`}>
                                    {bt.daysLeft < 0 ? 'Expired' : `${bt.daysLeft}d left`}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* One-Tap Dispatch Button */}
                      <Btn
                        full
                        size="md"
                        className="mt-3.5"
                        onClick={() => send(r)}>
                        <Icon name="check" size={17} /> One-Tap Approve &amp; Dispatch ({currentBatch.batchNo})
                      </Btn>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </Section>

        {/* Dispatched Today Section */}
        {Object.keys(sent).length > 0 && (
          <Section title={`Approved & Dispatched Today · ${Object.keys(sent).length}`}>
            <Card className="p-4 space-y-2.5">
              {Object.values(sent).map(item => (
                <div key={item.id} className="p-2.5 rounded-xl sink flex items-center justify-between text-[12.5px]">
                  <div>
                    <div className="font-bold text-ink">
                      {item.qty} {units(item.qty, item.unit)} of {item.item}
                    </div>
                    <div className="text-[11px] text-ink-3 mt-0.5">
                      → {item.asha?.name} ({item.asha?.village}) · Batch: <b>{item.batchNo}</b>
                    </div>
                  </div>
                  <div className="text-right">
                    <Pill level="done">Dispatched</Pill>
                    <div className="text-[10.5px] text-ink-3 num mt-0.5">{item.voucherNo}</div>
                  </div>
                </div>
              ))}
            </Card>
          </Section>
        )}

        <Notice tone="brand" title="End-to-End Live Drug Sync">
          {b.requests.some(r => r.fromDevice)
            ? "When you approve a live worker's request, her medicine inventory on her physical phone updates immediately with the allocated batch number and enters her dispensary audit log."
            : 'ASHA drug shortages automatically trigger indents without tedious manual paperwork.'}
        </Notice>
      </main>

      {toast && (
        <div className="fixed left-4 right-4 bottom-6 z-50 anim-up">
          <div className="btn-solid rounded-2xl px-4 py-3.5 text-white text-[13.5px] font-semibold text-center leading-snug shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </>
  )
}
