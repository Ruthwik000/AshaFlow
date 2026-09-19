import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import { useT } from '../i18n'

const ITEMS = [
  { to: '/asha', icon: 'home', key: 'nav.home', end: true },
  { to: '/asha/families', icon: 'families', key: 'nav.families' },
  { to: '/asha/add', icon: 'plus', key: 'nav.add', primary: true },
  { to: '/asha/assistant', icon: 'assist', key: 'nav.assist' },
  { to: '/asha/medicine', icon: 'firstaid', key: 'nav.medicine' },
]

export default function BottomNav() {
  const t = useT()
  return (
    <nav className="sticky bottom-0 z-30 bg-paper/94 backdrop-blur-md border-t border-line safe-bot">
      <div className="grid grid-cols-5 px-1.5 pt-1.5 pb-1">
        {ITEMS.map(i => (
          <NavLink key={i.to} to={i.to} end={i.end} aria-label={t(i.key)}
            className="press min-h-[58px] flex flex-col items-center justify-center gap-1 rounded-xl">
            {({ isActive }) => i.primary ? (
              <>
                <span className="btn-solid w-12 h-12 rounded-2xl grid place-items-center text-white -mt-3">
                  <Icon name="plus" size={24} stroke={2.2} />
                </span>
                <span className="text-[10.5px] font-bold text-brand -mt-0.5">{t(i.key)}</span>
              </>
            ) : (
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
