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

/** Send stock to the live worker's kit. The officer's action reaches her phone. */
export async function dispatchToDevice({ medicineId, qty }) {
  const item = await db.medicineKit.get(medicineId)
  if (!item) return null
  await db.medicineKit.update(medicineId, {
    qty: item.qty + qty, lastRestocked: new Date().toISOString(),
  })
  await db.medicineLog.add({
    medicineId, medicineName: item.name, type: 'restock',
    qty, unit: item.unit, to: '', note: 'Dispatched by the block store',
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
