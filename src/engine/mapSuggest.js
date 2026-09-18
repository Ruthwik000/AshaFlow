import { PATH_LABELS, QUESTION_BANK } from '../data/canonical'

/* =========================================================================
   Which record field does this printed label mean?

   A photographed form gives us a label in a registrar's English — "No. of
   pregnancies in last 5 years (including abortions)". The canonical record
   has 150-odd paths. Showing all of them in one flat dropdown asks the worker
   to do the matching herself, on a phone, in a courtyard.

   So: score every path against the label and put the few plausible ones at
   the top. The rest stay available, grouped, for the case the scorer misses.
   ========================================================================= */

const STOP = new Set([
  'of', 'in', 'the', 'a', 'an', 'for', 'to', 'at', 'on', 'is', 'was', 'and', 'or',
  'no', 'nos', 'number', 'whether', 'any', 'this', 'during', 'if', 'yes',
  'with', 'her', 'his', 'approx', 'including', 's', 'today', 'were',
])

/* Registrar's English and the record's English are not the same English. */
const SYNONYM = {
  tt: 'td', ifa: 'iron', hb: 'haemoglobin', hgb: 'haemoglobin', bp: 'pressure',
  anc: 'antenatal', edd: 'delivery', lmp: 'lmp', wt: 'weight', ht: 'height',
  dob: 'birth', abortion: 'pregnancy', abortions: 'pregnancy',
  gravida: 'pregnancy', para: 'birth', births: 'birth', born: 'birth',
  kid: 'child', kids: 'child', baby: 'child', infant: 'child',
  woman: 'person', women: 'person', mother: 'person', beneficiary: 'person',
  hh: 'household', house: 'household', family: 'household',
  vaccination: 'vaccine', immunisation: 'vaccine', immunization: 'vaccine',
  tablets: 'tablets', dose: 'dose', taken: 'given',
}

/* "pregnancies" and "pregnancy" are the same word to a person reading a form. */
const stem = w => SYNONYM[w] || w
  .replace(/ies$/, 'y')
  .replace(/(ches|shes|sses|xes)$/, '$1'.slice(0, -2))
  .replace(/([^s])s$/, '$1')

const words = s => String(s || '').toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter(w => w.length > 1 && !STOP.has(w))
  .map(stem)
  .filter(w => !STOP.has(w))

/* Two vocabularies per path, because they are not equally trustworthy: what
   the field is *called* is strong evidence, the question wording only hints. */
const VOCAB = Object.fromEntries(Object.keys(PATH_LABELS).map(p => {
  const q = QUESTION_BANK[p] || {}
  return [p, {
    name: words(`${PATH_LABELS[p] || ''} ${p.replace(/[.]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}`),
    hint: words(q.q || ''),
  }]
}))

const norm = s => words(s).join(' ')
const NAME_KEY = Object.fromEntries(
  Object.keys(PATH_LABELS).map(p => [norm(PATH_LABELS[p]), p]).filter(([k]) => k))

const near = (w, list) => list.some(x => {
  const [short, long] = w.length < x.length ? [w, x] : [x, w]
  return long.startsWith(short) && short.length / long.length >= 0.72
})

/** 0 to 1. What the field is called counts for more than how it is asked. */
export function score(label, path) {
  const a = words(label)
  const v = VOCAB[path]
  if (!a.length || !v) return 0
  if (NAME_KEY[norm(label)] === path) return 1

  let hits = 0
  for (const w of a) {
    if (v.name.includes(w)) hits += 1
    else if (near(w, v.name)) hits += 0.7
    else if (v.hint.includes(w) || near(w, v.hint)) hits += 0.4
  }
  const coverage = hits / a.length                       // how much of the label is explained
  const precision = hits / Math.max(a.length, v.name.length)  // …without the path meaning more
  return coverage * 0.6 + precision * 0.4
}

/** The few paths worth offering first for this label. */
export function suggestPaths(label, limit = 5) {
  return Object.keys(PATH_LABELS)
    .map(p => ({ path: p, s: score(label, p) }))
    .filter(x => x.s >= 0.4)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
}

const AREA = {
  person: 'The person', household: 'The household', pregnancy: 'Pregnancy',
  anc: 'Antenatal visits', vitals: 'Measurements', delivery: 'Delivery',
  child: 'The child', vaccine: 'Vaccines', tt: 'Td doses', newborn: 'Newborn',
  ncd: 'NCD screening', tb: 'TB', fp: 'Family planning', visit: 'This visit',
}

/** Every path, grouped by the part of the record it belongs to. */
export function pathGroups() {
  const out = new Map()
  for (const p of Object.keys(PATH_LABELS)) {
    const area = AREA[p.split('.')[0]] || 'Other'
    if (!out.has(area)) out.set(area, [])
    out.get(area).push(p)
  }
  return [...out.entries()].map(([title, paths]) => ({ title, paths }))
}
