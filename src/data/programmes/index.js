import rch from './rch.json'
import uwin from './uwin.json'
import hmis from './hmis.json'
import cbac from './cbac.json'
import register from './register.json'

// Each programme is DATA, not code. A sixth one is a sixth file — this is the
// list the Schema Reader agent appends to once an officer approves a draft.
export const programmes = [rch, uwin, hmis, cbac, register]
export const byCode = Object.fromEntries(programmes.map(p => [p.code, p]))
export default programmes
