/* =========================================================================
   The caseload matrix.

   Every number here is counted from the household and member rows, not
   stored. It is the same arithmetic an ASHA does on paper at the end of the
   month, and it is what a block officer asks her for.
   ========================================================================= */

const monthsOld = m => {
  if (m.dob) return Math.max(0, Math.round((Date.now() - new Date(m.dob)) / 2629800000))
  return (m.age ?? 0) * 12
}

const weeksPregnant = m =>
  m.lmp ? Math.max(0, Math.floor((Date.now() - new Date(m.lmp)) / (7 * 86400000))) : null

export function memberStatus(m) {
  const mo = monthsOld(m)
  if (m.role === 'pregnant') {
    const w = weeksPregnant(m)
    const tri = w == null ? null : w < 13 ? 1 : w < 28 ? 2 : 3
    return {
      kind: 'pregnant',
      label: w != null ? `Pregnant · ${Math.floor(w / 4.35)} months` : 'Pregnant',
      detail: tri ? `Trimester ${tri}` : null,
      weeks: w, trimester: tri,
      urgent: tri === 3,
    }
  }
  if (mo < 2) return { kind: 'newborn', label: `Newborn · ${mo === 0 ? 'under a month' : '1 month'}`,
                       detail: 'Home visits due', urgent: true }
  if (mo < 12) return { kind: 'infant', label: `Infant · ${mo} months`, detail: 'Vaccines due on schedule' }
  if (mo < 60) return { kind: 'under5', label: `Child · ${Math.floor(mo / 12)} years`,
                        detail: mo < 24 ? 'Boosters and vitamin A' : 'Growth monitoring' }
  if (m.role === 'mother') return { kind: 'mother', label: 'Mother', detail: 'Breastfeeding support' }
  if (m.role === 'adolescent') return { kind: 'adolescent', label: `${m.age} years`,
                                        detail: m.sex === 'F' ? 'Weekly iron and folic acid' : null }
  if ((m.age ?? 0) >= 60) return { kind: 'elder', label: `${m.age} years`, detail: 'NCD screening yearly' }
  if ((m.age ?? 0) >= 30) return { kind: 'ncd', label: `${m.age} years`, detail: 'NCD screening due' }
  return { kind: 'adult', label: `${m.age} years`, detail: null }
}

/** The whole population she is responsible for, counted. */
export function caseloadMatrix({ households = [], members = [], tasks = [] }) {
  const byKind = k => members.filter(m => memberStatus(m).kind === k)

  const pregnant = byKind('pregnant')
  const newborns = byKind('newborn')
  const infants = byKind('infant')
  const under5 = [...newborns, ...infants, ...byKind('under5')]
  const ncdDue = [...byKind('ncd'), ...byKind('elder')]
  const women1549 = members.filter(m => m.sex === 'F' && m.age >= 15 && m.age <= 49)

  const villages = [...new Set(households.map(h => h.village))].map(v => ({
    name: v,
    households: households.filter(h => h.village === v).length,
    people: members.filter(m => households.find(h => h.id === m.householdId)?.village === v).length,
  }))

  const avg = households.length ? (members.length / households.length) : 0
  const visited = new Set(tasks.filter(t => t.level === 'done').map(t => t.householdId)).size
  const withPregnancy = new Set(pregnant.map(m => m.householdId)).size
  const withUnder5 = new Set(under5.map(m => m.householdId)).size

  return {
    households: households.length,
    people: members.length,
    villages,

    /* The two lines an officer asks for first: how many families, how many
       people. They belong in the matrix itself, not only in a subtitle. */
    totals: [
      { key: 'households', short: 'families', label: 'Total families', n: households.length,
        tone: 'brand', note: `across ${villages.length} ${villages.length === 1 ? 'village' : 'villages'}` },
      { key: 'people', short: 'people', label: 'People in those families', n: members.length,
        tone: 'ink', note: `${avg.toFixed(1)} per family on average` },
    ],

    rows: [
      { key: 'pregnant', short: 'pregnant', label: 'Pregnant women', n: pregnant.length, tone: 'brand',
        note: pregnant.filter(m => memberStatus(m).trimester === 3).length + ' in the third trimester'
              + (withPregnancy ? ` · ${withPregnancy} families` : '') },
      { key: 'newborn', short: 'newborns', label: 'Newborns under 2 months', n: newborns.length, tone: 'late',
        note: 'home visit schedule running' },
      { key: 'infant', short: 'infants', label: 'Infants under 1 year', n: infants.length, tone: 'due',
        note: 'on the immunisation schedule' },
      { key: 'under5', short: 'under 5', label: 'Children under 5', n: under5.length, tone: 'ink',
        note: `vaccination and growth monitoring${withUnder5 ? ` · ${withUnder5} families` : ''}` },
      { key: 'women1549', short: 'women 15–49', label: 'Women aged 15 to 49', n: women1549.length, tone: 'ink',
        note: 'eligible couple register' },
      { key: 'ncd', short: '30 and over', label: 'Adults 30 and over', n: ncdDue.length, tone: 'ink',
        note: 'CBAC screening' },
    ],
    familiesVisited: visited,
    dueNow: tasks.filter(t => t.level === 'late' || t.level === 'due').length,
  }
}

/** What a single household contributes to the matrix — the row chips. */
export function householdSummary(members = []) {
  const s = members.map(memberStatus)
  const count = k => s.filter(x => x.kind === k).length
  const chips = []
  const preg = count('pregnant')
  const nb = count('newborn')
  const u5 = count('newborn') + count('infant') + count('under5')
  const ncd = count('ncd') + count('elder')
  if (preg) chips.push({ k: 'pregnant', label: preg > 1 ? `${preg} pregnant` : 'Pregnant', tone: 'brand' })
  if (nb) chips.push({ k: 'newborn', label: nb > 1 ? `${nb} newborns` : 'Newborn', tone: 'late' })
  if (u5) chips.push({ k: 'under5', label: `${u5} under 5`, tone: 'due' })
  if (ncd) chips.push({ k: 'ncd', label: `${ncd} for NCD`, tone: 'info' })
  // both spellings: the filter chips key off the singular
  return { chips, pregnant: preg, under5: u5, newborn: nb, newborns: nb, ncd }
}

export { monthsOld, weeksPregnant }
