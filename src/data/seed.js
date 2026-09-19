// Synthetic demonstration data. No real person's health information.
/* Local calendar date, not UTC. toISOString() rolls the day backwards for
   anyone east of Greenwich, which made a task seeded "11 days ago" read as
   12 days overdue on an Indian phone. */
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const ago = n => iso(new Date(Date.now() - n * 86400000))
const ahead = n => iso(new Date(Date.now() + n * 86400000))

export const ASHA = { id: 'ASHA-RMP-014', name: 'Sunita Yadav', village: 'Rampur', pin: '1234',
                      email: 'sunita.yadav@ashaflow.demo' }

export const households = [
  {
    id: 'h14', houseNo: '14', headName: 'Ramesh Kumar', village: 'Rampur', membersCount: 4,
    bplCard: true, hasToilet: true, waterSource: 'handpump', lat: 26.85, lng: 82.19,
    facts: {
      'household.houseNo': '14', 'household.headName': 'Ramesh Kumar',
      'household.village': 'Rampur', 'household.membersCount': 4,
      'household.bplCard': true, 'household.hasToilet': true,
      'household.waterSource': 'handpump', 'person.husbandName': 'Ramesh Kumar',
      'person.caste': 'OBC', 'person.aadhaarLast4': 4821,
      'person.mobile': 9876543210, 'person.abhaId': '12-3456-7890-1234',
    },
  },
  {
    id: 'h22', houseNo: '22', headName: 'Mohan Lal', village: 'Rampur', membersCount: 6,
    bplCard: false, hasToilet: false, waterSource: 'well', lat: 26.86, lng: 82.20,
    facts: {
      'household.houseNo': '22', 'household.headName': 'Mohan Lal',
      'household.village': 'Rampur', 'household.membersCount': 6,
      'household.bplCard': false, 'household.hasToilet': false,
      'household.waterSource': 'well', 'person.husbandName': 'Mohan Lal',
      'person.caste': 'SC', 'person.aadhaarLast4': 1190,
      'person.mobile': 9812233445, 'person.abhaId': '12-9911-2233-4455',
    },
  },
  {
    id: 'h07', houseNo: '7', headName: 'Shiv Prasad', village: 'Rampur', membersCount: 5,
    bplCard: true, hasToilet: true, waterSource: 'tap', lat: 26.84, lng: 82.18,
    facts: {
      'household.houseNo': '7', 'household.headName': 'Shiv Prasad',
      'household.village': 'Rampur', 'household.membersCount': 5,
      'household.bplCard': true, 'household.hasToilet': true,
      'household.waterSource': 'tap', 'person.husbandName': 'Shiv Prasad',
      'person.caste': 'OBC', 'person.aadhaarLast4': 7734,
      'person.mobile': 9700112233, 'person.abhaId': '12-7788-9900-1122',
    },
  },
  {
    id: 'h31', houseNo: '31', headName: 'Kailash Verma', village: 'Kishanpur', membersCount: 3,
    bplCard: false, hasToilet: true, waterSource: 'tap', lat: 26.90, lng: 82.24,
    facts: {
      'household.houseNo': '31', 'household.headName': 'Kailash Verma',
      'household.village': 'Kishanpur', 'household.membersCount': 3,
      'household.bplCard': false, 'household.hasToilet': true,
      'household.waterSource': 'tap', 'person.husbandName': 'Kailash Verma',
      'person.caste': 'GEN', 'person.aadhaarLast4': 3312,
      'person.mobile': 9555667788, 'person.abhaId': '12-3311-4455-6677',
    },
  },
]

export const members = [
  { id: 'm1', householdId: 'h14', name: 'Sunita Devi',  age: 24, sex: 'F', role: 'pregnant', lmp: ago(154) },
  { id: 'm2', householdId: 'h14', name: 'Ramesh Kumar', age: 28, sex: 'M', role: 'adult' },
  { id: 'm3', householdId: 'h14', name: 'Chotu',        age: 2,  sex: 'M', role: 'child' },
  { id: 'm4', householdId: 'h14', name: 'Kamla Devi',   age: 58, sex: 'F', role: 'elder' },
  { id: 'm5', householdId: 'h22', name: 'Rekha Kumari', age: 26, sex: 'F', role: 'mother' },
  { id: 'm6', householdId: 'h22', name: 'Aarav',        age: 0,  sex: 'M', role: 'infant', dob: ago(92) },
  { id: 'm7', householdId: 'h22', name: 'Mohan Lal',    age: 31, sex: 'M', role: 'adult' },
  { id: 'm8', householdId: 'h07', name: 'Meena Kumari', age: 34, sex: 'F', role: 'adult' },
  { id: 'm9', householdId: 'h07', name: 'Shiv Prasad',  age: 41, sex: 'M', role: 'adult' },
  { id: 'm10', householdId: 'h31', name: 'Pooja Verma', age: 22, sex: 'F', role: 'pregnant', lmp: ago(65) },
]

export const tasks = [
  { id: 't1', householdId: 'h14', memberId: 'm1', title: 'Sunita Devi', house: 'House 14',
    reason: 'ANC-2 overdue by 11 days', level: 'late', due: ago(11), type: 'Pregnancy' },
  { id: 't2', householdId: 'h22', memberId: 'm6', title: "Rekha's baby Aarav", house: 'House 22',
    reason: 'Penta-2 vaccine due today', level: 'due', due: iso(new Date()), type: 'Child vaccine' },
  { id: 't3', householdId: 'h07', memberId: 'm8', title: 'Meena Kumari', house: 'House 7',
    reason: 'TB follow-up due this week', level: 'due', due: ahead(3), type: 'Illness' },
  { id: 't4', householdId: 'h31', memberId: 'm10', title: 'Pooja Verma', house: 'House 31',
    reason: 'First ANC registration pending', level: 'due', due: ahead(4), type: 'Pregnancy' },
  { id: 't5', householdId: 'h14', memberId: 'm4', title: 'Kamla Devi', house: 'House 14',
    reason: 'NCD screening (CBAC) not done', level: 'info', due: ahead(9), type: 'Health check' },
]

export const pastEncounters = [
  { id: 'e-past-1', householdId: 'h14', memberId: 'm1', type: 'Pregnancy',
    date: ago(12), summary: 'ANC 3 check-up', outputs: 5,
    facts: {
      'person.name': 'Sunita Devi', 'person.age': 24,
      'pregnancy.lmp': ago(154), 'pregnancy.gravida': 1,
      'vitals.weight': 52, 'vitals.height': 151,
      'vitals.bpSys': 118, 'vitals.bpDia': 78, 'vitals.hb': 9.8,
      'tt.dose1Given': true, 'ifa.given': true, 'tb.cough2weeks': false,
      'visit.consentGiven': true, __encounterType: 'Pregnancy',
    } },
  { id: 'e-past-2', householdId: 'h14', memberId: 'm1', type: 'Pregnancy',
    date: ago(52), summary: 'ANC 2 check-up', outputs: 5,
    facts: {
      'person.name': 'Sunita Devi', 'person.age': 24,
      'pregnancy.lmp': ago(154), 'pregnancy.gravida': 1,
      'vitals.weight': 51, 'vitals.height': 151,
      'vitals.bpSys': 120, 'vitals.bpDia': 80, 'vitals.hb': 9.9,
      'visit.consentGiven': true, __encounterType: 'Pregnancy',
    } },
  { id: 'e-past-3', householdId: 'h14', memberId: null, type: 'Household survey',
    date: ago(63), summary: 'Household register updated', outputs: 1, facts: {} },
  { id: 'e-past-4', householdId: 'h22', memberId: 'm6', type: 'Newborn',
    date: ago(84), summary: 'Newborn home visit, day 7', outputs: 4,
    facts: {
      'person.name': 'Aarav', 'child.birthWeight': 2.9,
      'vitals.weight': 3.1, 'visit.consentGiven': true, __encounterType: 'Newborn',
    } },
]

export const earningsHistory = [
  { id: 'i1', date: ago(3),  label: 'Antenatal home visit',        code: 'ANC-VISIT', amount: 100, claimed: true },
  { id: 'i2', date: ago(6),  label: 'IFA tablet distribution',     code: 'IFA-DIST',  amount: 50,  claimed: true },
  { id: 'i3', date: ago(9),  label: 'Early ANC registration',      code: 'ANC-REG',   amount: 300, claimed: true },
  { id: 'i4', date: ago(12), label: 'Newborn home visit (HBNC)',   code: 'HBNC',      amount: 250, claimed: false },
  { id: 'i5', date: ago(14), label: 'Newborn home visit (HBNC)',   code: 'HBNC',      amount: 250, claimed: false },
  { id: 'i6', date: ago(18), label: 'Accompanied immunisation',    code: 'TT-DOSE',   amount: 50,  claimed: true },
  { id: 'i7', date: ago(21), label: 'High-risk pregnancy identified', code: 'HRP-ID', amount: 200, claimed: false },
  { id: 'i8', date: ago(24), label: 'Presumptive TB referral',     code: 'TB-REF',    amount: 150, claimed: false },
  { id: 'i9', date: ago(27), label: 'Antenatal home visit',        code: 'ANC-VISIT', amount: 100, claimed: true },
]

// ---- Woman portal --------------------------------------------------------
export const SCHEMES = [
  {
    code: 'PMMVY', name: 'Pradhan Mantri Matru Vandana Yojana',
    short: 'PMMVY', amount: 5000, note: '₹5,000 for the first child; ₹6,000 if the second child is a girl',
    verify: 'Amounts and conditions vary by revision and state — verify on pmmvy.wcd.gov.in',
    stages: [
      { id: 's1', label: 'Pregnancy registered',   state: 'done',    date: ago(140), amount: 0 },
      { id: 's2', label: 'Application submitted',  state: 'done',    date: ago(132), amount: 0 },
      { id: 's3', label: 'First instalment',       state: 'done',    date: ago(117), amount: 3000 },
      { id: 's4', label: 'Second instalment',      state: 'blocked', date: null,     amount: 2000,
        blocker: 'Aadhaar is not linked to the bank account',
        fix: 'Visit the bank with her Aadhaar card and ask for Aadhaar seeding of the account.' },
      { id: 's5', label: 'Final instalment',       state: 'pending', date: null,     amount: 0,
        note: 'Released after delivery and the first BCG dose' },
    ],
  },
  {
    code: 'JSY', name: 'Janani Suraksha Yojana', short: 'JSY',
    amount: 1400, note: '₹1,400 rural / ₹1,000 urban in low-performing states; other rates elsewhere',
    verify: 'Rates differ by state category — verify on nhm.gov.in',
    stages: [
      { id: 's1', label: 'Pregnancy registered', state: 'done',    date: ago(140), amount: 0 },
      { id: 's2', label: 'Institutional delivery', state: 'pending', date: null,   amount: 1400,
        note: 'Paid after delivery at a government facility' },
    ],
  },
  {
    code: 'ICDS', name: 'Anganwadi take-home ration', short: 'Anganwadi food',
    amount: 0, note: 'Monthly supplementary nutrition through the Anganwadi centre',
    verify: 'Collected monthly at the Anganwadi centre',
    stages: [
      { id: 's1', label: 'Enrolled at Anganwadi', state: 'done', date: ago(130), amount: 0 },
      { id: 's2', label: 'Ration collected this month', state: 'done', date: ago(8), amount: 0 },
    ],
  },
]

export const UPDATES = [
  { id: 'u1', kind: 'foryou', title: 'You may qualify for a higher PMMVY amount',
    body: 'The second-child amount is ₹6,000 when the child is a girl. Ask your ASHA to check your record.',
    date: ago(1) },
  { id: 'u2', kind: 'village', title: 'Health camp in Rampur on 25 September',
    body: 'Free haemoglobin and blood pressure testing, 9 am to 2 pm at the panchayat bhawan.',
    date: ago(2) },
  { id: 'u3', kind: 'village', title: 'VHND every Wednesday',
    body: 'Village Health and Nutrition Day is held at the Anganwadi centre each Wednesday morning.',
    date: ago(6) },
  { id: 'u4', kind: 'general', title: 'Free ambulance — dial 102',
    body: '102 is free for pregnant women and infants, day or night.', date: ago(10) },
]

export const HER_VITALS = [
  { date: ago(140), weight: 48.0, bpSys: 116, bpDia: 76, hb: 10.4 },
  { date: ago(96),  weight: 49.6, bpSys: 118, bpDia: 78, hb: 10.1 },
  { date: ago(52),  weight: 51.0, bpSys: 120, bpDia: 80, hb: 9.9 },
  { date: ago(12),  weight: 52.0, bpSys: 118, bpDia: 78, hb: 9.8 },
]

export const HER_RECORDS = [
  { id: 'r1', date: ago(12), by: 'ASHA Sunita Yadav', type: 'ANC-2',
    values: [['Weight', '52 kg'], ['Blood pressure', '118/78'], ['Haemoglobin', '9.8 g/dL'], ['TT/Td dose 1', 'Given']],
    sentTo: ['RCH', 'HMIS', 'REGISTER'] },
  { id: 'r2', date: ago(52), by: 'ANM Kavita', type: 'ANC-1',
    values: [['Weight', '51 kg'], ['Blood pressure', '120/80'], ['Haemoglobin', '9.9 g/dL'], ['Registered', 'Yes']],
    sentTo: ['RCH', 'HMIS', 'UWIN', 'REGISTER'] },
]

/* ---- The workers a block officer is responsible for ------------------------
   One of these is real: ASHA-RMP-014 is the worker whose phone this app is,
   and her row is recomputed from the local database rather than read from
   here, so a visit recorded in the field moves the officer's number. The rest
   stand in for the other sub-centres.

   Deliberately absent: any score, rank or ordering by output. An officer needs
   to see who is carrying too much and who is short of supplies — not a league
   table of the women doing the work. */
export const OFFICER_ASHAS = [
  { id: 'ASHA-RMP-014', name: 'Sunita Yadav',   village: 'Rampur',    subcentre: 'Rampur SC',    phone: '98765 21140', live: true,
    households: 19, people: 83, pregnant: 6, under5: 17, visits: 34, due: 5, overdue: 1, synced: 100, joined: '2019-06-01', trained: ago(120) },
  { id: 'ASHA-RMP-021', name: 'Phoolmati Devi', village: 'Rampur',    subcentre: 'Rampur SC',    phone: '98765 21188',
    households: 22, people: 96, pregnant: 4, under5: 15, visits: 29, due: 7, overdue: 3, synced: 96,  joined: '2021-02-11', trained: ago(210) },
  { id: 'ASHA-RMP-033', name: 'Sarita Kumari',  village: 'Rampur',    subcentre: 'Rampur SC',    phone: '99102 45511',
    households: 17, people: 71, pregnant: 3, under5: 11, visits: 26, due: 4, overdue: 0, synced: 100, joined: '2020-08-19', trained: ago(95) },
  { id: 'ASHA-KSN-007', name: 'Munni Devi',     village: 'Kishanpur', subcentre: 'Kishanpur East', phone: '97311 20984',
    households: 31, people: 141, pregnant: 9, under5: 26, visits: 18, due: 16, overdue: 11, synced: 62, joined: '2017-04-02', trained: ago(430) },
  { id: 'ASHA-KSN-012', name: 'Rina Kumari',    village: 'Kishanpur', subcentre: 'Kishanpur East', phone: '97311 20990',
    households: 26, people: 118, pregnant: 5, under5: 22, visits: 21, due: 12, overdue: 7, synced: 71,  joined: '2022-09-15', trained: ago(60) },
  { id: 'ASHA-BEL-004', name: 'Kaushalya Devi', village: 'Bela',      subcentre: 'Bela North',   phone: '96500 71223',
    households: 18, people: 79, pregnant: 4, under5: 14, visits: 31, due: 3, overdue: 0, synced: 100, joined: '2016-01-20', trained: ago(150) },
  { id: 'ASHA-BEL-009', name: 'Anita Devi',     village: 'Bela',      subcentre: 'Bela North',   phone: '96500 71240',
    households: 20, people: 88, pregnant: 5, under5: 16, visits: 28, due: 5, overdue: 1, synced: 100, joined: '2018-11-05', trained: ago(180) },
  { id: 'ASHA-SHG-002', name: 'Geeta Devi',     village: 'Sohagpur',  subcentre: 'Sohagpur SC',  phone: '94155 63007',
    households: 24, people: 104, pregnant: 6, under5: 19, visits: 23, due: 8, overdue: 4, synced: 88,  joined: '2019-03-14', trained: ago(260) },
]

/* ---- What the sub-centres are asking the block store for -------------------
   Sunita Yadav's request is not listed here: it is read from her actual drug
   kit in the local database, so what the officer sees is what her phone says.
   Amounts are demonstration values. */
export const SUPPLY_REQUESTS = [
  { id: 'sr1', ashaId: 'ASHA-KSN-007', item: 'IFA tablets (red)',    qty: 600, unit: 'tablets', raised: ago(9), urgency: 'late',
    why: 'Out for 9 days. 9 pregnant women on her list are without tablets.' },
  { id: 'sr2', ashaId: 'ASHA-KSN-007', item: 'Calcium tablets',      qty: 400, unit: 'tablets', raised: ago(9), urgency: 'late',
    why: 'Out of stock since the last indent was missed.' },
  { id: 'sr3', ashaId: 'ASHA-KSN-012', item: 'ORS sachets',          qty: 50,  unit: 'sachets', raised: ago(4), urgency: 'due',
    why: 'Below the minimum level with the season starting.' },
  { id: 'sr4', ashaId: 'ASHA-SHG-002', item: 'MCP cards',            qty: 30,  unit: 'cards',   raised: ago(3), urgency: 'due',
    why: 'New registrations cannot be given a card.' },
  { id: 'sr5', ashaId: 'ASHA-BEL-009', item: 'Chlorhexidine gel',    qty: 10,  unit: 'tubes',   raised: ago(2), urgency: 'info',
    why: 'Routine top-up before two expected deliveries.' },
  { id: 'sr6', ashaId: 'ASHA-RMP-021', item: 'Sanitary napkins',     qty: 40,  unit: 'packs',   raised: ago(6), urgency: 'due',
    why: 'Adolescent session at the school next week.' },
]

export const OFFICER_VILLAGES = [
  { name: 'Rampur',    coverage: 86, visits: 148, overdue: 9,  synced: 98, ashas: 4 },
  { name: 'Kishanpur', coverage: 61, visits: 74,  overdue: 21, synced: 72, ashas: 3 },
  { name: 'Bela',      coverage: 97, visits: 121, overdue: 3,  synced: 100, ashas: 3 },
  { name: 'Sohagpur',  coverage: 79, visits: 69,  overdue: 5,  synced: 94, ashas: 2 },
]

export const OFFICER_ALERTS = [
  { id: 'a1', level: 'late', title: '14 infants missed Penta-2 in Kishanpur',
    detail: 'Doses overdue by more than 14 days. Gap Chaser flagged these on last night’s run.' },
  { id: 'a2', level: 'due',  title: '3 sub-centres have not synced for 6 days',
    detail: 'Kishanpur East, Bela North, Sohagpur. Likely network, not data loss — the outbox retains everything.' },
  { id: 'a3', level: 'info', title: '27 high-risk pregnancies identified this month',
    detail: 'Across all four villages. Up from 19 last month, consistent with higher ANC registration.' },
]

/* =========================================================================
   The rest of her caseload.

   The four households above are hand-written because the tasks, scheme
   enrolments and the beneficiary portal all point at them by id. The rest are
   generated from a fixed seed so the numbers are realistic and stable between
   reloads — an ASHA covers roughly 1,000 people, and what matters for the
   screens is the shape of the population, not the individual names.
   ========================================================================= */

const SURNAMES = ['Yadav', 'Kumar', 'Devi', 'Prasad', 'Singh', 'Verma', 'Pal', 'Maurya',
  'Nishad', 'Sharma', 'Gupta', 'Lal', 'Chauhan', 'Rawat', 'Tiwari', 'Kushwaha']
const MEN = ['Ramesh', 'Suresh', 'Dinesh', 'Mahesh', 'Rajesh', 'Vijay', 'Arun', 'Sunil',
  'Anil', 'Manoj', 'Sanjay', 'Raju', 'Shyam', 'Govind', 'Prem', 'Hari', 'Kamal', 'Naresh']
const WOMEN = ['Sunita', 'Rekha', 'Meena', 'Pooja', 'Anjali', 'Kavita', 'Savitri', 'Geeta',
  'Usha', 'Radha', 'Seema', 'Nisha', 'Laxmi', 'Rani', 'Sarita', 'Mamta', 'Asha', 'Guddi']
const KIDS = ['Aarav', 'Vivaan', 'Aditya', 'Rohan', 'Kartik', 'Ansh', 'Riya', 'Anaya',
  'Diya', 'Kiara', 'Myra', 'Chotu', 'Golu', 'Pinky', 'Sonu', 'Baby']

/** Deterministic pseudo-random, so the caseload is the same every reload. */
function rng(seed) {
  let x = seed
  return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff }
}

function generateCaseload() {
  const r = rng(20260919)
  const pick = a => a[Math.floor(r() * a.length)]
  const int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1))

  // Enough households to make the caseload numbers mean something, and few
  // enough to scroll through in a demo.
  const villages = [
    { name: 'Rampur', houses: 6 },
    { name: 'Kishanpur', houses: 4 },
    { name: 'Bela', houses: 3 },
    { name: 'Sohagpur', houses: 2 },
  ]

  const households = []
  const members = []
  let house = 40                       // the hand-written ones use 7, 14, 22, 31

  for (const v of villages) {
    for (let i = 0; i < v.houses; i++) {
      house += 1
      const id = 'h' + String(house).padStart(3, '0')
      const surname = pick(SURNAMES)
      const head = `${pick(MEN)} ${surname}`
      const size = int(3, 8)
      const bpl = r() < 0.42

      households.push({
        id, houseNo: String(house), headName: head, village: v.name,
        membersCount: size, bplCard: bpl, hasToilet: r() < 0.71,
        waterSource: pick(['tap', 'handpump', 'handpump', 'well']),
        facts: {
          'household.houseNo': String(house), 'household.headName': head,
          'household.village': v.name, 'household.membersCount': size,
          'household.bplCard': bpl, 'household.hasToilet': r() < 0.71,
          'household.waterSource': 'handpump',
          'household.block': 'Rampur block', 'household.district': 'Barabanki',
        },
      })

      // head of family
      members.push({ id: id + 'a', householdId: id, name: head, age: int(26, 52), sex: 'M',
        role: r() < 0.22 ? 'elder' : 'adult' })

      // wife — with this few households, place the pregnancies deliberately so
      // the matrix always has something to show
      const wifeAge = int(20, 40)
      const pregnant = [2, 5, 9, 13].includes(house - 40)
      const wife = `${pick(WOMEN)} ${surname === 'Devi' ? 'Devi' : pick(['Devi', surname])}`
      members.push({
        id: id + 'b', householdId: id, name: wife, age: wifeAge, sex: 'F',
        role: pregnant ? 'pregnant' : (r() < 0.2 ? 'mother' : 'adult'),
        ...(pregnant ? { lmp: ago(int(30, 240)) } : {}),
      })

      // children — no two with the same name in one house
      const kids = Math.max(0, size - 2 - (r() < 0.3 ? 1 : 0))
      const taken = new Set()
      for (let k = 0; k < kids && k < 3; k++) {
        // one newborn, and a decent spread of under-fives
        const months = (house - 40 === 3 && k === 0) ? int(0, 1)
          : r() < 0.42 ? int(2, 58) : int(60, 190)
        const sex = r() < 0.49 ? 'M' : 'F'
        let name = pick(KIDS)
        for (let tries = 0; taken.has(name) && tries < 12; tries++) name = pick(KIDS)
        taken.add(name)
        members.push({
          id: id + 'c' + k, householdId: id,
          name, age: Math.floor(months / 12), sex,
          role: months < 12 ? 'infant' : months < 180 ? 'child' : 'adolescent',
          ...(months < 60 ? { dob: ago(Math.round(months * 30.4)) } : {}),
        })
      }

      // a grandparent in about a third of households
      if (r() < 0.34) {
        members.push({ id: id + 'e', householdId: id,
          name: `${r() < 0.5 ? pick(WOMEN) : pick(MEN)} ${surname}`,
          age: int(58, 79), sex: r() < 0.55 ? 'F' : 'M', role: 'elder' })
      }
    }
  }
  return { households, members }
}

const generated = generateCaseload()
export const allHouseholds = [...households, ...generated.households]
export const allMembers = [...members, ...generated.members]

// ---- Scheme enrolment per member, with the phase each one is at ----------
export const ENROLMENTS = [
  { memberId: 'm1', scheme: 'RCH',   label: 'RCH / Maternal',       phase: 'ANC 2 of 4',        state: 'active',  updated: ago(12) },
  { memberId: 'm1', scheme: 'PMMVY', label: 'PMMVY',                phase: 'Instalment 2 stuck',state: 'blocked', updated: ago(30) },
  { memberId: 'm1', scheme: 'JSY',   label: 'JSY',                  phase: 'Awaiting delivery', state: 'waiting', updated: ago(140) },
  { memberId: 'm1', scheme: 'ICDS',  label: 'Anganwadi ration',     phase: 'Collected Sept',    state: 'active',  updated: ago(8) },
  { memberId: 'm6', scheme: 'UWIN',  label: 'U-WIN immunisation',   phase: 'Penta-2 due',       state: 'due',     updated: ago(2) },
  { memberId: 'm6', scheme: 'ICDS',  label: 'Growth monitoring',    phase: 'Month 3 weighed',   state: 'active',  updated: ago(6) },
  { memberId: 'm8', scheme: 'NIKSHAY', label: 'Ni-kshay (TB)',      phase: 'Month 2 of 6',      state: 'active',  updated: ago(20) },
  { memberId: 'm8', scheme: 'NPY',   label: 'Ni-kshay Poshan',      phase: 'Paid to Aug',       state: 'active',  updated: ago(20) },
  { memberId: 'm4', scheme: 'CBAC',  label: 'NCD screening',        phase: 'Not started',       state: 'due',     updated: ago(90) },
  { memberId: 'm10', scheme: 'RCH',  label: 'RCH / Maternal',       phase: 'Registration due',  state: 'due',     updated: ago(4) },
]

/* ---- The drug kit an ASHA carries -----------------------------------------
   The ASHA Drug Kit is real: a small box she is issued and expected to keep
   stocked from the sub-centre. Quantities below are demonstration values.
   `minQty` is the level at which she should ask for more, not a clinical rule. */
export const MEDICINE_KIT = [
  { id: 'med1',  name: 'IFA tablets (red)',        category: 'Pregnancy and anaemia', icon: 'pill',        unit: 'tablets', qty: 180, minQty: 100 },
  { id: 'med2',  name: 'IFA syrup (paediatric)',   category: 'Child health',          icon: 'bottle',      unit: 'ml',      qty: 100, minQty: 100 },
  { id: 'med3',  name: 'Calcium tablets',          category: 'Pregnancy and anaemia', icon: 'pill',        unit: 'tablets', qty: 240, minQty: 120 },
  { id: 'med4',  name: 'ORS sachets',              category: 'Diarrhoea',             icon: 'glass',       unit: 'sachets', qty: 12,  minQty: 20  },
  { id: 'med5',  name: 'Zinc tablets (20 mg)',     category: 'Diarrhoea',             icon: 'pill',        unit: 'tablets', qty: 40,  minQty: 30  },
  { id: 'med6',  name: 'Paracetamol (500 mg)',     category: 'Fever and pain',        icon: 'pill',        unit: 'tablets', qty: 0,   minQty: 30  },
  { id: 'med7',  name: 'Paracetamol syrup',        category: 'Fever and pain',        icon: 'bottle',      unit: 'ml',      qty: 60,  minQty: 60  },
  { id: 'med8',  name: 'Pregnancy test kits',      category: 'Testing',               icon: 'vial',        unit: 'kits',    qty: 8,   minQty: 5   },
  { id: 'med9',  name: 'Chlorhexidine gel',        category: 'Newborn care',          icon: 'drop',        unit: 'tubes',   qty: 4,   minQty: 3   },
  { id: 'med10', name: 'Oral contraceptive pills', category: 'Family planning',       icon: 'pill',        unit: 'strips',  qty: 15,  minQty: 10  },
  { id: 'med11', name: 'Condoms',                  category: 'Family planning',       icon: 'shield',      unit: 'pieces',  qty: 60,  minQty: 40  },
  { id: 'med12', name: 'Sanitary napkins',         category: 'Adolescent health',     icon: 'ribbon',      unit: 'packs',   qty: 0,   minQty: 10  },
  { id: 'med13', name: 'Digital thermometer',      category: 'Equipment',             icon: 'thermometer', unit: 'pieces',  qty: 1,   minQty: 1   },
  { id: 'med14', name: 'Bandages and gauze',       category: 'First aid',             icon: 'firstaid',    unit: 'packs',   qty: 6,   minQty: 4   },
]

/* A few movements already on the ledger, so the history is not empty. */
export const MEDICINE_LOG = [
  { medicineId: 'med1',  medicineName: 'IFA tablets (red)',    type: 'dispense', qty: 30, unit: 'tablets', to: 'Sunita Devi',  note: 'ANC 2 — one month',      date: ago(12) },
  { medicineId: 'med4',  medicineName: 'ORS sachets',          type: 'dispense', qty: 4,  unit: 'sachets', to: 'Aarav (House 22)', note: 'Loose motions',      date: ago(6)  },
  { medicineId: 'med5',  medicineName: 'Zinc tablets (20 mg)', type: 'dispense', qty: 14, unit: 'tablets', to: 'Aarav (House 22)', note: '14-day course',      date: ago(6)  },
  { medicineId: 'med6',  medicineName: 'Paracetamol (500 mg)', type: 'dispense', qty: 10, unit: 'tablets', to: 'Meena Kumari', note: 'Fever',                  date: ago(4)  },
  { medicineId: 'med1',  medicineName: 'IFA tablets (red)',    type: 'restock',  qty: 100, unit: 'tablets', to: '', note: '',                                  date: ago(20) },
]

// ---- Proof documents held for a household -------------------------------
export const PROOFS = [
  { id: 'p1', householdId: 'h14', memberId: 'm1', kind: 'aadhaar',  label: 'Aadhaar card',        state: 'verified', date: ago(140), size: '412 KB' },
  { id: 'p2', householdId: 'h14', memberId: 'm1', kind: 'bank',     label: 'Bank passbook',       state: 'mismatch', date: ago(138), size: '388 KB',
    issue: 'Aadhaar is not seeded to this account — this is blocking the PMMVY instalment' },
  { id: 'p3', householdId: 'h14', memberId: 'm1', kind: 'mcp',      label: 'MCP card (page 1)',   state: 'verified', date: ago(120), size: '1.1 MB' },
  { id: 'p4', householdId: 'h14', memberId: 'm1', kind: 'visit',    label: 'ANC-2 visit photo',   state: 'submitted', date: ago(12), size: '742 KB' },
  { id: 'p5', householdId: 'h14', memberId: null, kind: 'ration',   label: 'BPL ration card',     state: 'verified', date: ago(160), size: '506 KB' },
  { id: 'p6', householdId: 'h22', memberId: 'm6', kind: 'birth',    label: 'Birth certificate',   state: 'missing',  date: null, size: null },
  { id: 'p7', householdId: 'h22', memberId: 'm6', kind: 'visit',    label: 'HBNC day-3 photo',    state: 'submitted', date: ago(88), size: '690 KB' },
  { id: 'p8', householdId: 'h07', memberId: 'm8', kind: 'nikshay',  label: 'Ni-kshay ID slip',    state: 'verified', date: ago(60), size: '210 KB' },
]

// ---- Reminders ----------------------------------------------------------
export const REMINDERS = [
  { id: 'r1', title: 'VHND at Anganwadi',        when: 'Every Wednesday, 9:00 am', kind: 'repeat', on: true },
  { id: 'r2', title: 'Sunita — ANC 3',           when: '28 Sept, 10:00 am',        kind: 'visit',  on: true },
  { id: 'r3', title: "Aarav — Penta-2",          when: 'Today, 4:00 pm',           kind: 'visit',  on: true },
  { id: 'r4', title: 'Submit monthly claim',     when: '1st of every month',       kind: 'money',  on: true },
  { id: 'r5', title: 'Sync before leaving PHC',  when: 'Daily, 5:30 pm',           kind: 'sync',   on: false },
]

// ---- Simulated government portal connections ----------------------------
export const PORTALS = [
  { code: 'ASHASOFT', name: 'ASHA Soft', what: 'Incentive claims and payment status', connected: true,  last: ago(6) },
  { code: 'RCH',      name: 'RCH Portal', what: 'Maternal and child registrations',   connected: true,  last: ago(2) },
  { code: 'UWIN',     name: 'U-WIN',      what: 'Immunisation sessions and doses',    connected: false, last: null },
  { code: 'HMIS',     name: 'HMIS',       what: 'Monthly aggregate report',           connected: false, last: null },
]

export const SUBMISSIONS = [
  { id: 's1', date: ago(6),  portal: 'ASHA Soft', items: 6, amount: 900,  state: 'paid',     note: 'Credited to bank' },
  { id: 's2', date: ago(20), portal: 'ASHA Soft', items: 4, amount: 650,  state: 'approved', note: 'Payment in process' },
  { id: 's3', date: ago(34), portal: 'ASHA Soft', items: 7, amount: 1150, state: 'paid',     note: 'Credited to bank' },
  { id: 's4', date: ago(9),  portal: 'RCH Portal', items: 3, amount: 0,   state: 'rejected', note: 'RCH ID mismatch on 1 record' },
]

// ---- Assistant: canned answers for the prototype ------------------------
export const ASSISTANT_PROMPTS = {
  en: [
    'What documents are needed for PMMVY?',
    'Why has Sunita’s payment not come?',
    'How much do I get for a newborn home visit?',
    'When is the Penta-2 vaccine due?',
  ],
  hi: [
    'PMMVY के लिए कौन-कौन से काग़ज़ चाहिए?',
    'सुनीता का पैसा अब तक क्यों नहीं आया?',
    'नवजात की घर भेंट के कितने पैसे मिलते हैं?',
    'पेंटा-2 का टीका कब लगना है?',
  ],
}

export const ASSISTANT_ANSWERS = {
  default: {
    text: 'I can answer questions about the schemes, read a form you upload, and turn that form into a capture screen. Ask me anything, or attach a PDF.',
    sources: [],
  },
  pmmvy: {
    match: /pmmvy|matru|vandana|maternity/i,
    text: 'For PMMVY the beneficiary usually needs: her Aadhaar, her own bank or post-office account **with Aadhaar seeded to it**, the MCP card showing the pregnancy registration, and her husband’s Aadhaar. The account must be in her name — a joint or husband’s account is the most common reason an instalment is held.\n\nFor this household, the bank passbook on file shows an Aadhaar-seeding mismatch, which is what is blocking Sunita’s second instalment.',
    sources: ['PMMVY scheme guidelines', 'This household’s proof locker'],
    actions: [{ label: 'Open Sunita’s PMMVY tracker', to: '/asha/family/h14' }],
  },
  payment: {
    match: /payment|money|stuck|not come|pending|instal/i,
    text: 'Sunita Devi’s PMMVY second instalment of ₹2,000 is held because her Aadhaar is not seeded to her bank account.\n\nWhat to do: she takes her Aadhaar card to the branch and asks for Aadhaar seeding of that account. It usually takes 3 to 7 working days, after which the instalment releases on the next payment run.',
    sources: ['Benefit application record', 'PMMVY scheme guidelines'],
    actions: [{ label: 'Open the household', to: '/asha/family/h14' }],
  },
  incentive: {
    match: /incentive|how much|earn|paid|hbnc|payment for/i,
    text: 'Under the NHM incentive package, a newborn home visit (HBNC) is paid per completed visit schedule, and the amount differs by state. In this prototype the configured value is ₹250 per visit.\n\nYou have two HBNC visits recorded this month that were never claimed — that is ₹500 sitting unclaimed.',
    sources: ['NHM ASHA incentive package', 'Your earnings ledger'],
    actions: [{ label: 'Open earnings', to: '/asha/earnings' }],
  },
  vaccine: {
    match: /vaccine|penta|bcg|immunis|immuniz|due when/i,
    text: 'Penta-2 falls due at 10 weeks of age under the National Immunization Schedule.\n\nAarav (House 22) was born about 13 weeks ago, so Penta-2 is due now and Penta-3 follows at 14 weeks. Both are already on your visit list.',
    sources: ['National Immunization Schedule', 'U-WIN record for Aarav'],
    actions: [{ label: 'Open House 22', to: '/asha/family/h22' }],
  },
}

// ---- The worker's own profile -------------------------------------------
export const PROFILE = {
  name: ASHA.name,
  ashaId: ASHA.id,
  role: 'Accredited Social Health Activist',
  since: '2019-07-01',
  phone: '98765 21140',
  village: 'Rampur',
  block: 'Rampur block',
  district: 'Barabanki',
  state: 'Uttar Pradesh',
  phc: 'Rampur Primary Health Centre',
  anm: 'Kavita Singh (ANM)',
  anmPhone: '98110 44552',
  bank: 'Aadhaar-seeded · ••••4471',
  abha: '12-8842-6610-9053',
  covers: { villages: 1, households: 142, people: 631, pregnant: 11, infants: 7 },
  verified: [
    { label: 'ASHA ID', state: 'ok', note: 'Verified with the block office' },
    { label: 'Bank account', state: 'ok', note: 'Aadhaar seeded — incentives can be paid' },
    { label: 'ABHA number', state: 'ok', note: 'Created 2023' },
    { label: 'Induction training', state: 'ok', note: 'Modules 1–7 complete' },
    { label: 'HBNC refresher', state: 'due', note: 'Due since March 2026' },
  ],
  thisMonth: { visits: 34, households: 21, records: 147, earned: 2150, minutesSaved: 272 },
  training: [
    { name: 'ASHA induction, Modules 1–7', year: '2019', state: 'ok' },
    { name: 'Home Based Newborn Care (HBNC)', year: '2021', state: 'ok' },
    { name: 'NCD screening / CBAC', year: '2023', state: 'ok' },
    { name: 'HBNC refresher', year: '—', state: 'due' },
  ],
  ownDocs: [
    { label: 'ASHA identity card', state: 'verified' },
    { label: 'Bank passbook', state: 'verified' },
    { label: 'Aadhaar', state: 'verified' },
    { label: 'Training certificates', state: 'verified' },
  ],
}

/* =========================================================================
   BENEFICIARY PORTAL
   Two personas share one interface: a pregnant woman, and a mother with an
   infant. The shape of every screen is the same; only the content changes.
   ========================================================================= */

export const WOMAN = {
  pregnant: {
    mode: 'pregnant',
    memberId: 'm1', householdId: 'h14',   // the same rows the ASHA works with
    name: 'Sunita Devi', age: 24, houseNo: '14', village: 'Rampur',
    email: 'sunita.devi@ashaflow.demo',
    husband: 'Ramesh Kumar', mobile: '98765 43210',
    rchId: 'RCH-RAM-48210', abha: '12-3456-7890-1234',
    statusLine: '5 months pregnant',
    week: 22, month: 5, edd: '2027-02-06',
    nextVisit: { label: 'ANC 3 check-up', date: '2026-09-28', at: 'Rampur Primary Health Centre' },
    asha: 'Sunita Yadav', ashaPhone: '98765 21140',
    anm: 'Kavita Singh', phc: 'Rampur Primary Health Centre',
  },
  mother: {
    mode: 'mother',
    memberId: 'm5', householdId: 'h22', babyId: 'm6',
    name: 'Rekha Kumari', age: 26, houseNo: '22', village: 'Rampur',
    email: 'rekha.kumari@ashaflow.demo',
    husband: 'Mohan Lal', mobile: '98122 33445',
    rchId: 'RCH-RAM-47166', abha: '12-9911-2233-4455',
    statusLine: 'Mother of Aarav, 3 months',
    baby: { name: 'Aarav', sex: 'M', weeks: 13, months: 3, dob: '2026-06-18', weight: 5.2, birthWeight: 2.9 },
    nextVisit: { label: 'Penta-2 immunisation', date: '2026-09-18', at: 'Anganwadi centre, Rampur' },
    asha: 'Sunita Yadav', ashaPhone: '98765 21140',
    anm: 'Kavita Singh', phc: 'Rampur Primary Health Centre',
  },
}

/** Every step, in order. This is the "records and history" the portal is built around. */
export const WOMAN_TIMELINE = {
  pregnant: [
    { id: 'p1', kind: 'payment', date: ago(117), title: 'PMMVY first instalment received',
      by: 'Ministry of Women and Child Development', amount: 3000,
      detail: 'Credited to your bank account ending 4471.', sentTo: [] },
    { id: 'p2', kind: 'checkup', date: ago(12), title: 'ANC 3 check-up', by: 'ASHA Sunita Yadav',
      values: [['Weight', '52.0 kg'], ['Blood pressure', '118 / 78'], ['Haemoglobin', '9.8 g/dL'],
               ['Foetal heart rate', '142 / min'], ['Abdominal girth', '84 cm']],
      note: 'Haemoglobin is slightly low. Iron tablets continued.',
      sentTo: ['RCH portal', 'Monthly report', 'Village register'] },
    { id: 'p3', kind: 'vaccine', date: ago(12), title: 'Td dose 1 given', by: 'ANM Kavita Singh',
      detail: 'Left upper arm. No reaction reported.',
      next: 'Td dose 2 due 28 days later', sentTo: ['RCH portal', 'U-WIN', 'Monthly report'] },
    { id: 'p4', kind: 'test', date: ago(52), title: 'Blood and urine tests', by: 'Rampur PHC laboratory',
      values: [['Haemoglobin', '9.9 g/dL'], ['Blood group', 'B positive'], ['Blood sugar', 'Normal'],
               ['Urine albumin', 'Nil'], ['HIV / VDRL', 'Non-reactive']],
      sentTo: ['RCH portal'] },
    { id: 'p5', kind: 'checkup', date: ago(52), title: 'ANC 2 check-up', by: 'ANM Kavita Singh',
      values: [['Weight', '51.0 kg'], ['Blood pressure', '120 / 80'], ['Haemoglobin', '9.9 g/dL']],
      sentTo: ['RCH portal', 'Monthly report', 'Village register'] },
    { id: 'p6', kind: 'document', date: ago(132), title: 'PMMVY application submitted',
      by: 'ASHA Sunita Yadav', detail: 'Aadhaar, bank passbook and MCP card attached.', sentTo: [] },
    { id: 'p7', kind: 'checkup', date: ago(96), title: 'ANC 1 check-up', by: 'ASHA Sunita Yadav',
      values: [['Weight', '49.6 kg'], ['Blood pressure', '118 / 78'], ['Haemoglobin', '10.1 g/dL']],
      sentTo: ['RCH portal', 'Monthly report', 'Village register'] },
    { id: 'p8', kind: 'registration', date: ago(140), title: 'Pregnancy registered',
      by: 'ASHA Sunita Yadav',
      values: [['Last period', '2 May 2026'], ['Expected delivery', '6 Feb 2027'], ['RCH ID', 'RCH-RAM-48210']],
      sentTo: ['RCH portal', 'U-WIN', 'Monthly report', 'Village register'] },
  ],
  mother: [
    { id: 'm1', kind: 'growth', date: ago(6), title: 'Growth monitoring — month 3',
      by: 'Anganwadi worker', values: [['Weight', '5.2 kg'], ['Length', '60 cm'], ['Growth band', 'Normal']],
      sentTo: ['Poshan Tracker', 'Monthly report'] },
    { id: 'm2', kind: 'vaccine', date: ago(48), title: 'Penta-1, OPV-1, Rota-1 and PCV-1 given',
      by: 'ANM Kavita Singh', detail: 'Six weeks. Mild fever for one day afterwards, normal.',
      next: 'Penta-2 due at 10 weeks', sentTo: ['U-WIN', 'RCH portal', 'Monthly report'] },
    { id: 'm3', kind: 'checkup', date: ago(84), title: 'Newborn home visit, day 7 (HBNC)',
      by: 'ASHA Sunita Yadav',
      values: [['Weight', '3.1 kg'], ['Temperature', 'Normal'], ['Feeding', 'Breastfeeding well'],
               ['Cord', 'Healthy, dry'], ['Danger signs', 'None']],
      sentTo: ['RCH portal', 'Monthly report', 'Village register'] },
    { id: 'm4', kind: 'payment', date: ago(86), title: 'JSY delivery payment received',
      by: 'National Health Mission', amount: 1400,
      detail: 'Paid for delivering at a government facility.', sentTo: [] },
    { id: 'm5', kind: 'vaccine', date: ago(92), title: 'BCG, OPV-0 and Hepatitis B birth dose',
      by: 'Rampur PHC', detail: 'Given within 24 hours of birth.', sentTo: ['U-WIN', 'RCH portal'] },
    { id: 'm6', kind: 'registration', date: ago(92), title: 'Aarav born at Rampur PHC',
      by: 'Rampur Primary Health Centre',
      values: [['Date of birth', '18 June 2026'], ['Birth weight', '2.9 kg'], ['Delivery', 'Normal, institutional']],
      sentTo: ['RCH portal', 'U-WIN', 'Monthly report', 'Village register'] },
  ],
}

export const TIMELINE_KINDS = {
  registration: { icon: 'id',       label: 'Registration' },
  checkup:      { icon: 'pulse',    label: 'Check-up' },
  test:         { icon: 'plate',    label: 'Test' },
  vaccine:      { icon: 'syringe',  label: 'Vaccine' },
  growth:       { icon: 'growth',   label: 'Growth' },
  payment:      { icon: 'wallet',   label: 'Payment' },
  document:     { icon: 'doc',      label: 'Document' },
}

/** Scheme detail written for the beneficiary, not for an administrator. */
export const WOMAN_SCHEMES = {
  pregnant: [
    {
      code: 'PMMVY', short: 'PMMVY', name: 'Pradhan Mantri Matru Vandana Yojana',
      what: 'A cash payment for a pregnant woman to make up for wages lost during pregnancy and to help with better nutrition.',
      amount: '₹5,000 for the first child. ₹6,000 for the second child if that child is a girl.',
      who: ['Pregnant and breastfeeding mothers', 'First living child, or second if a girl',
            'Not in regular government employment', 'Bank or post-office account in her own name'],
      needs: ['Aadhaar card', 'Bank passbook with Aadhaar seeded', 'MCP card', "Husband's Aadhaar"],
      state: 'blocked',
      stages: [
        { label: 'Pregnancy registered',  state: 'done',    date: ago(140), amount: 0 },
        { label: 'Application submitted', state: 'done',    date: ago(132), amount: 0 },
        { label: 'First instalment',      state: 'done',    date: ago(117), amount: 3000 },
        { label: 'Second instalment',     state: 'blocked', date: null, amount: 2000,
          blocker: 'Your Aadhaar is not linked to your bank account.',
          fix: 'Take your Aadhaar card to your bank branch and ask them to seed Aadhaar to the account. It usually takes 3 to 7 working days, after which the payment releases on the next run.' },
        { label: 'Final instalment',      state: 'pending', date: null, amount: 0,
          note: 'Released after delivery and the first BCG dose' },
      ],
      verify: 'Amounts and conditions are revised from time to time and differ by state. Check pmmvy.wcd.gov.in before relying on them.',
    },
    {
      code: 'JSY', short: 'JSY', name: 'Janani Suraksha Yojana',
      what: 'Cash help for delivering the baby at a government hospital or health centre instead of at home.',
      amount: '₹1,400 in rural areas and ₹1,000 in urban areas in low-performing states. Other states pay different rates.',
      who: ['All pregnant women delivering at a government or accredited facility', 'Paid at the time of discharge'],
      needs: ['MCP card', 'Aadhaar', 'Bank passbook', 'Your ASHA accompanies you'],
      state: 'waiting',
      stages: [
        { label: 'Pregnancy registered',   state: 'done',    date: ago(140), amount: 0 },
        { label: 'Institutional delivery', state: 'pending', date: null, amount: 1400,
          note: 'Paid after you deliver at a government facility' },
      ],
      verify: 'Rates differ by state category. Check nhm.gov.in.',
    },
    {
      code: 'ICDS', short: 'Anganwadi', name: 'Supplementary nutrition (ICDS)',
      what: 'Free take-home ration every month from the Anganwadi centre, plus regular weighing and health checks.',
      amount: 'Monthly ration. No cash.',
      who: ['All pregnant and breastfeeding women', 'Register at your nearest Anganwadi centre'],
      needs: ['Aadhaar', 'Registration at the Anganwadi centre'],
      state: 'active',
      stages: [
        { label: 'Enrolled at Anganwadi',        state: 'done', date: ago(130), amount: 0 },
        { label: 'Ration collected — September', state: 'done', date: ago(8), amount: 0 },
        { label: 'Ration for October',           state: 'pending', date: null, amount: 0,
          note: 'Collect from the Anganwadi centre after the 1st' },
      ],
      verify: 'Run by the Ministry of Women and Child Development.',
    },
    {
      code: 'FREE', short: 'Free care', name: 'Free delivery and transport (JSSK)',
      what: 'Free delivery, free medicines, free tests, free food in hospital, and a free ambulance both ways. You should not be asked to pay for any of it.',
      amount: 'No charge at all.',
      who: ['Every pregnant woman at a government facility', 'Every sick newborn up to one year'],
      needs: ['Nothing. Call 102 for the ambulance.'],
      state: 'active',
      stages: [{ label: 'Available to you now', state: 'done', date: null, amount: 0 }],
      verify: 'Janani Shishu Suraksha Karyakram. If anyone asks you for money, tell your ASHA or the PHC.',
    },
  ],
  mother: [
    {
      code: 'PMMVY', short: 'PMMVY', name: 'Pradhan Mantri Matru Vandana Yojana',
      what: 'The last part of your maternity payment, released after the birth is registered and the baby has had the first vaccines.',
      amount: 'Final instalment of the ₹5,000 total.',
      who: ['Mothers whose child has been registered and immunised on schedule'],
      needs: ['Birth certificate', 'MCP card showing BCG given'],
      state: 'blocked',
      stages: [
        { label: 'First instalment',  state: 'done',    date: ago(240), amount: 3000 },
        { label: 'Second instalment', state: 'done',    date: ago(150), amount: 2000 },
        { label: 'Final instalment',  state: 'blocked', date: null, amount: 0,
          blocker: "Aarav's birth certificate has not been uploaded.",
          fix: 'Apply for the birth certificate at the panchayat office with the discharge slip from the PHC, then give a copy to your ASHA.' },
      ],
      verify: 'Check pmmvy.wcd.gov.in.',
    },
    {
      code: 'JSY', short: 'JSY', name: 'Janani Suraksha Yojana',
      what: 'The cash help for delivering at a government facility.',
      amount: '₹1,400 — already paid to you.',
      who: ['Women who delivered at a government or accredited facility'],
      needs: ['Already completed'],
      state: 'active',
      stages: [{ label: 'Paid on discharge', state: 'done', date: ago(86), amount: 1400 }],
      verify: 'Check nhm.gov.in.',
    },
    {
      code: 'IMM', short: 'Immunisation', name: 'Universal Immunisation Programme',
      what: "All of your baby's vaccines are free, at the Anganwadi centre or the health centre, on the schedule below.",
      amount: 'Free.',
      who: ['Every child up to 16 years, on the national schedule'],
      needs: ['MCP card at every visit'],
      state: 'due',
      stages: [
        { label: 'BCG, OPV-0, Hepatitis B — at birth', state: 'done', date: ago(92), amount: 0 },
        { label: 'Penta-1, OPV-1, Rota-1, PCV-1 — 6 weeks', state: 'done', date: ago(48), amount: 0 },
        { label: 'Penta-2, OPV-2, Rota-2 — 10 weeks', state: 'blocked', date: null, amount: 0,
          blocker: 'This dose is due today.',
          fix: 'Go to the Anganwadi centre today with the MCP card. If you miss it, the next session is next Wednesday.' },
        { label: 'Penta-3, OPV-3, Rota-3, PCV-2 — 14 weeks', state: 'pending', date: null, amount: 0 },
        { label: 'Measles-Rubella 1 and Vitamin A — 9 months', state: 'pending', date: null, amount: 0 },
      ],
      verify: 'National Immunization Schedule, Ministry of Health and Family Welfare.',
    },
    {
      code: 'ICDS', short: 'Anganwadi', name: 'Growth monitoring and nutrition (ICDS)',
      what: 'Your baby is weighed every month at the Anganwadi centre, and you receive take-home ration while you are breastfeeding.',
      amount: 'Monthly ration. No cash.',
      who: ['Breastfeeding mothers and children under six'],
      needs: ['Registration at the Anganwadi centre'],
      state: 'active',
      stages: [
        { label: 'Month 1 weighed', state: 'done', date: ago(66), amount: 0 },
        { label: 'Month 2 weighed', state: 'done', date: ago(36), amount: 0 },
        { label: 'Month 3 weighed', state: 'done', date: ago(6), amount: 0 },
        { label: 'Month 4 weighing', state: 'pending', date: null, amount: 0 },
      ],
      verify: 'Ministry of Women and Child Development.',
    },
  ],
}

export const WOMAN_NEWS = {
  pregnant: [
    { id: 'n1', tag: 'foryou', date: ago(1), title: 'You may be eligible for a higher PMMVY amount',
      body: 'If this is your second child and the child is a girl, the maternity benefit is ₹6,000 instead of ₹5,000. Ask your ASHA to check your record so the correct amount is claimed.',
      source: 'Ministry of Women and Child Development' },
    { id: 'n2', tag: 'village', date: ago(2), title: 'Health camp in Rampur on 25 September',
      body: 'Free haemoglobin and blood-pressure testing for pregnant women, 9 am to 2 pm at the panchayat bhawan. Bring your MCP card. No appointment needed.',
      source: 'Rampur Primary Health Centre' },
    { id: 'n3', tag: 'village', date: ago(6), title: 'Village Health and Nutrition Day every Wednesday',
      body: 'Antenatal check-ups, immunisation and take-home ration are all available at the Anganwadi centre on Wednesday mornings.',
      source: 'Rampur Anganwadi centre' },
    { id: 'n4', tag: 'general', date: ago(11), title: 'Free ambulance — dial 102',
      body: 'The 102 ambulance is free for pregnant women and for infants, day or night. It will take you to the facility and bring you home again.',
      source: 'Janani Shishu Suraksha Karyakram' },
    { id: 'n5', tag: 'general', date: ago(18), title: 'You should not pay for delivery at a government facility',
      body: 'Delivery, medicines, tests, blood and food in hospital are all free at a government facility. If you are asked to pay, tell your ASHA or the PHC in charge.',
      source: 'Janani Shishu Suraksha Karyakram' },
  ],
  mother: [
    { id: 'n1', tag: 'foryou', date: ago(0), title: "Aarav's Penta-2 dose is due today",
      body: 'The 10-week dose protects against five diseases. Go to the Anganwadi centre with the MCP card. If you cannot go today, the next session is Wednesday.',
      source: 'National Immunization Schedule' },
    { id: 'n2', tag: 'foryou', date: ago(3), title: 'Your final PMMVY instalment is waiting on one document',
      body: "Aarav's birth certificate has not reached the system yet. Apply at the panchayat office with the PHC discharge slip.",
      source: 'Ministry of Women and Child Development' },
    { id: 'n3', tag: 'village', date: ago(6), title: 'Weighing day at the Anganwadi, every first Wednesday',
      body: 'Bring your baby for monthly weighing. Growth is tracked so that any problem is caught early.',
      source: 'Rampur Anganwadi centre' },
    { id: 'n4', tag: 'general', date: ago(14), title: 'Only breast milk for the first six months',
      body: 'No water, no honey, no other milk. Breast milk alone gives everything the baby needs and protects against infection.',
      source: 'Ministry of Health and Family Welfare' },
  ],
}

export const WOMAN_DANGER = {
  pregnant: [
    { icon: 'drop', label: 'Bleeding from the vagina', key: 'd.bleeding' },
    { icon: 'head', label: 'Severe headache or blurred vision', key: 'd.headache' },
    { icon: 'thermometer', label: 'High fever', key: 'd.fever' },
    { icon: 'baby', label: 'Baby has stopped moving', key: 'd.notMoving' },
    { icon: 'waves', label: 'Water breaking before time', key: 'd.water' },
    { icon: 'alert', label: 'Severe stomach pain', key: 'd.stomach' },
  ],
  mother: [
    { icon: 'thermometer', label: 'Baby is hot or cold to touch', key: 'd.babyTemp' },
    { icon: 'baby', label: 'Baby is not feeding', key: 'd.notFeeding' },
    { icon: 'pulse', label: 'Fast or difficult breathing', key: 'd.breathing' },
    { icon: 'alert', label: 'Baby is very drowsy or will not wake', key: 'd.drowsy' },
    { icon: 'drop', label: 'Heavy bleeding for you', key: 'd.motherBleeding' },
    { icon: 'waves', label: 'Convulsions or fits', key: 'd.fits' },
  ],
}

export const WOMAN_ASK = {
  pregnant: {
    topics: [
      { icon: 'pulse', label: 'My health' }, { icon: 'wallet', label: 'My money' },
      { icon: 'doc', label: 'My documents' }, { icon: 'calendar', label: 'My visits' },
    ],
    prompts: [
      'Why is my haemoglobin low and what should I eat?',
      'Where has my PMMVY payment reached?',
      'What papers do I need for the delivery?',
      'When is my next check-up?',
    ],
    answers: [
      { match: /haemoglobin|hb|anaemi|anemi|iron|blood low|tired/i,
        text: 'Your haemoglobin at the last check-up was 9.8 g/dL. Below 11 is counted as anaemia in pregnancy, so yours is mildly low — not an emergency, but worth correcting.\n\nWhat helps: take the iron and folic acid tablet every day, after a meal rather than on an empty stomach, and not with tea or milk. Eat green leafy vegetables, jaggery, dates and groundnuts. Taking it with lemon or amla helps your body absorb it.\n\nTell your ASHA if you feel very tired, breathless, or dizzy — that needs a check rather than waiting for the next visit.',
        sources: ['Your ANC 3 record, 6 Sept 2026', 'Anaemia Mukt Bharat guidance'],
        action: { label: 'See all my test results', to: '/woman/records?filter=test' } },
      { match: /pmmvy|payment|money|instal|stuck|not come|paisa/i,
        text: 'Your PMMVY second instalment of ₹2,000 has not been released. The reason recorded is that your Aadhaar is not linked to your bank account.\n\nWhat to do: take your Aadhaar card to your bank branch and ask them to seed Aadhaar to the account. It normally takes 3 to 7 working days. The payment then releases on the next run without you applying again.\n\nYou have already received ₹3,000 of the ₹5,000.',
        sources: ['Your PMMVY application record', 'PMMVY scheme guidelines'],
        action: { label: 'Open my PMMVY tracker', to: '/woman/scheme/PMMVY' } },
      { match: /paper|document|delivery|hospital|admit|bag|deliver/i,
        text: 'Take with you: your MCP card, Aadhaar, bank passbook, and the JSY card if you have one. Your ASHA will come with you and she also carries a copy of your record.\n\nThe delivery itself, the medicines, the tests and the food in hospital are all free at a government facility, and the 102 ambulance is free both ways. You should not be asked to pay for any of it.',
        sources: ['Janani Shishu Suraksha Karyakram', 'Your household record'] },
      { match: /next|visit|check.?up|anc|appointment|kab/i,
        text: 'Your next check-up is ANC 3 on 28 September at Rampur Primary Health Centre.\n\nAt this visit they will check your weight, blood pressure and haemoglobin again, listen to the baby, and give your second Td injection, which is due 28 days after the first.',
        sources: ['Your RCH record'],
        action: { label: 'See my full history', to: '/woman/records' } },
    ],
    fallback: 'I can tell you what is in your own record, explain any scheme, and say where an application has reached. For anything about how you are feeling right now, please speak to your ASHA — she can see you, and I cannot.',
  },
  mother: {
    topics: [
      { icon: 'syringe', label: 'Vaccines' }, { icon: 'growth', label: "Baby's growth" },
      { icon: 'wallet', label: 'My money' }, { icon: 'baby', label: 'Feeding' },
    ],
    prompts: [
      'Which vaccine is due now and where do I go?',
      'Is my baby growing well?',
      'Why has my last PMMVY payment not come?',
      'How often should I feed the baby?',
    ],
    answers: [
      { match: /vaccine|penta|immunis|immuniz|tika|dose|injection/i,
        text: "Aarav's Penta-2 dose is due today. It falls at 10 weeks and is given together with OPV-2 and Rota-2.\n\nWhere: the Anganwadi centre in Rampur, or the PHC. Take the MCP card with you. If you cannot go today, the next immunisation session is on Wednesday — a few days late is far better than skipping it.\n\nA mild fever for a day afterwards is normal, as happened after Penta-1.",
        sources: ["Aarav's U-WIN record", 'National Immunization Schedule'],
        action: { label: 'See the full vaccine schedule', to: '/woman/scheme/IMM' } },
      { match: /grow|weight|weigh|small|thin|kg/i,
        text: 'Aarav weighed 5.2 kg at the month-3 weighing, up from 2.9 kg at birth. That is inside the normal band for his age, and the rise has been steady each month.\n\nKeep going to the Anganwadi weighing day every month — a single weight tells you little, but the line over several months tells you a lot.',
        sources: ['Growth monitoring record, month 3', 'Poshan Tracker'],
        action: { label: 'See his growth record', to: '/woman/records?filter=growth' } },
      { match: /pmmvy|payment|money|instal|stuck|not come|paisa/i,
        text: "Your final PMMVY instalment is held because Aarav's birth certificate has not reached the system.\n\nWhat to do: go to the panchayat office with the discharge slip from the PHC and apply for the birth certificate, then give a copy to your ASHA. She will attach it and the instalment releases on the next run.\n\nYou have already received ₹5,000 in the first two instalments.",
        sources: ['Your PMMVY application record'],
        action: { label: 'Open my PMMVY tracker', to: '/woman/scheme/PMMVY' } },
      { match: /feed|milk|breast|water|food|dudh/i,
        text: 'For the first six months, only breast milk — no water, no honey, no other milk, even in hot weather. Breast milk is mostly water and gives everything he needs.\n\nFeed whenever he wants, roughly 8 to 12 times in a day and night, and let him finish one side before switching so he gets the richer milk at the end.\n\nAt six months you start other food alongside, and keep breastfeeding.',
        sources: ['Ministry of Health and Family Welfare, infant feeding guidance'] },
    ],
    fallback: 'I can tell you what is in your own record, explain any scheme, and say where an application has reached. If you are worried about how the baby is right now, call your ASHA — she can see him, and I cannot.',
  },
}
