import { NavLink } from 'react-router-dom'
import Icon from './Icon'

const ITEMS = [
  { to: '/woman', icon: 'home', label: 'Home', end: true },
  { to: '/woman/records', icon: 'history', label: 'My record' },
  { to: '/woman/schemes', icon: 'wallet', label: 'Schemes' },
  { to: '/woman/ask', icon: 'message', label: 'Ask' },
  { to: '/woman/me', icon: 'user', label: 'Me' },
]

export default function WomanNav() {
  return (
    <nav className="sticky bottom-0 z-30 bg-paper/94 backdrop-blur-md border-t border-line safe-bot">
      <div className="grid grid-cols-5 px-1.5 pt-1.5 pb-1">
        {ITEMS.map(i => (
          <NavLink key={i.to} to={i.to} end={i.end} aria-label={i.label}
            className="press min-h-[58px] flex flex-col items-center justify-center gap-1 rounded-xl">
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-brand' : 'text-ink-3'}>
                  <Icon name={i.icon} size={22} stroke={isActive ? 2 : 1.7} />
                </span>
                <span className={`text-[10.5px] font-bold ${isActive ? 'text-brand' : 'text-ink-3'}`}>{i.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
