import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { ASHA } from '../../data/seed'
import Icon from '../../components/Icon'
import { Btn } from '../../components/ui'

// This is intentionally a client-side demo credential. Real accounts need a
// server-side identity provider, password hashing, reset flows and sessions.
const DEMO_PASSWORD = 'ashaflow123'

const ROLE = {
  asha: {
    mark: 'worker', name: 'ASHA worker', who: ASHA.name, id: `${ASHA.id} · ${ASHA.village}`,
    email: ASHA.email, to: '/asha',
  },
  officer: {
    mark: 'officer', name: 'Health officer', who: 'Dr A. Mishra', id: 'BMO · Rampur block',
    email: 'officer@ashaflow.demo', to: '/officer',
  },
  woman: {
    mark: 'user', name: 'Beneficiary', who: 'Sunita Devi', id: 'House 14 · Rampur',
    email: 'sunita.devi@ashaflow.demo', to: '/woman',
  },
}

export default function Login() {
  const [sp] = useSearchParams()
  const role = ROLE[sp.get('as')] ? sp.get('as') : 'asha'
  const r = ROLE[role]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')
  const login = useStore(s => s.login)
  const nav = useNavigate()

  /* r.email is the demo address for this role. It was once undefined, which
     handed the controlled input an undefined value — React quietly switched
     the field to uncontrolled and the button appeared to do nothing. Never
     let a missing field reach an input. */
  const demoEmail = r.email || `${role}@ashaflow.demo`

  const useDemoAccount = () => {
    setEmail(demoEmail)
    setPassword(DEMO_PASSWORD)
    setErr('')
  }

  const submit = event => {
    event.preventDefault()
    const enteredEmail = email.trim().toLowerCase()
    if (!enteredEmail || !password) {
      setErr('Enter your email address and password.')
      return
    }
    if (enteredEmail !== demoEmail.toLowerCase() || password !== DEMO_PASSWORD) {
      setErr('That email or password does not match this demo account.')
      return
    }
    login(role, enteredEmail)
    nav(r.to, { replace: true })
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-8 pb-8 safe-top safe-bot">
      <button onClick={() => nav('/portals')} className="press self-start w-11 h-11 -ml-3 grid place-items-center
        rounded-xl text-[22px] text-ink" aria-label="Back to portal selection">‹</button>

      <div className="text-center mt-4 mb-7">
        <div className="btn-solid w-16 h-16 mx-auto rounded-3xl grid place-items-center text-white text-[26px] mb-4">
          <Icon name={r.mark} size={24} />
        </div>
        <h1 className="text-[23px] font-bold tracking-[-0.015em]">{r.name}</h1>
        <p className="text-[13px] text-ink-3 mt-1">Sign in to your account</p>
      </div>

      <div className="raise rounded-2xl px-4 py-3.5 mb-6">
        <div className="text-[12px] text-ink-3">Signing in to</div>
        <div className="font-semibold text-[16px] mt-0.5">{r.who}</div>
        <div className="text-[12.5px] text-ink-3 num">{r.id}</div>
      </div>

      <form className="space-y-4" onSubmit={submit} noValidate>
        <div>
          <label htmlFor="email" className="block text-[14px] font-semibold mb-2">Email address</label>
          <input id="email" type="email" value={email ?? ''} autoComplete="email" inputMode="email"
            onChange={e => { setEmail(e.target.value); if (err) setErr('') }}
            placeholder="name@example.com" aria-invalid={!!err}
            className="sink w-full min-h-[56px] rounded-xl px-4 text-[16px] font-medium
                       placeholder:text-ink-3/50 placeholder:font-normal" />
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <label htmlFor="password" className="text-[14px] font-semibold">Password</label>
            <button type="button" onClick={() => setShowPassword(v => !v)}
              className="press text-[12.5px] font-semibold text-brand flex items-center gap-1">
              <Icon name="eye" size={15} /> {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input id="password" type={showPassword ? 'text' : 'password'} value={password ?? ''}
            autoComplete="current-password" onChange={e => { setPassword(e.target.value); if (err) setErr('') }}
            placeholder="Enter your password" aria-invalid={!!err}
            className="sink w-full min-h-[56px] rounded-xl px-4 text-[16px] font-medium
                       placeholder:text-ink-3/50 placeholder:font-normal" />
        </div>

        {err && (
          <p role="alert" className="rounded-xl bg-late-soft border border-late/25 px-3.5 py-2.5 text-[13px] font-semibold text-late">
            {err}
          </p>
        )}

        <Btn full type="submit">Sign in</Btn>
      </form>

      <div className="raise rounded-2xl p-4 mt-auto">
        <div className="flex items-start gap-3">
          <span className="sink w-9 h-9 rounded-xl grid place-items-center text-brand shrink-0"><Icon name="shield" size={18} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-bold">Demo account</div>
            <div className="text-[12.5px] text-ink-3 mt-0.5 break-all num">{demoEmail}</div>
            <p className="text-[12px] text-ink-2 mt-2 leading-snug">Use the demo account to fill in the sign-in details on this device.</p>
            <button type="button" onClick={useDemoAccount}
              className="press text-[13px] font-bold text-brand mt-2.5">Use demo account</button>
          </div>
        </div>
      </div>
      <p className="text-[12px] text-ink-3 text-center mt-4">This prototype signs in locally. A real account service is not connected yet.</p>
    </div>
  )
}
