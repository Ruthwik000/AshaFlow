// Deterministic rules. No AI, no network. This file is why one answer becomes
// eighteen fields, and why the whole thing works with the phone in aeroplane mode.
//
// A rule may declare `only: ['Pregnancy', ...]` to restrict itself to certain
// encounter types. The solver and the mapper both respect it, so a Newborn visit
// never claims it can "derive" a pregnancy field it has no input for.

const DAY = 86400000
const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY)
const addWeeks = (d, n) => addDays(d, n * 7)
const iso = d => new Date(d).toISOString().slice(0, 10)
const weeksBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / (7 * DAY))
const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / DAY)
const arr = v => (Array.isArray(v) ? v : v == null ? [] : [v])
const hasAny = (v, ...keys) => arr(v).some(x => keys.includes(x))
const realSigns = v => arr(v).filter(x => x !== 'none')

// National Immunization Schedule, Universal Immunization Programme.
// Source: NHM / UNICEF India national immunization schedule.
export const NIS_SCHEDULE = [
  { code: 'BCG',    name: 'BCG',                weeks: 0,   milestone: 'At birth' },
  { code: 'OPV0',   name: 'OPV-0',              weeks: 0,   milestone: 'At birth' },
  { code: 'HEPB0',  name: 'Hepatitis B birth dose', weeks: 0, milestone: 'At birth' },
  { code: 'PENTA1', name: 'Penta-1',            weeks: 6,   milestone: '6 weeks' },
  { code: 'OPV1',   name: 'OPV-1',              weeks: 6,   milestone: '6 weeks' },
  { code: 'RVV1',   name: 'Rotavirus-1',        weeks: 6,   milestone: '6 weeks' },
  { code: 'FIPV1',  name: 'fIPV-1',             weeks: 6,   milestone: '6 weeks' },
  { code: 'PCV1',   name: 'PCV-1',              weeks: 6,   milestone: '6 weeks' },
  { code: 'PENTA2', name: 'Penta-2',            weeks: 10,  milestone: '10 weeks' },
  { code: 'OPV2',   name: 'OPV-2',              weeks: 10,  milestone: '10 weeks' },
  { code: 'RVV2',   name: 'Rotavirus-2',        weeks: 10,  milestone: '10 weeks' },
  { code: 'PENTA3', name: 'Penta-3',            weeks: 14,  milestone: '14 weeks' },
  { code: 'OPV3',   name: 'OPV-3',              weeks: 14,  milestone: '14 weeks' },
  { code: 'RVV3',   name: 'Rotavirus-3',        weeks: 14,  milestone: '14 weeks' },
  { code: 'FIPV2',  name: 'fIPV-2',             weeks: 14,  milestone: '14 weeks' },
  { code: 'PCV2',   name: 'PCV-2',              weeks: 14,  milestone: '14 weeks' },
  { code: 'MR1',    name: 'Measles-Rubella 1',  weeks: 39,  milestone: '9 to 12 months' },
  { code: 'JE1',    name: 'JE-1',               weeks: 39,  milestone: '9 to 12 months' },
  { code: 'PCVB',   name: 'PCV booster',        weeks: 39,  milestone: '9 to 12 months' },
  { code: 'FIPV3',  name: 'fIPV-3',             weeks: 39,  milestone: '9 to 12 months' },
  { code: 'VITA1',  name: 'Vitamin A, 1st dose', weeks: 39, milestone: '9 to 12 months' },
  { code: 'DPTB1',  name: 'DPT booster-1',      weeks: 70,  milestone: '16 to 24 months' },
  { code: 'OPVB',   name: 'OPV booster',        weeks: 70,  milestone: '16 to 24 months' },
  { code: 'MR2',    name: 'Measles-Rubella 2',  weeks: 70,  milestone: '16 to 24 months' },
  { code: 'JE2',    name: 'JE-2',               weeks: 70,  milestone: '16 to 24 months' },
  { code: 'DPTB2',  name: 'DPT booster-2',      weeks: 260, milestone: '5 to 6 years' },
]

/** The vaccines a child of this date of birth is at, by the national schedule. */
export function dueVaccines(dob, today = new Date()) {
  if (!dob) return NIS_SCHEDULE.filter(v => v.weeks === 0)
  const age = Math.max(0, weeksBetween(dob, today))
  const eligible = NIS_SCHEDULE.filter(v => v.weeks <= age)
  if (eligible.length === 0) return NIS_SCHEDULE.filter(v => v.weeks === 0)
  const at = Math.max(...eligible.map(v => v.weeks))
  return eligible.filter(v => v.weeks === at)
}

/** The next milestone after today, used for the reminder the mother is given. */
export function nextVaccineDue(dob, today = new Date()) {
  if (!dob) return null
  const age = Math.max(0, weeksBetween(dob, today))
  const ahead = NIS_SCHEDULE.filter(v => v.weeks > age)
  if (ahead.length === 0) return null
  const at = Math.min(...ahead.map(v => v.weeks))
  return { milestone: NIS_SCHEDULE.find(v => v.weeks === at).milestone,
           date: iso(addWeeks(dob, at)),
           names: NIS_SCHEDULE.filter(v => v.weeks === at).map(v => v.name) }
}

// The first-year projection used while she is still pregnant. Kept separate
// from NIS_SCHEDULE because U-WIN wants named due-date fields, not a list.
export const NIS = [
  { key: 'child.bcgDue',    name: 'BCG',       weeks: 0 },
  { key: 'child.opv0Due',   name: 'OPV-0',     weeks: 0 },
  { key: 'child.penta1Due', name: 'Penta-1',   weeks: 6 },
  { key: 'child.penta2Due', name: 'Penta-2',   weeks: 10 },
  { key: 'child.penta3Due', name: 'Penta-3',   weeks: 14 },
  { key: 'child.mr1Due',    name: 'MR-1',      weeks: 39 },
  { key: 'child.vitA1Due',  name: 'Vitamin A', weeks: 39 },
]

// HBNC visit schedule. Source: Home Based Newborn Care operational guidelines.
export const HBNC_HOME = [1, 3, 7, 14, 21, 28, 42]
export const HBNC_INSTITUTIONAL = [3, 7, 14, 21, 28, 42]

// Each rule: what it produces, what it needs, and how it is computed.
// `why` is shown to the user in the provenance view.
export const DERIVATIONS = [
  /* ------------------------------------------------------------- pregnancy */
  { out: 'pregnancy.edd', needs: ['pregnancy.lmp'],
    why: 'LMP + 280 days (Naegele’s rule)',
    fn: f => iso(addDays(f['pregnancy.lmp'], 280)) },

  { out: 'pregnancy.gestWeeks', needs: ['pregnancy.lmp'],
    why: 'Weeks between LMP and today',
    fn: f => Math.max(0, weeksBetween(f['pregnancy.lmp'], new Date())) },

  { out: 'pregnancy.registeredOn', needs: [], only: ['Pregnancy'],
    why: 'Date this encounter was captured',
    fn: () => iso(new Date()) },

  { out: 'pregnancy.rchId', needs: ['household.village', 'person.name'],
    why: 'Generated locally from village code and sequence (demo only)',
    fn: f => 'RCH-' + String(f['household.village'] || 'XX').slice(0, 3).toUpperCase()
             + '-' + String(Math.abs(hash(f['person.name'] || '')) % 100000).padStart(5, '0') },

  { out: 'anc.visit1Due', needs: ['pregnancy.lmp'], why: 'LMP + 12 weeks',
    fn: f => iso(addWeeks(f['pregnancy.lmp'], 12)) },
  { out: 'anc.visit2Due', needs: ['pregnancy.lmp'], why: 'LMP + 26 weeks',
    fn: f => iso(addWeeks(f['pregnancy.lmp'], 26)) },
  { out: 'anc.visit3Due', needs: ['pregnancy.lmp'], why: 'LMP + 32 weeks',
    fn: f => iso(addWeeks(f['pregnancy.lmp'], 32)) },
  { out: 'anc.visit4Due', needs: ['pregnancy.lmp'], why: 'LMP + 36 weeks',
    fn: f => iso(addWeeks(f['pregnancy.lmp'], 36)) },

  { out: 'anc.visitsDone', needs: ['pregnancy.gestWeeks'],
    why: 'Count of ANC windows already passed',
    fn: f => [12, 26, 32, 36].filter(w => f['pregnancy.gestWeeks'] >= w).length },

  { out: 'person.sex', needs: [], only: ['Pregnancy'],
    why: 'A pregnancy encounter is recorded for a woman',
    fn: () => 'F' },

  { out: 'pregnancy.isHighRisk', needs: ['person.age'], only: ['Pregnancy'],
    why: 'Age under 19 or over 35, height under 145 cm, previous caesarean, Hb under 7, or BP 140/90 and above',
    fn: f => riskReasons(f).length > 0 },

  { out: 'tt.dose2Due', needs: ['tt.dose1Given', 'visit.date'],
    why: 'Dose 1 date + 28 days',
    fn: f => f['tt.dose1Given'] ? iso(addDays(f['visit.date'], 28)) : '—' },

  { out: 'ifa.tablets', needs: ['ifa.given'],
    why: 'Standard antenatal issue of 180 tablets',
    fn: f => (f['ifa.given'] ? 180 : 0) },

  { out: 'vitals.bmi', needs: ['vitals.weight', 'vitals.height'],
    why: 'Weight in kg divided by height in metres squared',
    fn: f => Math.round((f['vitals.weight'] / Math.pow(f['vitals.height'] / 100, 2)) * 10) / 10 },

  /* --------------------------------------- the child: actual or expected DOB */
  { out: 'child.dob', needs: ['delivery.date'], only: ['Newborn'],
    why: 'The baby was born on the delivery date',
    fn: f => f['delivery.date'] },

  { out: 'child.expectedDob', needs: ['pregnancy.edd'], why: 'Same as EDD',
    fn: f => f['pregnancy.edd'] },

  // Two rules, one output. The actual date of birth is listed first, so it wins
  // whenever it exists and the expected date is only a fallback.
  { out: 'child.dobOrExpected', needs: ['child.dob'], only: ['Newborn', 'Child vaccine'],
    why: 'Actual date of birth',
    fn: f => f['child.dob'] },
  { out: 'child.dobOrExpected', needs: ['child.expectedDob'], only: ['Pregnancy'],
    why: 'Expected date of birth, until the baby is born',
    fn: f => f['child.expectedDob'] },

  ...NIS.map(v => ({
    out: v.key, needs: ['child.dobOrExpected'],
    why: `${v.name}: date of birth + ${v.weeks} weeks (National Immunization Schedule)`,
    fn: f => iso(addWeeks(f['child.dobOrExpected'], v.weeks)),
  })),

  { out: 'child.ageDays', needs: ['child.dob'], why: 'Days between date of birth and today',
    fn: f => Math.max(0, daysBetween(f['child.dob'], new Date())) },
  { out: 'child.ageMonths', needs: ['child.ageDays'], why: 'Age in days divided by 30.4',
    fn: f => Math.floor(f['child.ageDays'] / 30.4) },
  { out: 'child.lowBirthWeight', needs: ['child.birthWeight'],
    why: 'Birth weight under 2.5 kg is low birth weight',
    fn: f => f['child.birthWeight'] < 2.5 },

  /* ------------------------------------------------------- HBNC / newborn */
  { out: 'delivery.institutional', needs: ['delivery.place'],
    why: 'Anywhere other than home counts as an institutional delivery',
    fn: f => f['delivery.place'] !== 'home' },

  { out: 'delivery.jsyEligible', needs: ['delivery.institutional'],
    why: 'JSY is paid for a delivery in a government or accredited facility',
    fn: f => f['delivery.institutional'] === true && f['delivery.place'] !== 'private' },

  { out: 'newborn.visitDay', needs: ['child.ageDays'],
    why: 'Day of life on the day of this visit',
    fn: f => f['child.ageDays'] },

  { out: 'newborn.visitNumber', needs: ['newborn.visitDay', 'delivery.institutional'],
    why: 'Position in the HBNC schedule: days 1, 3, 7, 14, 21, 28, 42 for a home delivery, without day 1 for an institutional one',
    fn: f => {
      const sched = f['delivery.institutional'] ? HBNC_INSTITUTIONAL : HBNC_HOME
      const n = sched.filter(d => d <= f['newborn.visitDay']).length
      return Math.max(1, n)
    } },

  { out: 'newborn.nextVisitDue', needs: ['newborn.visitDay', 'child.dob', 'delivery.institutional'],
    why: 'Next day in the HBNC schedule after today',
    fn: f => {
      const sched = f['delivery.institutional'] ? HBNC_INSTITUTIONAL : HBNC_HOME
      const next = sched.find(d => d > f['newborn.visitDay'])
      return next ? iso(addDays(f['child.dob'], next)) : 'Schedule complete'
    } },

  { out: 'newborn.sepsisSuspected', needs: ['newborn.dangerSigns'],
    why: 'Any HBNC sepsis sign: not feeding, fast breathing, chest indrawing, cold to touch, very hot, no movement or fits, or pus at the cord',
    fn: f => hasAny(f['newborn.dangerSigns'], 'notFeeding', 'fastBreathing',
      'chestIndrawing', 'cold', 'fever', 'noMovement', 'cordPus') },

  { out: 'newborn.referred', needs: ['newborn.dangerSigns'],
    why: 'Any newborn danger sign on the HBNC card means refer the same day',
    fn: f => realSigns(f['newborn.dangerSigns']).length > 0 },

  { out: 'mother.referred', needs: ['mother.dangerSigns'],
    why: 'Any maternal danger sign on the HBNC card means refer the same day',
    fn: f => realSigns(f['mother.dangerSigns']).length > 0 },

  /* ------------------------------------------------------- immunisation */
  { out: 'imm.dueList', needs: ['child.dob'],
    why: 'Vaccines at the current national-schedule milestone for this date of birth',
    fn: f => dueVaccines(f['child.dob']).map(v => v.name).join(', ') },

  { out: 'imm.doseCount', needs: ['imm.dosesGiven'],
    why: 'Number of vaccines ticked as given at this session',
    fn: f => realSigns(f['imm.dosesGiven']).length },

  { out: 'imm.nextDue', needs: ['child.dob'],
    why: 'Next milestone in the National Immunization Schedule',
    fn: f => {
      const n = nextVaccineDue(f['child.dob'])
      return n ? `${n.date} — ${n.names.join(', ')}` : 'Schedule complete'
    } },

  { out: 'imm.upToDate', needs: ['imm.doseCount', 'child.dob'],
    why: 'Everything due at this milestone was given today',
    fn: f => f['imm.doseCount'] >= dueVaccines(f['child.dob']).length },

  /* -------------------------------------------------------- CBAC scoring */
  { out: 'ncd.age40plus', needs: ['person.age'], why: 'Age is 40 or above',
    fn: f => f['person.age'] >= 40 },

  { out: 'ncd.cbacScore', needs: ['person.age'],
    why: 'CBAC Part A: age band 0-2, tobacco 0-2, daily alcohol 0-1, waist 0-2 by sex, inactivity 0-1, family history 0 or 2. Maximum 10.',
    fn: f => cbac(f) },

  { out: 'ncd.screenRequired', needs: ['ncd.cbacScore'],
    why: 'A CBAC score of 4 or more is referred for screening',
    fn: f => f['ncd.cbacScore'] >= 4 },

  { out: 'ncd.suspectedOral', needs: ['ncd.oralSymptoms'],
    why: 'CBAC Part B oral cavity: ulcer, patch, growth, change of voice or difficulty opening the mouth',
    fn: f => realSigns(f['ncd.oralSymptoms']).length > 0 },

  { out: 'ncd.suspectedLeprosy', needs: ['ncd.skinSymptoms'],
    why: 'CBAC Part B: a skin patch with loss of sensation, or weakness of grip',
    fn: f => hasAny(f['ncd.skinSymptoms'], 'numb', 'grip', 'feet') },

  { out: 'ncd.suspectedBreastCervical', needs: ['ncd.womenSymptoms'],
    why: 'CBAC Part B breast and cervical section: any positive answer',
    fn: f => realSigns(f['ncd.womenSymptoms']).length > 0 },

  { out: 'ncd.mentalHealthFlag', needs: ['ncd.otherSymptoms'],
    why: 'Low mood or loss of interest is followed up under the mental health programme',
    fn: f => hasAny(f['ncd.otherSymptoms'], 'lowMood', 'sleep') },

  { out: 'ncd.partBPositive', needs: ['ncd.oralSymptoms'],
    why: 'Any Part B early-detection symptom was recorded',
    fn: f => realSigns(f['ncd.oralSymptoms']).length > 0
          || realSigns(f['ncd.skinSymptoms']).length > 0
          || realSigns(f['ncd.womenSymptoms']).length > 0
          || realSigns(f['ncd.otherSymptoms']).length > 0
          || f['tb.cough2weeks'] === true },

  /* ---------------------------------------------------------------- TB */
  { out: 'tb.symptomatic', needs: ['tb.cough2weeks'],
    why: 'Cough over 2 weeks is a presumptive TB sign',
    fn: f => !!f['tb.cough2weeks'] || hasAny(f['tb.symptoms'], 'blood', 'fever2w', 'weightLoss', 'nightSweats') },

  { out: 'tb.referred', needs: ['tb.symptomatic'],
    why: 'Presumptive cases are referred for sputum testing',
    fn: f => !!f['tb.symptomatic'] },

  /* ------------------------------------------------------------- illness */
  { out: 'illness.syndrome', needs: ['illness.symptoms'],
    why: 'IDSP syndromic category: acute diarrhoeal disease, acute respiratory illness, or fever of unknown origin',
    fn: f => {
      const s = arr(f['illness.symptoms'])
      if (s.includes('diarrhoea')) return 'Acute diarrhoeal disease'
      if (s.includes('cough') || s.includes('breathless')) return 'Acute respiratory illness'
      if (s.includes('fever')) return 'Fever of unknown origin'
      return 'Other'
    } },

  { out: 'illness.referred', needs: ['illness.dangerSigns'],
    why: 'Any IMNCI danger sign means refer to the facility the same day',
    fn: f => realSigns(f['illness.dangerSigns']).length > 0 },

  /* --------------------------------------------------- household survey */
  { out: 'household.surveyedOn', needs: [], only: ['Household survey'],
    why: 'Date the register row was updated', fn: () => iso(new Date()) },

  { out: 'household.unmetNeed', needs: ['household.fpMethod', 'household.eligibleCouples'],
    why: 'An eligible couple using no method is an unmet need for contraception',
    fn: f => f['household.eligibleCouples'] > 0 && f['household.fpMethod'] === 'none' },

  /* ------------------------------------------- referral, across all types */
  { out: 'referral.any', needs: ['referral.madeTo'],
    why: 'A facility was named on the referral slip',
    fn: f => f['referral.madeTo'] !== 'none' },

  /* ------------------------------------------- HMIS monthly aggregation */
  { out: 'hmis.reportMonth', needs: [], why: 'Current reporting month',
    fn: () => new Date().toISOString().slice(0, 7) },

  { out: 'hmis.ancNewRegistrations', needs: ['pregnancy.registeredOn'],
    why: 'This encounter contributes 1 to the monthly count', fn: () => 1 },
  { out: 'hmis.ttDosesGiven', needs: ['tt.dose1Given'], why: 'Counted if a dose was given today',
    fn: f => (f['tt.dose1Given'] ? 1 : 0) },
  { out: 'hmis.ifaDistributed', needs: ['ifa.tablets'], why: 'Tablets handed over in this visit',
    fn: f => f['ifa.tablets'] || 0 },
  { out: 'hmis.hrpIdentified', needs: ['pregnancy.isHighRisk'], why: 'Counted if flagged high risk',
    fn: f => (f['pregnancy.isHighRisk'] ? 1 : 0) },

  { out: 'hmis.hbncVisits', needs: ['newborn.visitNumber'], why: 'One HBNC home visit made',
    fn: () => 1 },
  { out: 'hmis.newbornsWeighed', needs: ['newborn.weightToday'], why: 'Newborn weighed at this visit',
    fn: () => 1 },
  { out: 'hmis.lbwNewborns', needs: ['child.lowBirthWeight'], why: 'Counted if birth weight is under 2.5 kg',
    fn: f => (f['child.lowBirthWeight'] ? 1 : 0) },
  { out: 'hmis.institutionalDeliveries', needs: ['delivery.institutional'],
    why: 'Counted if the delivery was in a facility',
    fn: f => (f['delivery.institutional'] ? 1 : 0) },

  { out: 'hmis.immunisationDoses', needs: ['imm.doseCount'], why: 'Doses ticked as given today',
    fn: f => f['imm.doseCount'] || 0 },
  { out: 'hmis.aefiReported', needs: ['imm.aefi'], why: 'Counted if a reaction was reported',
    fn: f => (f['imm.aefi'] ? 1 : 0) },

  { out: 'hmis.cbacFilled', needs: ['ncd.cbacScore'], why: 'One CBAC checklist completed',
    fn: () => 1 },
  { out: 'hmis.ncdReferred', needs: ['ncd.screenRequired'], why: 'Counted if referred for NCD screening',
    fn: f => (f['ncd.screenRequired'] ? 1 : 0) },

  { out: 'hmis.feverCases', needs: ['illness.symptoms'], why: 'Counted if fever was one of the symptoms',
    fn: f => (arr(f['illness.symptoms']).includes('fever') ? 1 : 0) },
  { out: 'hmis.diarrhoeaOrs', needs: ['illness.orsZincGiven'], why: 'Diarrhoea case given ORS and zinc',
    fn: f => (f['illness.orsZincGiven'] ? 1 : 0) },
  { out: 'hmis.ariCases', needs: ['illness.syndrome'], why: 'Counted if the syndrome was respiratory',
    fn: f => (f['illness.syndrome'] === 'Acute respiratory illness' ? 1 : 0) },
  { out: 'hmis.malariaPositive', needs: ['illness.malariaTest'], why: 'Counted if the rapid test was positive',
    fn: f => (f['illness.malariaTest'] === 'positive' ? 1 : 0) },

  { out: 'hmis.householdsSurveyed', needs: ['household.surveyedOn'], why: 'One household register row updated',
    fn: () => 1 },

  /* ----------------------------------------------------------- the visit */
  { out: 'visit.date', needs: [], why: 'Today', fn: () => iso(new Date()) },
  { out: 'visit.ashaId', needs: [], why: 'Logged-in ASHA code', fn: () => 'ASHA-RMP-014' },
  { out: 'visit.type', needs: [], why: 'Encounter type chosen at the start',
    fn: f => f.__encounterType || 'Pregnancy' },
]

export function riskReasons(f) {
  const r = []
  if (f['person.age'] != null && f['person.age'] < 19) r.push('Age under 19')
  if (f['person.age'] != null && f['person.age'] > 35) r.push('Age over 35')
  if (f['vitals.height'] != null && f['vitals.height'] < 145) r.push('Height under 145 cm')
  if (f['pregnancy.prevCesarean']) r.push('Previous caesarean')
  if (f['vitals.hb'] != null && f['vitals.hb'] < 7) r.push('Severe anaemia (Hb under 7)')
  if (f['vitals.bpSys'] >= 140 || f['vitals.bpDia'] >= 90) r.push('Raised blood pressure')
  return r
}

/** CBAC Part A, scored as printed on the checklist. Maximum 10. */
function cbac(f) {
  let s = 0
  const age = f['person.age'] || 0
  if (age >= 50) s += 2; else if (age >= 40) s += 1

  const t = f['ncd.tobacco']
  if (t === 'daily') s += 2; else if (t === 'past') s += 1
  else if (t === true) s += 2            // tolerate the old yes/no shape

  if (f['ncd.alcohol']) s += 1

  const w = f['ncd.waistCm']
  const male = f['person.sex'] === 'M'
  if (w != null) {
    const band = male ? [90, 100] : [80, 90]
    if (w > band[1]) s += 2; else if (w > band[0]) s += 1
  }

  if (f['ncd.physicalActivity'] === false) s += 1
  if (f['ncd.familyHistory']) s += 2
  return s
}

function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0 }
  return h
}

export const helpers = { addDays, addWeeks, iso, weeksBetween, daysBetween }
