// ASHA incentive activity codes. Amounts vary by state and revision — they live
// here as data so a state configuration can replace them without a code change.
// Verify against the current NHM ASHA incentive package before any real use.
//
// `visit` scopes an activity to the encounter types it can arise from, so the
// earnings screen never claims a newborn incentive off an NCD screening.
export const ACTIVITIES = [
  /* maternal */
  { code: 'ANC-REG',   visit: ['Pregnancy'], label: 'Early ANC registration',           amount: 300, when: f => !!f['pregnancy.lmp'] },
  { code: 'ANC-VISIT', visit: ['Pregnancy'], label: 'Antenatal home visit',             amount: 100, when: () => true },
  { code: 'TT-DOSE',   visit: ['Pregnancy'], label: 'Accompanied TT/Td immunisation',   amount: 50,  when: f => !!f['tt.dose1Given'] },
  { code: 'IFA-DIST',  visit: ['Pregnancy'], label: 'IFA tablet distribution',          amount: 50,  when: f => !!f['ifa.given'] },
  { code: 'HRP-ID',    visit: ['Pregnancy'], label: 'High-risk pregnancy identified',   amount: 200, when: f => !!f['pregnancy.isHighRisk'] },

  /* newborn — HBNC */
  { code: 'HBNC-VISIT',visit: ['Newborn'],   label: 'HBNC home visit completed',        amount: 250, when: f => f['newborn.visitNumber'] !== undefined },
  { code: 'JSY-ESC',   visit: ['Newborn'],   label: 'JSY escort for institutional delivery', amount: 600, when: f => !!f['delivery.jsyEligible'] },
  { code: 'LBW-CARE',  visit: ['Newborn'],   label: 'Low birth weight newborn followed up',  amount: 200, when: f => !!f['child.lowBirthWeight'] },
  { code: 'SEPSIS-REF',visit: ['Newborn'],   label: 'Sick newborn referred',            amount: 250, when: f => !!f['newborn.referred'] },
  { code: 'PPFP',      visit: ['Newborn'],   label: 'Postpartum family planning counselling', amount: 100, when: f => !!f['mother.postpartumFP'] },

  /* immunisation */
  { code: 'IMM-SESSION',visit: ['Child vaccine'], label: 'Child brought for immunisation', amount: 150, when: f => (f['imm.doseCount'] || 0) > 0 },
  { code: 'IMM-FULL',  visit: ['Child vaccine'], label: 'Milestone completed on time',   amount: 100, when: f => f['imm.upToDate'] === true },
  { code: 'AEFI-RPT',  visit: ['Child vaccine'], label: 'Adverse event reported',        amount: 50,  when: f => !!f['imm.aefi'] },

  /* NCD */
  { code: 'NCD-CBAC',  visit: ['Health check'], label: 'CBAC checklist completed',       amount: 75,
    when: f => f['ncd.cbacScore'] !== undefined && f['person.age'] >= 30 },
  { code: 'NCD-REF',   visit: ['Health check'], label: 'Referred for NCD screening',     amount: 50,  when: f => !!f['ncd.screenRequired'] },
  { code: 'CANCER-REF',visit: ['Health check'], label: 'Suspected cancer referred',      amount: 200,
    when: f => !!f['ncd.suspectedOral'] || !!f['ncd.suspectedBreastCervical'] },
  { code: 'LEP-REF',   visit: ['Health check'], label: 'Suspected leprosy referred',     amount: 200, when: f => !!f['ncd.suspectedLeprosy'] },

  /* illness and surveillance */
  { code: 'ORS-ZINC',  visit: ['Illness'],   label: 'Diarrhoea treated with ORS and zinc', amount: 50, when: f => !!f['illness.orsZincGiven'] },
  { code: 'FEVER-CASE',visit: ['Illness'],   label: 'Fever case reported for surveillance', amount: 50,
    when: f => (f['illness.symptoms'] || []).includes('fever') },
  { code: 'MAL-POS',   visit: ['Illness'],   label: 'Malaria positive case managed',     amount: 100, when: f => f['illness.malariaTest'] === 'positive' },
  { code: 'SICK-REF',  visit: ['Illness'],   label: 'Sick child or adult referred',      amount: 100, when: f => !!f['illness.referred'] },

  /* survey */
  { code: 'HH-SURVEY', visit: ['Household survey'], label: 'Household register updated', amount: 100, when: f => !!f['household.surveyedOn'] },
  { code: 'FP-COUNSEL',visit: ['Household survey'], label: 'Family planning counselling', amount: 50, when: f => !!f['household.unmetNeed'] },

  /* any visit */
  { code: 'TB-REF',    label: 'Presumptive TB referral',      amount: 150, when: f => !!f['tb.referred'] },
]

export function earnedFor(facts) {
  const type = facts.__encounterType
  return ACTIVITIES
    .filter(a => !a.visit || !type || a.visit.includes(type))
    .filter(a => { try { return a.when(facts) } catch { return false } })
    .map(a => ({ code: a.code, label: a.label, amount: a.amount }))
}

export const totalOf = items => items.reduce((n, i) => n + i.amount, 0)
