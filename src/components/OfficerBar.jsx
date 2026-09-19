import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

/**
 * Officer-side top bar.
 *
 * Left:  App name ("ASHAFlow") with NHM tag + current page title.
 * Right: Notification bell (with badge), settings gear.
 *
 * When `back` is true, a back-arrow replaces the app branding and shows
 * page title + subtitle inline — good for detail pages.
 */
export default function OfficerBar({
  title = 'Block Health Office',
  sub = 'Rampur Block · Barabanki District',
  back = false,
  onBack,
  alertCount = 4,
}) {
  const nav = useNavigate()
  const [showAlerts, setShowAlerts] = useState(false)

  /* sample alerts — driven by OFFICER_ALERTS in a real build */
  const alerts = [
    { id: 1, text: '2 villages have critical drug stockouts', level: 'late', time: '12 min ago' },
    { id: 2, text: 'Sunita Devi overdue ANC visit – 8 days', level: 'due', time: '1 hr ago' },
    { id: 3, text: 'IFA batch IFA-2024-A03 expires in 18 days', level: 'due', time: '3 hr ago' },
    { id: 4, text: 'New PMMVY scheme form published centrally', level: 'info', time: 'Yesterday' },
  ]

  return (
    <>
      <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur-md border-b border-line safe-top">

        {/* ───── Primary Bar ───── */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">

          {/* LEFT: Back arrow or App identity */}
          {back ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={onBack || (() => nav(-1))}
                className="press w-9 h-9 shrink-0 -ml-1 rounded-xl grid place-items-center text-ink-2 hover:bg-line-2/50 transition"
                aria-label="Back">
                <Icon name="chevron" size={19} className="rotate-180" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-[16px] text-ink leading-tight truncate">
                  {title}
                </h1>
                <div className="text-[11px] text-ink-3 mt-0.5 truncate">{sub}</div>
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {/* App identity */}
                <span className="w-[26px] h-[26px] rounded-lg bg-brand grid place-items-center shrink-0">
                  <Icon name="hospital" size={15} stroke={2} className="text-white" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[16px] text-ink leading-none tracking-tight">
                      ASHAFlow
                    </span>
                    <span className="bg-brand-soft text-brand text-[9px] font-bold px-1.5 py-[2px] rounded shrink-0 uppercase tracking-wide leading-none">
                      NHM
                    </span>
                  </div>
                  <div className="text-[10.5px] text-ink-3 mt-[2px] truncate">{sub}</div>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: Actions — bell + settings */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Notification Bell */}
            <button
              onClick={() => setShowAlerts(v => !v)}
              className="press relative w-9 h-9 rounded-xl grid place-items-center text-ink-2 hover:bg-line-2/50 transition"
              aria-label="Alerts">
              <Icon name="bell" size={20} />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-[4px] rounded-full bg-late text-white text-[9px] font-bold grid place-items-center num leading-none">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => nav('/portals')}
              className="press w-9 h-9 rounded-xl grid place-items-center text-ink-2 hover:bg-line-2/50 transition"
              aria-label="Settings">
              <Icon name="settings" size={20} />
            </button>
          </div>
        </div>

        {/* ───── Sub-strip: Page title + context (non-back pages only) ─── */}
        {!back && (
          <div className="px-4 pb-2.5 flex items-center justify-between">
            <div>
              <h1 className="font-bold text-[18px] text-ink leading-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-2 text-[10.5px] text-ink-3 shrink-0">
              <span className="flex items-center gap-1 sink text-[10px] font-semibold px-2 py-[3px] rounded-lg text-ink-2">
                <span className="w-[6px] h-[6px] rounded-full bg-brand-lit animate-pulse" />
                Live Sync
              </span>
              <span className="bg-brand-soft text-brand text-[10px] font-bold px-2 py-[3px] rounded-lg">
                MOIC
              </span>
            </div>
          </div>
        )}
      </header>

      {/* ───── Alerts Dropdown ───── */}
      {showAlerts && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAlerts(false)}>
          <div
            className="absolute top-0 right-0 left-0 max-w-[480px] mx-auto"
            onClick={e => e.stopPropagation()}>
            <div className="mx-4 mt-[72px] rounded-2xl bg-paper border border-line shadow-xl overflow-hidden anim-fan">
              <div className="px-4 py-3 border-b border-line-2 flex items-center justify-between">
                <span className="font-bold text-[14px] text-ink">Notifications</span>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="press text-[12px] font-semibold text-brand">
                  Close
                </button>
              </div>
              <div className="divide-y divide-line-2 max-h-[320px] overflow-y-auto">
                {alerts.map(a => (
                  <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                      a.level === 'late' ? 'bg-late' : a.level === 'due' ? 'bg-due' : 'bg-info'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-ink leading-snug">{a.text}</div>
                      <div className="text-[10.5px] text-ink-3 mt-0.5">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-line-2 text-center">
                <button className="press text-[12px] font-semibold text-brand">
                  View all alerts →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
