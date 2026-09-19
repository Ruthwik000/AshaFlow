import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { villageStockHeatmap, dispatchToDevice } from '../../engine/officer'
import Icon from '../../components/Icon'
import OfficerBar from '../../components/OfficerBar'
import { Card, Section, Btn, Pill, Notice, Stat } from '../../components/ui'

const FILTERS = [
  { k: 'all', l: 'All Drugs' },
  { k: 'seasonal', l: 'Monsoon & Vectors', keys: ['cq', 'ors'] },
  { k: 'maternal', l: 'Maternal Health', keys: ['ifa', 'ptk'] },
  { k: 'child', l: 'Child & General', keys: ['ors', 'pcm'] },
]

export default function StockoutMap() {
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedCell, setSelectedCell] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    villageStockHeatmap().then(setData)
  }, [])

  if (!data) return <div className="p-6 text-ink-3">Computing village drug stockout heatmap…</div>

  const { drugs, villages, season, criticalCellsCount, warningCellsCount } = data

  const filteredDrugs = activeFilter === 'all'
    ? drugs
    : drugs.filter(d => FILTERS.find(f => f.k === activeFilter)?.keys?.includes(d.id))

  const handleProactiveDispatch = async (village, drug) => {
    // If it's Rampur and has live connection
    if (village.name === 'Rampur' && drug.id === 'ifa') {
      await dispatchToDevice({ medicineId: 'med1', qty: 60 })
    }
    setToast(`✓ Emergency Dispatch Approved: 100 ${drug.unit} of ${drug.name} allocated to ${village.name} (DVDMS Batch IFA-2026-B08)`)
    setSelectedCell(null)
    setTimeout(() => setToast(null), 3800)
    villageStockHeatmap().then(setData)
  }

  return (
    <>
      <OfficerBar
        title="Village Stockout Heatmap"
        sub="Surveillance &amp; Days of Cover"
        back
        onBack={() => nav('/officer')}
      />

      <main className="flex-1 px-4 py-4 space-y-5 pb-12">
        {/* Top Bento Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Stat
            value={criticalCellsCount}
            label="Critical Stockouts"
            tone={criticalCellsCount > 0 ? 'late' : 'brand'}
            sub="under 7 days cover left"
          />
          <Stat
            value={warningCellsCount}
            label="Low Buffer Zones"
            tone="due"
            sub="7 to 14 days cover"
          />
        </div>

        {/* Seasonal Threat Radar Banner */}
        <Card className="p-4 bg-gradient-to-r from-red-50 to-amber-50 border border-red-200">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-red-100 text-red-700 grid place-items-center font-bold text-[18px] shrink-0">
              🦟
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
                {season.name}
              </div>
              <div className="text-[15px] font-bold text-ink mt-0.5">
                Surge Threat: {season.threat}
              </div>
              <div className="text-[12.5px] text-ink-2 mt-1 leading-snug">
                Villages with active shortages (<b className="text-red-700">{season.highRiskVillages.join(', ')}</b>) must receive replenishment before weekly VHND clinics.
              </div>
            </div>
          </div>
        </Card>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map(f => (
            <button
              key={f.k}
              onClick={() => setActiveFilter(f.k)}
              className={`press shrink-0 px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition ${
                activeFilter === f.k ? 'btn-solid text-white' : 'raise text-ink-2'
              }`}>
              {f.l}
            </button>
          ))}
        </div>

        {/* ── The Bento Heatmap Grid ─────────────────────────────────── */}
        <Section title="Days of Medicine Cover by Village">
          <Card className="p-3.5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-line-2 text-ink-3 font-bold uppercase text-[11px]">
                    <th className="text-left py-2 px-2">Critical Drug</th>
                    {villages.map(v => (
                      <th key={v.name} className="py-2 px-1 min-w-[72px]">
                        <div className="text-ink">{v.name}</div>
                        <div className="text-[9.5px] font-normal text-ink-3">
                          {v.population} pop
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {filteredDrugs.map(d => (
                    <tr key={d.id} className="hover:bg-sunken/30 transition">
                      <td className="text-left py-3 px-2">
                        <div className="font-bold text-[13px] text-ink">{d.name}</div>
                        <div className="text-[10.5px] text-ink-3">{d.threat}</div>
                      </td>

                      {villages.map(v => {
                        const cell = v.drugs[d.id]
                        const isCritical = cell.status === 'critical'
                        const isWarning = cell.status === 'warning'

                        return (
                          <td key={v.name} className="py-2 px-1">
                            <button
                              onClick={() => setSelectedCell({ village: v, drug: d, cell })}
                              className={`press w-full py-2 px-1 rounded-xl font-bold num border transition flex flex-col items-center justify-center ${
                                isCritical
                                  ? 'bg-red-100/90 text-red-800 border-red-300 ring-1 ring-red-400'
                                  : isWarning
                                  ? 'bg-amber-100/80 text-amber-800 border-amber-300'
                                  : 'bg-emerald-100/70 text-emerald-800 border-emerald-300'
                              }`}>
                              <span className="text-[14px] leading-tight">
                                {cell.days}d
                              </span>
                              <span className="text-[9px] font-semibold opacity-80 uppercase tracking-tighter">
                                {isCritical ? 'Stockout' : isWarning ? 'Low' : 'OK'}
                              </span>
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-line-2 text-[11px] text-ink-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-200 border border-red-400" />
                <span>&lt; 7 Days (Critical)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400" />
                <span>7–14 Days (Low)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400" />
                <span>&gt; 14 Days (Safe)</span>
              </div>
            </div>
          </Card>
        </Section>

        {/* ── Interactive Emergency Dispatch Modal ───────────────────── */}
        {selectedCell && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setSelectedCell(null)}>
            <div className="w-full max-w-[440px] bg-paper rounded-t-3xl p-5 pb-8 space-y-4 animate-slide-up safe-bot">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-late">
                    Proactive Resupply Dispatch
                  </div>
                  <h3 className="text-[18px] font-bold text-ink leading-tight mt-0.5">
                    {selectedCell.village.name} · {selectedCell.drug.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="press w-8 h-8 rounded-full bg-line grid place-items-center text-ink-3">
                  ✕
                </button>
              </div>

              {/* Status breakdown */}
              <div className="sink rounded-2xl p-3.5 space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-ink-3">Current Village Stock:</span>
                  <span className="font-bold text-ink num">
                    {selectedCell.cell.stock} {selectedCell.drug.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3">Weekly Burn Rate:</span>
                  <span className="font-bold text-ink num">
                    ~{selectedCell.cell.burn} {selectedCell.drug.unit} / week
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-line-2">
                  <span className="font-semibold text-ink">Buffer Remaining:</span>
                  <span className={`font-bold num ${selectedCell.cell.days < 7 ? 'text-late' : 'text-due'}`}>
                    {selectedCell.cell.days} Days ({selectedCell.cell.status.toUpperCase()})
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 text-[12px]">
                <b>DVDMS Protocol:</b> Dispatching buffer stock will be allocated from Batch <b>IFA-2026-B08</b> (Exp: Nov 2027) using First-Expired, First-Out rule.
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Btn
                  tone="ghost"
                  onClick={() => setSelectedCell(null)}>
                  Cancel
                </Btn>
                <Btn
                  onClick={() => handleProactiveDispatch(selectedCell.village, selectedCell.drug)}>
                  One-Tap Dispatch
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* Action Button: Go to Depot Orders */}
        <div className="pt-2">
          <Btn
            full
            size="md"
            onClick={() => nav('/officer/supply')}>
            <Icon name="firstaid" size={18} /> Open Depot Kit Re-supply Orders ({criticalCellsCount + warningCellsCount})
          </Btn>
        </div>
      </main>

      {/* Toast confirmation */}
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
