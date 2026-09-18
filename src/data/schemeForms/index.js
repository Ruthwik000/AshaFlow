import pmmvy from './pmmvy.json'
import jsy from './jsy.json'
import icds from './icds.json'
import birth from './birth.json'

/* Application forms an officer publishes. Same shape as a programme schema:
   every field names a canonical path, so the record fills what it already
   knows and only the genuinely new questions reach a human. */
export const schemeForms = [pmmvy, jsy, icds, birth]
export const formByCode = Object.fromEntries(schemeForms.map(f => [f.code, f]))
export default schemeForms
