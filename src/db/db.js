import Dexie from 'dexie'
import { allHouseholds, allMembers, tasks, pastEncounters, earningsHistory, ASHA,
         MEDICINE_KIT, MEDICINE_LOG } from '../data/seed'

export const db = new Dexie('ashaflow')

db.version(1).stores({
  households: 'id, village, houseNo',
  members: 'id, householdId, role',
  encounters: 'id, householdId, memberId, type, createdAt, synced',
  outbox: 'encounterId, queuedAt',
  earnings: 'id, encounterId, date, claimed',
  tasks: 'id, householdId, level',
  meta: 'key',
})

db.version(2).stores({
  households: 'id, village, houseNo',
  members: 'id, householdId, role',
  encounters: 'id, householdId, memberId, type, createdAt, synced',
  outbox: 'encounterId, queuedAt',
  earnings: 'id, encounterId, date, claimed',
  tasks: 'id, householdId, level',
  meta: 'key',
  // a filled government form, and the values learned while filling it
  formSubmissions: 'id, formCode, memberId, householdId, createdAt, synced',
  learnedFacts: 'key, memberId',
})

db.version(3).stores({
  households: 'id, village, houseNo',
  members: 'id, householdId, role',
  encounters: 'id, householdId, memberId, type, createdAt, synced',
  outbox: 'encounterId, queuedAt',
  earnings: 'id, encounterId, date, claimed',
  tasks: 'id, householdId, level',
  meta: 'key',
  formSubmissions: 'id, formCode, memberId, householdId, createdAt, synced',
  learnedFacts: 'key, memberId',
  // a form built from a photographed page, reusable from then on
  customForms: 'code, name, createdAt',
})

db.version(4).stores({
  households: 'id, village, houseNo',
  members: 'id, householdId, role',
  encounters: 'id, householdId, memberId, type, createdAt, synced',
  outbox: 'encounterId, queuedAt',
  earnings: 'id, encounterId, date, claimed',
  tasks: 'id, householdId, level',
  meta: 'key',
  formSubmissions: 'id, formCode, memberId, householdId, createdAt, synced',
  learnedFacts: 'key, memberId',
  customForms: 'code, name, createdAt',
  // which scheme each person is on, recorded at intake or later
  enrolments: 'id, memberId, householdId, scheme',
})

db.version(5).stores({
  households: 'id, village, houseNo',
  members: 'id, householdId, role',
  encounters: 'id, householdId, memberId, type, createdAt, synced',
  outbox: 'encounterId, queuedAt',
  earnings: 'id, encounterId, date, claimed',
  tasks: 'id, householdId, level',
  meta: 'key',
  formSubmissions: 'id, formCode, memberId, householdId, createdAt, synced',
  learnedFacts: 'key, memberId',
  customForms: 'code, name, createdAt',
  enrolments: 'id, memberId, householdId, scheme',
  // the drug kit she carries, and every tablet in or out of it
  medicineKit: 'id, category',
  medicineLog: '++id, medicineId, date',
})

const SEED_VERSION = 5

export async function ensureSeeded() {
  const seeded = await db.meta.get('seeded')
  if (seeded?.version === SEED_VERSION) return
  if (seeded) {                      // seed data changed — replace it, keep field additions
    await Promise.all([db.households.clear(), db.members.clear(),
                       db.tasks.clear(), db.earnings.clear(),
                       db.medicineKit.clear(), db.medicineLog.clear()])
    await db.encounters.where('id').startsWith('e-past-').delete()
  }
  await db.transaction('rw', db.households, db.members, db.tasks, db.encounters, db.earnings,
                       db.medicineKit, db.medicineLog, db.meta, async () => {
    await db.households.bulkPut(allHouseholds)
    await db.members.bulkPut(allMembers)
    await db.tasks.bulkPut(tasks)
    await db.encounters.bulkPut(pastEncounters.map(e => ({
      ...e, createdAt: e.date, synced: 1, facts: e.facts || {}, outputCount: e.outputs,
    })))
    await db.earnings.bulkPut(earningsHistory.map(e => ({ ...e, encounterId: null })))
    await db.medicineKit.bulkPut(MEDICINE_KIT.map(m => ({ ...m })))
    await db.medicineLog.bulkAdd(MEDICINE_LOG.map(l => ({ ...l })))
    await db.meta.put({ key: 'seeded', value: true, version: SEED_VERSION, asha: ASHA })
  })
}

export async function resetAll() {
  await db.delete()
  location.reload()
}

/** Append-only. The id is minted here, on the device, which is what makes
 *  a retry over a flaky connection safe on the server. */
export async function saveEncounter(enc) {
  const id = enc.id || crypto.randomUUID()
  const row = { ...enc, id, createdAt: new Date().toISOString(), synced: 0 }
  await db.encounters.put(row)
  await db.outbox.put({ encounterId: id, queuedAt: Date.now() })
  return row
}

/** A household added in the field. Facts are stored canonically so every
 *  form and every encounter can read them straight away. */
export async function createHousehold(d) {
  const id = 'h' + crypto.randomUUID().slice(0, 8)
  const row = {
    id,
    houseNo: d.houseNo, headName: d.headName, village: d.village,
    hamlet: d.hamlet || '', mobile: d.mobile || '', caste: d.caste || '',
    religion: d.religion || '',
    membersCount: d.membersCount ?? 1,
    bplCard: !!d.bplCard, rationCard: d.rationCard || '',
    // tri-state: null means nobody answered it yet, which is not the same as No
    pmjay: d.pmjay ?? null, bankAccount: d.bankAccount ?? null,
    hasToilet: d.hasToilet ?? null, waterSource: d.waterSource || '',
    cookingFuel: d.cookingFuel || '', houseType: d.houseType || '',
    note: d.note || '',
    createdAt: new Date().toISOString(), addedInField: true,
    facts: {
      'household.houseNo': d.houseNo,
      'household.headName': d.headName,
      'household.village': d.village,
      'household.membersCount': d.membersCount ?? 1,
      'household.bplCard': !!d.bplCard,
      ...(d.hasToilet == null ? {} : { 'household.hasToilet': !!d.hasToilet }),
      ...(d.waterSource ? { 'household.waterSource': d.waterSource } : {}),
      ...(d.hamlet ? { 'household.hamlet': d.hamlet } : {}),
      ...(d.mobile ? { 'household.mobile': Number(d.mobile) } : {}),
      ...(d.caste ? { 'household.caste': d.caste } : {}),
      ...(d.religion ? { 'household.religion': d.religion } : {}),
      ...(d.rationCard ? { 'household.rationCard': d.rationCard } : {}),
      ...(d.cookingFuel ? { 'household.cookingFuel': d.cookingFuel } : {}),
      ...(d.houseType ? { 'household.houseType': d.houseType } : {}),
      ...(d.pmjay == null ? {} : { 'household.pmjay': !!d.pmjay }),
      ...(d.bankAccount == null ? {} : { 'household.bankAccount': !!d.bankAccount }),
    },
  }
  await db.households.put(row)
  return row
}

/** Put a person on a scheme. One row per person per scheme. */
export async function createEnrolment({ memberId, householdId, scheme, label, phase, state = 'active' }) {
  const id = 'en' + crypto.randomUUID().slice(0, 8)
  const row = {
    id, memberId, householdId, scheme, label: label || scheme,
    phase: phase || 'Newly enrolled', state,
    updated: new Date().toISOString(), addedInField: true,
  }
  await db.enrolments.put(row)
  return row
}

export async function enrolmentsFor(memberIds = []) {
  if (!memberIds.length) return []
  return db.enrolments.where('memberId').anyOf(memberIds).toArray()
}

export async function createMember(d) {
  const id = 'm' + crypto.randomUUID().slice(0, 8)
  const row = {
    id, householdId: d.householdId, name: d.name, age: Number(d.age),
    sex: d.sex, role: d.role,
    ...(d.lmp ? { lmp: d.lmp } : {}),
    ...(d.dob ? { dob: d.dob } : {}),
    ...(d.relation ? { relation: d.relation } : {}),
    ...(d.mobile ? { mobile: String(d.mobile) } : {}),
    createdAt: new Date().toISOString(), addedInField: true,
  }
  await db.members.put(row)

  // anything typed here should never be asked again by a form
  const learn = {}
  if (d.husbandName) learn['person.husbandName'] = d.husbandName
  if (d.mobile) learn['person.mobile'] = Number(d.mobile)
  if (d.caste) learn['person.caste'] = d.caste
  if (Object.keys(learn).length) await saveLearned(id, learn)

  // keep the household's member count honest
  const siblings = await db.members.where('householdId').equals(d.householdId).count()
  const hh = await db.households.get(d.householdId)
  if (hh && siblings > (hh.membersCount || 0)) {
    await db.households.update(d.householdId, {
      membersCount: siblings,
      facts: { ...(hh.facts || {}), 'household.membersCount': siblings },
    })
  }
  return row
}

/** Save a form read off a paper page so it can be used again and again. */
export async function saveCustomForm(form) {
  const code = form.code || 'SCAN-' + Date.now().toString(36).toUpperCase().slice(-6)
  const row = {
    ...form, code,
    createdAt: new Date().toISOString(),
    source: form.source || 'scan',
    version: form.version || 1,
  }
  await db.customForms.put(row)
  return row
}

export const listCustomForms = () => db.customForms.toArray()
export const getCustomForm = code => db.customForms.get(code)
export const deleteCustomForm = code => db.customForms.delete(code)

/** Values a human typed into a form, kept so no later form asks again. */
export async function getLearned(memberId) {
  const rows = await db.learnedFacts.where('memberId').equals(memberId).toArray()
  return Object.fromEntries(rows.map(r => [r.path, r.value]))
}

export async function saveLearned(memberId, answers) {
  const rows = Object.entries(answers)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([path, value]) => ({ key: `${memberId}:${path}`, memberId, path, value, at: Date.now() }))
  if (rows.length) await db.learnedFacts.bulkPut(rows)
  return rows.length
}

export async function saveFormSubmission(row) {
  const id = row.id || crypto.randomUUID()
  const full = { ...row, id, createdAt: new Date().toISOString(), synced: 0 }
  await db.formSubmissions.put(full)
  await db.outbox.put({ encounterId: id, queuedAt: Date.now() })
  return full
}

export async function listSubmissions() {
  const rows = await db.formSubmissions.toArray()
  return rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export async function queueSize() {
  return db.outbox.count()
}

/** Simulated sync. Real version POSTs the batch to /api/sync/batch. */
export async function syncNow() {
  const pending = await db.outbox.toArray()
  for (const p of pending) {
    await db.encounters.update(p.encounterId, { synced: 1 })
    await db.outbox.delete(p.encounterId)
  }
  await db.meta.put({ key: 'lastSync', value: new Date().toISOString() })
  return pending.length
}
