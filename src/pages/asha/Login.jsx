import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { ASHA } from '../../data/seed'
import Icon from '../../components/Icon'
import { Btn } from '../../components/ui'

const ROLE = {
  asha:    { mark: 'worker', name: 'ASHA worker', who: ASHA.name, id: `${ASHA.id} · ${ASHA.village}`, to: '/asha' },
  officer: { mark: 'officer', name: 'Health officer', who: 'Dr A. Mishra', id: 'BMO · Rampur block', to: '/officer' },
  woman:   { mark: 'user', name: 'Beneficiary', who: 'Sunita Devi', id: 'House 14 · Rampur', to: '/woman' },
}

export default function Login() {
  const [sp] = useSearchParams()
  const role = ROLE[sp.get('as')] ? sp.get('as') : 'asha'
  const r = ROLE[role]
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)
  const login = useStore(s => s.login)
  const nav = useNavigate()

  const enter = () => { login(role); nav(r.to, { replace: true }) }

  const push = d => {
    if (err) setErr(false)
    if (d === 'del') return setPin(p => p.slice(0, -1))
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) setTimeout(() => {
      if (next === ASHA.pin) enter()
      else { setErr(true); setPin('') }
    }, 150)
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-8 pb-8 safe-top safe-bot">
      <button onClick={() => nav('/portals')} className="press self-start w-11 h-11 -ml-3 grid place-items-center
        rounded-xl text-[22px] text-ink">‹</button>

      <div className="text-center mt-4 mb-7">
        <div className="btn-solid w-16 h-16 mx-auto rounded-3xl grid place-items-center text-white text-[26px] mb-4">
          <Icon name={r.mark} size={24} />
        </div>
        <h1 className="text-[23px] font-bold tracking-[-0.015em]">{r.name}</h1>
      </div>

      <div className="raise rounded-2xl px-4 py-3.5 mb-6">
        <div className="text-[12px] text-ink-3">Signing in as</div>
        <div className="font-semibold text-[16px] mt-0.5">{r.who}</div>
        <div className="text-[12.5px] text-ink-3 num">{r.id}</div>
      </div>

      <p className="text-center text-[15px] font-semibold mb-3.5">Enter your 4-digit PIN</p>
      <div className="flex justify-center gap-3 mb-2.5">
        {[0, 1, 2, 3].map(i => (
          <span key={i} className={`w-3.5 h-3.5 rounded-full transition
            ${pin.length > i ? 'bg-brand' : err ? 'sink !border-late' : 'sink'}`}
            style={pin.length > i ? { boxShadow: 'inset 0 -1px 1px rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.2)' } : undefined} />
        ))}
      </div>
      <p className={`text-center text-[13px] h-5 mb-4 ${err ? 'text-late font-semibold' : 'text-ink-3'}`}>
        {err ? 'Wrong PIN. Try again.' : `Demo PIN is ${ASHA.pin}`}
      </p>

      <div className="grid grid-cols-3 gap-2.5 mt-auto">
        {['1','2','3','4','5','6','7','8','9','','0','del'].map((k, i) => k === '' ? <span key={i} /> : (
          <button key={i} onClick={() => push(k)}
            className="press raise min-h-[66px] rounded-2xl text-[24px] font-semibold text-ink num">
            {k === 'del' ? <Icon name="backspace" size={22} className="mx-auto" /> : k}
          </button>
        ))}
      </div>

      <Btn tone="ghost" size="sm" className="mt-5 mx-auto" onClick={enter}>Skip for demo</Btn>
      <p className="text-[12px] text-ink-3 text-center mt-4">Works without internet after the first sign-in.</p>
    </div>
  )
}
