import { NavLink } from 'react-router-dom'
import Icon from './Icon'

const ITEMS = [
  { to: '/officer', icon: 'chart', label: 'Overview', end: true },
  { to: '/officer/heatmap', icon: 'mark', label: 'Stockout Heatmap', badge: 'Alert' },
  { to: '/officer/supply', icon: 'firstaid', label: 'DVDMS Depot', badgeCount: 12 },
  { to: '/officer/workers', icon: 'worker', label: 'ASHA Staff' },
  { to: '/officer/forms', icon: 'doc', label: 'Programmes' },
]

export default function OfficerNav() {
  return (
    <nav className="sticky bottom-0 z-30 bg-paper/95 backdrop-blur-md border-t border-line safe-bot shadow-lg">
      <div className="grid grid-cols-5 px-1 pt-1.5 pb-1">
        {ITEMS.map(i => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.end}
            aria-label={i.label}
            className="press min-h-[58px] flex flex-col items-center justify-center gap-1 rounded-xl relative">
            {({ isActive }) => (
              <>
                <div className="relative">
                  <span className={isActive ? 'text-brand' : 'text-ink-3'}>
                    <Icon name={i.icon} size={21} stroke={isActive ? 2.2 : 1.7} />
                  </span>
                  {i.badge && (
                    <span className="absolute -top-1.5 -right-2.5 w-2 h-2 rounded-full bg-late animate-pulse" />
                  )}
                  {i.badgeCount && (
                    <span className="absolute -top-1.5 -right-3 px-1 py-0.2 bg-due text-white text-[9px] font-bold rounded-full num">
                      {i.badgeCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold tracking-tight text-center leading-tight ${
                  isActive ? 'text-brand font-extrabold' : 'text-ink-3'
                }`}>
                  {i.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
