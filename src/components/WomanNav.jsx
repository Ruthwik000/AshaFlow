import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import { useT } from '../i18n'

const ITEMS = [
  { to: '/woman', icon: 'home', key: 'wnav.home', end: true },
  { to: '/woman/records', icon: 'history', key: 'wnav.record' },
  { to: '/woman/schemes', icon: 'wallet', key: 'wnav.schemes' },
  { to: '/woman/ask', icon: 'message', key: 'wnav.ask' },
  { to: '/woman/me', icon: 'user', key: 'wnav.me' },
]

export default function WomanNav() {
  const t = useT()
  return (
    <nav className="sticky bottom-0 z-30 bg-paper/94 backdrop-blur-md border-t border-line safe-bot">
      <div className="grid grid-cols-5 px-1.5 pt-1.5 pb-1">
        {ITEMS.map(i => (
          <NavLink key={i.to} to={i.to} end={i.end} aria-label={t(i.key)}
            className="press min-h-[58px] flex flex-col items-center justify-center gap-1 rounded-xl">
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-brand' : 'text-ink-3'}>
                  <Icon name={i.icon} size={22} stroke={isActive ? 2 : 1.7} />
                </span>
                <span className={`text-[10.5px] font-bold ${isActive ? 'text-brand' : 'text-ink-3'}`}>{t(i.key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
