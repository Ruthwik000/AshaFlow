import { useNavigate } from 'react-router-dom'
import { useStore, say } from '../store/useStore'
import Icon from './Icon'
import { useT, LANGS } from '../i18n'
import { useState } from 'react'

/* ---------------------------------------------------------------- buttons */
const TONE_CLASS = {
  brand: 'btn-solid', ghost: 'btn-quiet', soft: 'btn-quiet !text-brand',
  dark: 'btn-dark', danger: 'btn-danger',
}
const SIZE_CLASS = {
  lg: 'min-h-[58px] px-5 text-[17px] rounded-2xl',
  md: 'min-h-[48px] px-4 text-[15px] rounded-xl',
  sm: 'min-h-[38px] px-3 text-[13px] rounded-lg',
}

export function Btn({ children, onClick, tone = 'brand', size = 'lg', full, disabled, className = '', type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`press font-semibold inline-flex items-center justify-center gap-2 tracking-[-0.005em]
        ${TONE_CLASS[tone]} ${SIZE_CLASS[size]} ${full ? 'w-full' : ''} ${className}`}>
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------- bars */
export function TopBar({ title, sub, back, right, onBack }) {
  const nav = useNavigate()
  return (
    <header className="safe-top sticky top-0 z-30 bg-paper/92 backdrop-blur-md border-b border-line">
      <div className="h-[58px] px-2 flex items-center gap-1">
        {back && (
          <button onClick={() => (onBack ? onBack() : nav(-1))} aria-label="Go back"
            className="press w-11 h-11 shrink-0 grid place-items-center rounded-xl text-ink text-[22px] active:bg-line-2">‹</button>
        )}
        <div className={`min-w-0 flex-1 ${back ? '' : 'pl-3'}`}>
          <div className="font-bold text-[16px] leading-tight truncate tracking-[-0.01em]">{title}</div>
          {sub && <div className="text-[12px] text-ink-3 leading-tight truncate">{sub}</div>}
        </div>
        <div className="shrink-0 pr-1 flex items-center gap-1.5">{right}</div>
      </div>
    </header>
  )
}

/** Branded header for the top-level tabs: app name above, context below. */
export function AppBar({ title, sub, right }) {
  const nav = useNavigate()
  const t = useT()
  const asha = useStore(s => s.asha)
  const [langOpen, setLangOpen] = useState(false)

  return (
    <>
      <header className="safe-top sticky top-0 z-30 bg-paper/92 backdrop-blur-md border-b border-line">
        <div className="px-4 pt-2.5 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="btn-solid w-[30px] h-[30px] rounded-[10px] grid place-items-center text-white shrink-0">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="6" cy="12" r="2.4" fill="currentColor" stroke="none" />
                <circle cx="18" cy="5.5" r="1.7" fill="currentColor" stroke="none" />
                <circle cx="18" cy="12" r="1.7" fill="currentColor" stroke="none" />
                <circle cx="18" cy="18.5" r="1.7" fill="currentColor" stroke="none" />
                <path d="M8.2 11 16 6.2M8.4 12H16M8.2 13 16 17.8" opacity=".85" />
              </svg>
            </span>
            <span className="font-bold text-[16.5px] tracking-[-0.015em] flex-1">{t('appName')}</span>
            <button onClick={() => setLangOpen(true)} aria-label={t('common.language')}
              className="press raise-sm h-9 px-2.5 rounded-xl grid place-items-center text-ink-2 text-[11.5px] font-bold uppercase">
              {t.lang}
            </button>
            <IconBtn icon="settings" label={t('common.settings')} size={36} onClick={() => nav('/asha/more')} />
            <Avatar name={asha.name} size={36} onClick={() => nav('/asha/profile')} label={t('common.profile')} />
          </div>

          <div className="flex items-end gap-3 mt-3">
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[19px] leading-tight tracking-[-0.015em] truncate">{title}</div>
              {sub && <div className="text-[12.5px] text-ink-3 leading-tight truncate mt-0.5">{sub}</div>}
            </div>
            {right ?? <NetDot />}
          </div>
        </div>
      </header>
      {langOpen && <LangSheet onClose={() => setLangOpen(false)} />}
    </>
  )
}

export function LangSheet({ onClose }) {
  const lang = useStore(s => s.lang)
  const setLang = useStore(s => s.setLang)
  const t = useT()
  return (
    <div className="fixed inset-0 z-50 bg-ink/45 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-paper rounded-t-3xl p-5 pb-8 anim-up safe-bot paper-ground"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-line mx-auto mb-4" />
        <h2 className="font-bold text-[17px] mb-3">{t('common.language')}</h2>
        <div className="space-y-2">
          {LANGS.map(l => (
            <button key={l.code} disabled={!l.ready}
              onClick={() => { setLang(l.code); onClose() }}
              className={`press w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left
                ${lang === l.code ? 'btn-solid text-white' : l.ready ? 'raise' : 'sink opacity-60'}`}>
              <span className="text-[17px] font-semibold flex-1">{l.native}</span>
              <span className={`text-[12px] ${lang === l.code ? 'text-white/70' : 'text-ink-3'}`}>
                {l.ready ? l.label : t('settings.comingSoon')}
              </span>
              {lang === l.code && <Icon name="check" size={17} stroke={2.4} />}
            </button>
          ))}
        </div>
        <p className="text-[11.5px] text-ink-3 mt-4 leading-relaxed">{t('settings.langNote')}</p>
      </div>
    </div>
  )
}

export function NetDot() {
  const offline = useStore(s => s.demoOffline || !s.online)
  const t = useT()
  return (
    <span className={`raise-sm inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0
      ${offline ? 'text-due' : 'text-brand'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${offline ? 'bg-due' : 'bg-brand-lit'}`} />
      {offline ? t('common.offline') : t('common.online')}
    </span>
  )
}

export function Speaker({ text, className = '' }) {
  const on = useStore(s => s.speak)
  if (!on) return null
  return (
    <button onClick={() => say(text)} aria-label="Read aloud"
      className={`press raise-sm w-11 h-11 shrink-0 grid place-items-center rounded-full text-ink-2 ${className}`}>
      <Icon name="speaker" size={19} />
    </button>
  )
}

export function IconBtn({ icon, onClick, label, size = 40 }) {
  return (
    <button onClick={onClick} aria-label={label}
      className="press raise-sm grid place-items-center rounded-xl text-ink-2 shrink-0"
      style={{ width: size, height: size }}>
      <Icon name={icon} size={19} />
    </button>
  )
}

export function Avatar({ name = '', onClick, size = 40, label = 'Profile' }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const inner = (
    <span className="btn-solid grid place-items-center rounded-full text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials || <Icon name="user" size={size * 0.5} />}
    </span>
  )
  if (!onClick) return inner
  return <button onClick={onClick} aria-label={label} className="press shrink-0">{inner}</button>
}

/* ------------------------------------------------------------------ cards */
export function Card({ children, className = '', onClick, as = 'div', flat }) {
  const Tag = onClick ? 'button' : as
  return (
    <Tag onClick={onClick}
      className={`block w-full text-left rounded-2xl ${flat ? 'bg-surface border border-line' : 'raise'}
        ${onClick ? 'press' : ''} ${className}`}>
      {children}
    </Tag>
  )
}

export function Section({ title, action, children, className = '' }) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="flex items-end justify-between mb-2.5 px-0.5">
          {title && <h2 className="text-[13.5px] font-semibold text-ink-2 tracking-[-0.005em]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

const LEVEL = {
  late: { dot: 'bg-late', chip: 'text-late', label: 'Overdue' },
  due:  { dot: 'bg-due',  chip: 'text-due',   label: 'Due' },
  info: { dot: 'bg-info', chip: 'text-info', label: 'Planned' },
  done: { dot: 'bg-brand-lit', chip: 'text-brand', label: 'Done' },
}

export function LevelDot({ level = 'info' }) {
  return (
    <span className={`w-3 h-3 rounded-full shrink-0 ${LEVEL[level].dot}`}
      style={{ boxShadow: 'inset 0 -1px 1px rgba(0,0,0,.25), inset 0 1px 1px rgba(255,255,255,.4)' }} />
  )
}

export function Pill({ level = 'info', children }) {
  return (
    <span className={`raise-sm text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${LEVEL[level].chip}`}>
      {children || LEVEL[level].label}
    </span>
  )
}

export function Stat({ value, label, tone = 'ink', sub }) {
  const tones = { ink: 'text-ink', brand: 'text-brand', late: 'text-late', due: 'text-due' }
  return (
    <div className="raise rounded-2xl p-3.5">
      <div className={`text-[28px] font-bold leading-none num tracking-[-0.02em] ${tones[tone]}`}>{value}</div>
      <div className="text-[12px] text-ink-2 mt-2 leading-tight">{label}</div>
      {sub && <div className="text-[11px] text-ink-3 mt-0.5">{sub}</div>}
    </div>
  )
}

export function Bar({ value, tone = 'brand' }) {
  const tones = {
    brand: 'linear-gradient(180deg,var(--color-brand-lit),var(--color-brand))',
    due: 'linear-gradient(180deg,#C08320,var(--color-due))',
    late: 'linear-gradient(180deg,#C2493B,var(--color-late))',
  }
  return (
    <div className="sink h-2.5 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: tones[tone],
                 boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)' }} />
    </div>
  )
}

export function Toggle({ on, onClick, label }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={on}
      className={`switch-track press w-[54px] h-[32px] rounded-full relative shrink-0 transition-colors
        ${on ? 'bg-brand' : 'bg-sunken'}`}>
      <span className={`switch-knob absolute top-[3px] w-[26px] h-[26px] rounded-full transition-all
        ${on ? 'left-[25px]' : 'left-[3px]'}`} />
    </button>
  )
}

export function Field({ label, hint, required, children, id }) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline gap-2 mb-2">
        <span className="text-[14px] font-semibold">{label}</span>
        {required && <span className="text-[11px] font-bold text-due uppercase tracking-wide">Required</span>}
      </label>
      {hint && <p className="text-[12.5px] text-ink-3 -mt-1 mb-2 leading-snug">{hint}</p>}
      {children}
    </div>
  )
}

export function TextField({ value, onChange, placeholder, id, type = 'text' }) {
  return (
    <input id={id} type={type} value={value ?? ''} placeholder={placeholder} autoComplete="off"
      onChange={e => onChange(e.target.value)}
      className="sink w-full min-h-[54px] rounded-xl px-4 text-[16px] font-medium
                 placeholder:text-ink-3/50 placeholder:font-normal" />
  )
}

export function Chips({ value, onChange, options, cols = 3 }) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {options.map(o => (
        <button key={String(o.v)} onClick={() => onChange(o.v)}
          className={`press min-h-[50px] rounded-xl px-2 text-[14px] font-semibold
            ${value === o.v ? 'btn-solid text-white' : 'raise text-ink-2'}`}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

export function Empty({ icon = 'inbox', title, sub }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="sink w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-3 text-ink-3">
        <Icon name={icon} size={26} />
      </div>
      <div className="font-semibold text-ink">{title}</div>
      {sub && <div className="text-[13px] text-ink-3 mt-1">{sub}</div>}
    </div>
  )
}

export function Notice({ tone = 'info', title, children, action }) {
  const tones = {
    info: 'bg-info-soft border-info/20', due: 'bg-due-soft border-due/20',
    late: 'bg-late-soft border-late/20', brand: 'bg-brand-soft border-brand/20',
    agent: 'bg-agent-soft border-agent/20',
  }
  const heads = { info: 'text-info', due: 'text-due', late: 'text-late', brand: 'text-brand', agent: 'text-agent' }
  return (
    <div className={`border rounded-2xl p-4 ${tones[tone]}`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)' }}>
      {title && <div className={`font-bold text-[14px] mb-1 ${heads[tone]}`}>{title}</div>}
      <div className="text-[13px] leading-relaxed text-ink-2">{children}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

/** Non-negotiable badge wherever a fake external connection is shown. */
export function SimBadge({ children = 'Simulated — not a real government system' }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-due/30 bg-due-soft px-3 py-2">
      <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
      <span className="text-[11.5px] font-semibold text-due leading-snug">{children}</span>
    </div>
  )
}

export function Row({ icon, title, sub, right, onClick, tone }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${onClick ? 'press active:bg-line-2/60' : ''}`}>
      {icon && <span className="text-[20px] shrink-0 w-6 text-center">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className={`font-semibold text-[14.5px] leading-tight ${tone === 'late' ? 'text-late' : ''}`}>{title}</div>
        {sub && <div className="text-[12.5px] text-ink-3 mt-0.5 leading-snug">{sub}</div>}
      </div>
      {right}
      {onClick && !right && <span className="text-ink-3 shrink-0"><Icon name="chevron" size={17} /></span>}
    </Tag>
  )
}

export function List({ children, className = '' }) {
  return <div className={`raise rounded-2xl overflow-hidden divide-y divide-line-2 ${className}`}>{children}</div>
}

export const rupee = n => '₹' + Number(n || 0).toLocaleString('en-IN')

export function fmtDate(d) {
  if (!d || d === '—') return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return String(d)
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Calendar-day difference, so a date stamped earlier today reads "today". */
export function daysFromNow(d) {
  const a = new Date(d); const b = new Date()
  a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0)
  const diff = Math.round((a - b) / 86400000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  if (diff > 0) return `in ${diff} days`
  return `${Math.abs(diff)} days ago`
}
