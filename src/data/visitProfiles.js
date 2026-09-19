// Visit profiles: the 6-7 most important questions per visit type.
//
// Two tiers per visit type:
//   registration — asked ONLY on the first visit for a person.
//   weekly       — asked every time, because these parameters change.
//
// The solver already removes anything in REMEMBERED_PATHS from follow-up
// visits. This file goes further: it defines the CORE set of questions per
// visit type, so that even on a first visit the ASHA is not buried in 15-20
// questions. Everything else is either derived or optional.
//
// The keys here are question keys from QUESTION_BANK in canonical.js.

/**
 * FIRST-TIME registration questions — asked only if the person
 * has no previous encounters of this type.
 *
 * These are the identity/registration fields. On a follow-up visit
 * they are already on record and get skipped automatically.
 */
const REGISTRATION = {
  'Pregnancy': [
    'person.name',
    'pregnancy.lmp',         // single answer → derives EDD, gestational weeks, ANC dates, vaccine calendar
    'pregnancy.gravida',
  ],
  'Newborn': [
    'person.name',
    'delivery.date',         // derives day-of-life, visit number, next visit due
    'delivery.place',        // home vs institutional → different HBNC schedule
    'child.name',
    'child.sex',
  ],
  'Child vaccine': [
    'person.name',
    'child.dob',             // derives entire vaccine due-date calendar
  ],
  'Health check': [
    'person.name',
    'person.age',
    'person.sex',
  ],
  'Illness': [
    'person.name',
  ],
  'Household survey': [
    'household.houseNo',
    'household.headName',
    'household.village',
  ],
}

/**
 * WEEKLY / PER-VISIT questions — asked every visit because they change.
 * These are the clinical parameters, danger signs, and services given.
 * Limited to 6-7 per visit type — the most critical ones.
 */
const WEEKLY = {
  'Pregnancy': [
    'vitals.weight',           // weight changes every visit
    'vitals.bp',               // BP → high-risk detection
    'vitals.hb',               // haemoglobin → anaemia
    'tt.dose1Given',           // TT immunisation status
    'ifa.given',               // IFA tablets handed over
    'referral.madeTo',         // referral if needed
  ],
  'Newborn': [
    'newborn.weightToday',     // weight tracking
    'newborn.temperature',     // hypothermia / fever detection
    'newborn.exclusiveBreastfeed',  // breastfeeding check
    'newborn.dangerSigns',     // HBNC danger sign checklist
    'mother.dangerSigns',      // postpartum danger signs
    'mother.postpartumFP',     // FP counselling
  ],
  'Child vaccine': [
    'child.dob',               // needed to compute which vaccines are due
    'imm.dosesGiven',          // which vaccines given today
    'imm.sessionSite',         // where vaccine was given
    'imm.aefi',                // any reaction
    'imm.cardUpdated',         // MCP card filled in
    'referral.madeTo',         // referral if AEFI
  ],
  'Health check': [
    'vitals.weight',           // weight
    'vitals.bp',               // blood pressure
    'ncd.tobacco',             // CBAC Part A: tobacco
    'ncd.waistCm',             // CBAC Part A: waist
    'ncd.physicalActivity',    // CBAC Part A: activity
    'tb.cough2weeks',          // TB screening
    'referral.madeTo',         // referral if score high
  ],
  'Illness': [
    'illness.symptoms',        // what's wrong
    'illness.daysIll',         // how long
    'illness.dangerSigns',     // danger signs → refer
    'vitals.bp',               // basic vitals
    'illness.orsZincGiven',    // treatment given (conditional)
    'illness.malariaTest',     // malaria test (conditional)
    'referral.madeTo',         // referral
  ],
  'Household survey': [
    'household.membersCount',  // how many people
    'household.pregnantWomen', // pregnant women count
    'household.childrenUnder5',// children under 5
    'household.eligibleCouples', // eligible couples
    'household.fpMethod',      // family planning
    'household.birthsSince',   // any birth
    'household.deathsSince',   // any death
  ],
}

/**
 * Get the core question keys for a visit.
 * @param {string} encounterType - e.g. 'Pregnancy', 'Newborn'
 * @param {boolean} isFollowUp - true if this person already has encounters of this type
 * @returns {string[]} question keys to ask
 */
export function coreQuestions(encounterType, isFollowUp = false) {
  const weekly = WEEKLY[encounterType] || []
  if (isFollowUp) return weekly
  const reg = REGISTRATION[encounterType] || []
  return [...reg, ...weekly]
}

/**
 * Get just the weekly questions (things that change per visit).
 */
export function weeklyQuestions(encounterType) {
  return WEEKLY[encounterType] || []
}

/**
 * Get just the registration questions (first-time identity).
 */
export function registrationQuestions(encounterType) {
  return REGISTRATION[encounterType] || []
}

export { REGISTRATION, WEEKLY }
