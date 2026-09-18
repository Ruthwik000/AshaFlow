import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listSubmissions } from '../../db/db'
import Icon from '../../components/Icon'
import { TopBar, Card, Btn, Pill, Empty, Notice, fmtDate } from '../../components/ui'

export default function Submissions() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const justSaved = sp.get('new')
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(justSaved || null)

  useEffect(() => { listSubmissions().then(setRows) }, [])
  if (!rows) return <div className="p-6 text-ink-3">Loading…</div>

  return (
    <>
      <TopBar title="Filled forms" sub={`${rows.length} saved on this phone`}
        back onBack={() => nav('/asha/forms')} />

      <main className="flex-1 px-4 py-4 space-y-4 pb-8">
        {justSaved && (
          <Notice tone="brand" title="Saved">
            The form is stored on this phone and queued for the next sync. Nothing is lost if the
            signal does not come back today.
          </Notice>
        )}

        {rows.length === 0 && (
          <Empty title="No forms filled yet" sub="Pick a scheme form and it will appear here." />
        )}

        <div className="space-y-2.5">
          {rows.map(r => {
            const isOpen = open === r.id
            const fields = Object.values(r.payload || {})
            return (
              <Card key={r.id} className="overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : r.id)} className="press w-full text-left p-4">
                  <div className="flex items-start gap-3">
                    <span className="raise-sm w-10 h-10 shrink-0 rounded-xl grid place-items-center text-brand">
                      <Icon name="doc" size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[15px] leading-tight">{r.formName}</div>
                      <div className="text-[12.5px] text-ink-2 mt-0.5">
                        {r.memberName} · House {r.houseNo}, {r.village}
                      </div>
                      <div className="text-[11.5px] text-ink-3 mt-1 num">
                        {fmtDate(r.createdAt)} · {r.stats?.total} fields · you typed {r.typedCount}
                      </div>
                    </div>
                    {r.synced ? <Pill level="done">Synced</Pill> : <Pill level="due">Queued</Pill>}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-line-2 anim-up">
                    <div className="divide-y divide-line-2 max-h-[420px] overflow-y-auto">
                      {fields.map(f => (
                        <div key={f.id} className="px-4 py-2.5 flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] text-ink-3">{f.label}</div>
                            <div className="text-[14px] font-semibold num mt-0.5">
                              {f.value === true ? 'Yes' : f.value === false ? 'No' : (f.value ?? '—')}
                            </div>
                          </div>
                          <span className="text-[10.5px] font-bold uppercase tracking-wide text-ink-3 shrink-0 mt-1">
                            {f.source === 'record' ? 'record' : f.source === 'derived' ? 'calc'
                              : f.source === 'entered' ? 'typed' : 'blank'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-line-2 grid grid-cols-2 gap-2.5">
                      <Btn size="sm" tone="ghost" onClick={() => window.print()}>Print</Btn>
                      <Btn size="sm" tone="ghost" onClick={() => nav('/asha/portal')}>Send to portal</Btn>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </main>
    </>
  )
}
