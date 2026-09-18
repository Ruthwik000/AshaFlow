import { useEffect, useState } from 'react'
import { db, queueSize, syncNow } from '../../db/db'
import { useStore } from '../../store/useStore'
import { TopBar, Card, Btn, Notice, fmtDate } from '../../components/ui'

export default function SyncPage() {
  const offline = useStore(s => s.demoOffline || !s.online)
  const toggleDemoOffline = useStore(s => s.toggleDemoOffline)
  const demoOffline = useStore(s => s.demoOffline)
  const [n, setN] = useState(0)
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState(null)

  const refresh = () => {
    queueSize().then(setN)
    db.encounters.where('synced').equals(0).toArray().then(setRows)
    db.meta.get('lastSync').then(m => setLast(m?.value))
  }
  useEffect(refresh, [])

  const run = async () => {
    setBusy(true)
    await new Promise(r => setTimeout(r, 900))
    await syncNow()
    setBusy(false)
    refresh()
  }

  return (
    <>
      <TopBar title="Sync" sub={offline ? 'No connection right now' : 'Connected'} back />
      <main className="flex-1 px-4 py-4 space-y-5">
        <Card className="p-6 text-center">
          <div className="text-[52px] font-bold num leading-none">{n}</div>
          <div className="text-[14px] text-ink-2 mt-2">
            {n === 0 ? 'Everything is sent' : `visit${n > 1 ? 's' : ''} waiting`}
          </div>
          {last && <div className="text-[12px] text-ink-3 mt-2">Last sync {fmtDate(last)}</div>}
        </Card>

        <Btn full onClick={run} disabled={offline || n === 0 || busy}>
          {busy ? 'Sending…' : offline ? 'No internet — it will send by itself' : 'Send now'}
        </Btn>

        {rows.length > 0 && (
          <div className="bg-surface border border-line rounded-2xl divide-y divide-line-2">
            {rows.map(r => (
              <div key={r.id} className="px-4 py-3">
                <div className="text-[14px] font-semibold">{r.summary || r.type}</div>
                <div className="text-[11.5px] text-ink-3 mt-0.5 num">id {r.id.slice(0, 8)}… · queued</div>
              </div>
            ))}
          </div>
        )}

        <Notice tone="info" title="Nothing gets lost">
          Your visits are saved on this phone first. When the signal comes back they send
          themselves. Sending twice is safe — it is never stored twice.
        </Notice>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-semibold text-[14.5px]">Pretend there is no signal</div>
              <div className="text-[12.5px] text-ink-3 mt-0.5">For showing how offline works</div>
            </div>
            <button onClick={toggleDemoOffline} aria-label="Toggle offline demo"
              className={`w-14 h-8 rounded-full transition relative shrink-0 ${demoOffline ? 'bg-due' : 'bg-line'}`}>
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all
                ${demoOffline ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </Card>
      </main>
    </>
  )
}
