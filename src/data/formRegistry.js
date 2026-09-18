import schemeForms, { formByCode } from './schemeForms'
import { listCustomForms, getCustomForm } from '../db/db'

/* Built-in programme forms and forms an ASHA scanned in the field are the same
   shape, so everything downstream — the picker, the prefill, the submission —
   treats them identically. */

export async function allForms() {
  const custom = await listCustomForms()
  return [
    ...schemeForms.map(f => ({ ...f, builtIn: true })),
    ...custom.map(f => ({ ...f, builtIn: false })),
  ]
}

export async function findForm(code) {
  return formByCode[code] ? { ...formByCode[code], builtIn: true }
    : (await getCustomForm(code).then(f => (f ? { ...f, builtIn: false } : null)))
}

export { schemeForms }
