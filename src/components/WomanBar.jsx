import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { WOMAN } from '../data/seed'
import Icon from './Icon'
import { IconBtn, Avatar, LangSheet } from './ui'
import { useT } from '../i18n'

/** "5 months pregnant" or "Mother of Aarav, 3 months", in her language. */
export function statusLine(t, mode, w) {
  return mode === 'pregnant'
    ? t('w.statusPregnant', { n: w.month })
    : t('w.statusMother', { name: w.baby.name, n: w.baby.months })
}

/** Branded header for the beneficiary portal. Same shape as the ASHA AppBar. */
export default function WomanBar({ title, sub, right }) {
  const nav = useNavigate()
  const mode = useStore(s => s.womanMode)
  const lang = useStore(s => s.lang)
  const [langOpen, setLangOpen] = useState(false)
  const t = useT()
  const w = WOMAN[mode]

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
            <span className="font-bold text-[16.5px] tracking-[-0.015em] flex-1">ASHAFlow</span>
            <button onClick={() => setLangOpen(true)} aria-label={t('w.language')}
              className="press raise-sm h-9 px-2.5 rounded-xl grid place-items-center text-ink-2 text-[11.5px] font-bold uppercase">
              {lang}
            </button>
            <IconBtn icon="phone" label={t('w.callMyAsha')} size={36} />
            <Avatar name={w.name} size={36} onClick={() => nav('/woman/me')} label={t('w.myDetailsLabel')} />
          </div>

          <div className="flex items-end gap-3 mt-3">
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[19px] leading-tight tracking-[-0.015em] truncate">{title ?? w.name}</div>
              <div className="text-[12.5px] text-ink-3 leading-tight truncate mt-0.5">{sub ?? statusLine(t, mode, w)}</div>
            </div>
            {right}
          </div>
        </div>
      </header>
      {langOpen && <LangSheet onClose={() => setLangOpen(false)} />}
    </>
  )
}
