/* =========================================================================
   Which schemes can be ticked against a person, by who that person is.

   This is a data file on purpose. A state adds a programme by editing this
   list — no screen changes. Amounts and eligibility are indicative and must
   be verified against the programme's own portal before any real use.
   ========================================================================= */

export const SCHEME_CATALOGUE = [
  { code: 'RCH',     label: 'RCH / Maternal register', phase: 'Registration', roles: ['pregnant'] },
  { code: 'PMMVY',   label: 'PMMVY (maternity benefit)', phase: 'Application pending', roles: ['pregnant', 'mother'] },
  { code: 'JSY',     label: 'JSY (delivery benefit)', phase: 'Awaiting delivery', roles: ['pregnant', 'mother'] },
  { code: 'ICDS',    label: 'Anganwadi ration', phase: 'Enrolled', roles: ['pregnant', 'mother', 'infant', 'child'] },
  { code: 'UWIN',    label: 'U-WIN immunisation', phase: 'Schedule started', roles: ['infant', 'child'] },
  { code: 'GROWTH',  label: 'Growth monitoring', phase: 'Monthly weighing', roles: ['infant', 'child'] },
  { code: 'WIFS',    label: 'Weekly iron and folic acid', phase: 'Ongoing', roles: ['child', 'adult'] },
  { code: 'CBAC',    label: 'NCD screening (CBAC)', phase: 'Not started', roles: ['adult', 'elder'] },
  { code: 'NIKSHAY', label: 'Ni-kshay (TB)', phase: 'On treatment', roles: ['adult', 'elder', 'child'] },
  { code: 'PMJAY',   label: 'Ayushman Bharat card', phase: 'Card issued', roles: ['pregnant', 'mother', 'infant', 'child', 'adult', 'elder'] },
]

/** The schemes worth offering for a person in this role. */
export function schemesForRole(role) {
  return SCHEME_CATALOGUE.filter(s => s.roles.includes(role))
}

/** What an ASHA would normally tick straight away for this role. */
export const SUGGESTED = {
  pregnant: ['RCH', 'PMMVY', 'JSY'],
  mother: ['JSY', 'ICDS'],
  infant: ['UWIN', 'GROWTH'],
  child: ['UWIN', 'ICDS'],
  adult: [],
  elder: ['CBAC'],
}

export const labelFor = code =>
  SCHEME_CATALOGUE.find(s => s.code === code)?.label || code
