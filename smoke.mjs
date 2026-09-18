/* Visits every route in both languages and both personas, and fails on any
   console error or uncaught exception. This is the check that would have
   caught ASSISTANT_PROMPTS being an array. */
import { chromium } from 'playwright'

const B = process.env.BASE || 'http://127.0.0.1:4181'
const ROUTES = [
  '/', '/portals', '/login?as=asha', '/login?as=officer', '/login?as=woman',
  '/asha', '/asha/families', '/asha/add', '/asha/assistant', '/asha/earnings',
  '/asha/more', '/asha/profile', '/asha/scan', '/asha/new-schema',
  '/asha/reminders', '/asha/portal', '/asha/sync', '/asha/proof',
  '/asha/family/h14', '/asha/family/h22', '/asha/visit/h14',
  '/officer', '/officer/add-programme',
  '/asha/forms', '/asha/forms/PMMVY-1A', '/asha/forms/PMMVY-1A/fill/m1',
  '/asha/forms/JSY-CLAIM/fill/m5', '/asha/forms/ICDS-REG/fill/m4', '/asha/submissions',
  '/officer/forms', '/asha/families/new', '/asha/people/new', '/asha/people/new?form=PMMVY-1A',
  '/woman', '/woman/records', '/woman/schemes', '/woman/ask', '/woman/me',
  '/woman/scheme/PMMVY',
]

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let failures = []

for (const [lang, mode] of [['en', 'pregnant'], ['hi', 'mother']]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const p = await ctx.newPage()
  await p.goto(B + '/login')
  await p.evaluate(([l, m]) => {
    localStorage.setItem('af.loggedIn', 'true')
    localStorage.setItem('af.lang', JSON.stringify(l))
    localStorage.setItem('af.womanMode', JSON.stringify(m))
  }, [lang, mode])

  for (const r of ROUTES) {
    const errs = []
    const onErr = e => errs.push(String(e.message || e))
    const onConsole = m => { if (m.type() === 'error') errs.push(m.text()) }
    p.on('pageerror', onErr); p.on('console', onConsole)
    try {
      await p.goto(B + r, { waitUntil: 'networkidle', timeout: 15000 })
      await p.waitForTimeout(250)
      const empty = await p.evaluate(() => document.getElementById('root')?.children.length === 0)
      if (empty) errs.push('rendered nothing')
    } catch (e) { errs.push('navigation: ' + e.message) }
    p.off('pageerror', onErr); p.off('console', onConsole)
    const real = errs.filter(e => !/favicon|manifest|sw\.js|Download the React|ERR_TUNNEL|fonts\.(googleapis|gstatic)|Failed to load resource/i.test(e))
    if (real.length) failures.push(`[${lang}/${mode}] ${r}\n    ${real.join('\n    ')}`)
  }
  await ctx.close()
}

await b.close()
if (failures.length) {
  console.log('FAIL (' + failures.length + ')\n' + failures.join('\n'))
  process.exit(1)
}
console.log(`PASS — ${ROUTES.length} routes x 2 configs, no errors`)
