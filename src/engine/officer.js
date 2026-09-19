import { db } from '../db/db'
import { caseloadMatrix } from './caseload'
import { OFFICER_ASHAS, SUPPLY_REQUESTS, MEDICINE_KIT } from '../data/seed'

/* =========================================================================
   The block picture.

   One worker in this roster is not data — she is the phone the app is running
   on. Her households, her people, her pregnancies, her overdue visits and her
   drug kit are read from the local database, so a visit recorded in the field
   moves the officer's number in front of him. Everything else stands in for
   the other sub-centres.

   What this deliberately does not compute: a score, a rank, or any ordering of
   women by output. The sorts here are by *need* — who is carrying the most,
   who is waiting longest for supplies — because the only useful thing an
   officer can do with this screen is send help.
   ========================================================================= */

const days = d => Math.max(0, Math.round((new Date() - new Date(d)) / 86400000))

export async function buildBlock() {
  const [households, members, tasks, kit] = await Promise.all([
    db.households.toArray(), db.members.toArray(), db.tasks.toArray(),
    db.medicineKit.toArray().catch(() => []),
  ])

  const m = caseloadMatrix({ households, members, tasks })
  const live = {
    households: m.households,
    people: m.people,
    pregnant: m.rows.find(r => r.key === 'pregnant')?.n ?? 0,
    under5: m.rows.find(r => r.key === 'under5')?.n ?? 0,
    due: tasks.filter(t => t.level === 'due').length,
    overdue: tasks.filter(t => t.level === 'late').length,
  }

  // the live worker's row comes from her phone, not from the roster
  const ashas = OFFICER_ASHAS.map(a => (a.live ? { ...a, ...live, fromDevice: true } : a))

  /* Her kit is the real one. An item at or below its minimum is a request the
     officer has not been sent — it is simply visible. */
  const stock = (kit.length ? kit : MEDICINE_KIT)
  const liveNeeds = stock
    .filter(i => i.qty <= i.minQty)
    .map(i => ({
      id: 'live-' + i.id, ashaId: OFFICER_ASHAS.find(a => a.live).id, medicineId: i.id,
      item: i.name, qty: Math.max(i.minQty * 2 - i.qty, i.minQty), unit: i.unit,
      raised: new Date().toISOString(), fromDevice: true,
      urgency: i.qty === 0 ? 'late' : 'due',
      why: i.qty === 0
        ? `Out of stock on her phone right now. Minimum is ${i.minQty} ${i.unit}.`
        : `Down to ${i.qty} ${i.unit}, at or below the minimum of ${i.minQty}.`,
    }))

  const byId = Object.fromEntries(ashas.map(a => [a.id, a]))
  const requests = [...liveNeeds, ...SUPPLY_REQUESTS]
    .map(r => ({ ...r, asha: byId[r.ashaId], waiting: days(r.raised) }))
    .sort((a, b) => (RANK[b.urgency] - RANK[a.urgency]) || (b.waiting - a.waiting))

  const villages = [...new Set(ashas.map(a => a.village))].map(name => {
    const mine = ashas.filter(a => a.village === name)
    const sum = k => mine.reduce((n, a) => n + (a[k] || 0), 0)
    const due = sum('due') + sum('overdue')
    const visits = sum('visits')
    return {
      name, ashas: mine.length,
      households: sum('households'), people: sum('people'),
      pregnant: sum('pregnant'), under5: sum('under5'),
      visits, due: sum('due'), overdue: sum('overdue'),
      synced: Math.round(sum('synced') / mine.length),
      // share of the work in front of her that has been done, not a grade
      coverage: Math.round((visits / Math.max(visits + due, 1)) * 100),
      waiting: requests.filter(r => r.asha?.village === name).length,
    }
  })

  const total = k => ashas.reduce((n, a) => n + (a[k] || 0), 0)

  return {
    ashas, villages, requests,
    totals: {
      ashas: ashas.length,
      villages: villages.length,
      households: total('households'),
      people: total('people'),
      pregnant: total('pregnant'),
      under5: total('under5'),
      visits: total('visits'),
      due: total('due'),
      overdue: total('overdue'),
      waiting: requests.length,
      unsynced: ashas.filter(a => a.synced < 90).length,
    },
    /* Who to help first. Load is what she is carrying; the flag says why. */
    needsSupport: ashas
      .map(a => ({
        ...a,
        load: a.households + a.overdue * 3,
        flags: [
          a.overdue >= 5 && `${a.overdue} overdue visits`,
          a.synced < 90 && `not synced, ${100 - a.synced}% behind`,
          a.households >= 28 && `${a.households} families — above the usual load`,
          requests.some(r => r.ashaId === a.id && r.urgency === 'late') && 'waiting on supplies',
        ].filter(Boolean),
      }))
      .filter(a => a.flags.length)
      .sort((a, b) => b.flags.length - a.flags.length || b.load - a.load),
  }
}

const RANK = { late: 3, due: 2, info: 1 }

export const DRUGS_MONITORED = [
  { id: 'ifa', name: 'IFA Red Tablets', keyName: 'IFA tablets (red)', category: 'Maternal health', unit: 'tablets', threat: 'Maternal Anemia' },
  { id: 'ors', name: 'ORS Sachets', keyName: 'ORS sachets', category: 'Child health', unit: 'sachets', threat: 'Diarrhea Dehydration' },
  { id: 'cq', name: 'Chloroquine / ACT', keyName: 'Chloroquine tabs', category: 'Seasonal / Fever', unit: 'tablets', threat: 'Monsoon Malaria Surge' },
  { id: 'pcm', name: 'Paracetamol 500mg', keyName: 'Paracetamol 500mg', category: 'General', unit: 'tablets', threat: 'Viral Fever & Flu' },
  { id: 'ptk', name: 'Pregnancy Kits', keyName: 'Pregnancy test kits', category: 'Maternal health', unit: 'kits', threat: 'Delayed ANC Intake' },
  { id: 'san', name: 'Sanitary Napkins', keyName: 'Sanitary napkins', category: 'Adolescent', unit: 'packs', threat: 'Menstrual Hygiene' },
]

export const DEPOT_BATCHES = {
  'IFA tablets (red)': [
    { batchNo: 'IFA-2026-B08', exp: '2027-11-30', qty: 4500, state: 'valid', mfg: 'Karnataka Antibiotics', daysLeft: 437, fefoRank: 1 },
    { batchNo: 'IFA-2025-A14', exp: '2026-11-15', qty: 1200, state: 'near-expiry', mfg: 'IDPL India', daysLeft: 57, fefoRank: 0 },
    { batchNo: 'IFA-2024-X01', exp: '2026-08-31', qty: 300, state: 'expired', mfg: 'IDPL India', daysLeft: -19, blocked: true },
  ],
  'Calcium tablets': [
    { batchNo: 'CAL-2026-C02', exp: '2028-01-20', qty: 3200, state: 'valid', mfg: 'Hindustan Antibiotics', daysLeft: 488, fefoRank: 1 },
  ],
  'ORS sachets': [
    { batchNo: 'ORS-2026-D11', exp: '2027-09-15', qty: 850, state: 'valid', mfg: 'FDC Limited', daysLeft: 361, fefoRank: 1 },
    { batchNo: 'ORS-2024-E09', exp: '2026-07-30', qty: 120, state: 'expired', mfg: 'FDC Limited', daysLeft: -51, blocked: true },
  ],
  'MCP cards': [
    { batchNo: 'MCP-2026-P01', exp: '2029-12-31', qty: 500, state: 'valid', mfg: 'Govt Security Press', daysLeft: 1198, fefoRank: 1 },
  ],
  'Chlorhexidine gel': [
    { batchNo: 'CHX-2026-G03', exp: '2027-10-31', qty: 150, state: 'valid', mfg: 'Neon Labs', daysLeft: 407, fefoRank: 1 },
  ],
  'Sanitary napkins': [
    { batchNo: 'SAN-2026-N04', exp: '2028-05-31', qty: 600, state: 'valid', mfg: 'HLL Lifecare', daysLeft: 619, fefoRank: 1 },
  ],
  'Chloroquine tabs': [
    { batchNo: 'CQ-2026-M02', exp: '2027-06-30', qty: 900, state: 'valid', mfg: 'Bengal Chemicals', daysLeft: 284, fefoRank: 1 },
  ],
  'Pregnancy test kits': [
    { batchNo: 'PTK-2026-K05', exp: '2027-04-30', qty: 240, state: 'valid', mfg: 'HLL Lifecare', daysLeft: 223, fefoRank: 1 },
  ],
  'Paracetamol 500mg': [
    { batchNo: 'PCM-2026-F09', exp: '2027-12-31', qty: 2800, state: 'valid', mfg: 'Cipla India', daysLeft: 468, fefoRank: 1 },
  ],
}

export function getDepotBatches(itemName) {
  // Normalize match
  const matchKey = Object.keys(DEPOT_BATCHES).find(k =>
    k.toLowerCase().includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(k.toLowerCase())
  )
  return matchKey ? DEPOT_BATCHES[matchKey] : [
    { batchNo: 'STD-2026-01', exp: '2027-12-31', qty: 1000, state: 'valid', mfg: 'Central Depot', daysLeft: 468, fefoRank: 1 }
  ]
}

/** Village Stockout Heatmap matrix calculation */
export async function villageStockHeatmap() {
  const kit = await db.medicineKit.toArray().catch(() => [])
  const liveIfa = kit.find(k => k.name.toLowerCase().includes('ifa'))?.qty ?? 45
  const liveOrs = kit.find(k => k.name.toLowerCase().includes('ors'))?.qty ?? 8
  const livePcm = kit.find(k => k.name.toLowerCase().includes('paracetamol'))?.qty ?? 24

  const baseVillages = [
    {
      name: 'Rampur',
      ashasCount: 4,
      population: 310,
      pregnant: 18,
      under5: 42,
      riskLevel: 'low',
      drugs: {
        'ifa': { stock: liveIfa + 135, burn: 45, days: Math.round(((liveIfa + 135) / 45) * 7) },
        'ors': { stock: liveOrs + 34, burn: 10, days: Math.round(((liveOrs + 34) / 10) * 7) },
        'cq': { stock: 35, burn: 8, days: 30 },
        'pcm': { stock: livePcm + 86, burn: 25, days: Math.round(((livePcm + 86) / 25) * 7) },
        'ptk': { stock: 8, burn: 2, days: 28 },
        'san': { stock: 28, burn: 6, days: 32 },
      }
    },
    {
      name: 'Kishanpur',
      ashasCount: 3,
      population: 240,
      pregnant: 15,
      under5: 38,
      riskLevel: 'critical',
      alert: 'Active Malaria & Anemia threat. Chloroquine and IFA critical.',
      drugs: {
        'ifa': { stock: 12, burn: 35, days: 2 }, // Critical
        'ors': { stock: 14, burn: 20, days: 5 }, // Critical
        'cq': { stock: 8, burn: 14, days: 4 },   // Critical
        'pcm': { stock: 25, burn: 18, days: 10 }, // Low
        'ptk': { stock: 2, burn: 3, days: 5 },   // Critical
        'san': { stock: 8, burn: 8, days: 7 },   // Low
      }
    },
    {
      name: 'Bela',
      ashasCount: 3,
      population: 180,
      pregnant: 9,
      under5: 28,
      riskLevel: 'good',
      drugs: {
        'ifa': { stock: 95, burn: 25, days: 26 },
        'ors': { stock: 38, burn: 8, days: 33 },
        'cq': { stock: 20, burn: 6, days: 23 },
        'pcm': { stock: 80, burn: 15, days: 37 },
        'ptk': { stock: 6, burn: 2, days: 21 },
        'san': { stock: 35, burn: 5, days: 49 },
      }
    },
    {
      name: 'Sohagpur',
      ashasCount: 2,
      population: 210,
      pregnant: 11,
      under5: 31,
      riskLevel: 'warning',
      alert: 'Summer/Monsoon dehydration risk. ORS below 5 days cover.',
      drugs: {
        'ifa': { stock: 40, burn: 28, days: 10 }, // Warning
        'ors': { stock: 9, burn: 16, days: 4 },   // Critical
        'cq': { stock: 12, burn: 10, days: 8 },   // Warning
        'pcm': { stock: 32, burn: 16, days: 14 }, // Warning
        'ptk': { stock: 4, burn: 2, days: 14 },
        'san': { stock: 18, burn: 6, days: 21 },
      }
    }
  ]

  // Add status tags
  const villages = baseVillages.map(v => {
    const enrichedDrugs = {}
    let criticalCount = 0
    let warningCount = 0

    for (const d of DRUGS_MONITORED) {
      const data = v.drugs[d.id]
      const status = data.days < 7 ? 'critical' : data.days <= 14 ? 'warning' : 'good'
      if (status === 'critical') criticalCount++
      if (status === 'warning') warningCount++
      enrichedDrugs[d.id] = { ...data, status }
    }

    return {
      ...v,
      drugs: enrichedDrugs,
      criticalCount,
      warningCount,
      status: criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'good'
    }
  })

  return {
    drugs: DRUGS_MONITORED,
    villages,
    season: {
      name: 'Monsoon High-Transmission Season (Week 3)',
      threat: 'Vectors (Malaria/Dengue) + Water-borne Diarrhea',
      highRiskVillages: ['Kishanpur', 'Sohagpur']
    },
    criticalCellsCount: villages.reduce((acc, v) => acc + v.criticalCount, 0),
    warningCellsCount: villages.reduce((acc, v) => acc + v.warningCount, 0),
  }
}

/** Send stock to the live worker's kit. The officer's action reaches her phone. */
export async function dispatchToDevice({ medicineId, qty, batchNo = 'IFA-2026-B08' }) {
  const item = await db.medicineKit.get(medicineId)
  if (!item) return null
  await db.medicineKit.update(medicineId, {
    qty: item.qty + qty, lastRestocked: new Date().toISOString(),
  })
  await db.medicineLog.add({
    medicineId, medicineName: item.name, type: 'restock',
    qty, unit: item.unit, to: '', note: `Dispatched by PHC Depot · Batch: ${batchNo} · DVDMS GP-4821`,
    date: new Date().toISOString(),
  })
  return { ...item, qty: item.qty + qty }
}

/** "1 piece", not "1 pieces". ml and similar never take an s. */
export function units(qty, unit) {
  const u = String(unit || '')
  if (qty === 1 && /s$/.test(u) && !/^(ml|mls)$/i.test(u)) return u.replace(/ies$/, 'y').replace(/s$/, '')
  return u
}

export { days }

