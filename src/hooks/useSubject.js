import { useEffect, useState, useCallback } from 'react'
import { db, getLearned } from '../db/db'
import { buildSubjectFacts } from '../engine/prefill'
import {
  WOMAN, WOMAN_TIMELINE, WOMAN_SCHEMES, WOMAN_NEWS, WOMAN_DANGER,
} from '../data/seed'

/**
 * Everything known about the beneficiary, read from the same local database
 * the ASHA writes to. A visit she records shows up here without a round trip.
 */
export function useSubject(mode) {
  const w = WOMAN[mode]
  const [s, setS] = useState(null)

  const load = useCallback(async () => {
    const [member, household, baby] = await Promise.all([
      db.members.get(w.memberId),
      db.households.get(w.householdId),
      w.babyId ? db.members.get(w.babyId) : Promise.resolve(null),
    ])

    const ids = [w.memberId, w.babyId].filter(Boolean)
    const [encounters, submissions, learned] = await Promise.all([
      db.encounters.where('memberId').anyOf(ids).toArray(),
      db.formSubmissions.where('memberId').anyOf(ids).toArray(),
      getLearned(w.memberId),
    ])

    const { facts, trace } = buildSubjectFacts({ household, member, encounters, learned })

    // seeded history, plus anything recorded since
    const live = [
      ...encounters.map(e => ({
        id: e.id, kind: kindOf(e), date: e.createdAt || e.date,
        title: e.summary || e.type, by: 'ASHA ' + (e.ashaName || 'Sunita Yadav'),
        values: pickValues(e.facts), sentTo: outputsOf(e), fresh: true,
      })),
      ...submissions.map(f => ({
        id: f.id, kind: 'document', date: f.createdAt,
        title: f.formName + ' submitted', by: 'ASHA Sunita Yadav',
        detail: `${f.stats?.total} fields · ${f.typedCount} entered at the visit`,
        sentTo: [f.formCode], fresh: true,
      })),
    ]

    const timeline = [...live, ...WOMAN_TIMELINE[mode]]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))

    setS({
      mode, w, member, household, baby, facts, trace,
      encounters, submissions, timeline,
      schemes: WOMAN_SCHEMES[mode],
      news: WOMAN_NEWS[mode],
      danger: WOMAN_DANGER[mode],
      liveCount: live.length,
    })
  }, [mode, w.memberId, w.householdId, w.babyId])

  useEffect(() => { load() }, [load])
  return [s, load]
}

const kindOf = e => {
  const t = (e.type || '').toLowerCase()
  if (t.includes('vaccine') || t.includes('immunis')) return 'vaccine'
  if (t.includes('newborn')) return 'checkup'
  if (t.includes('survey')) return 'document'
  return 'checkup'
}

const LABELS = {
  'vitals.weight': ['Weight', ' kg'], 'vitals.hb': ['Haemoglobin', ' g/dL'],
  'vitals.height': ['Height', ' cm'], 'pregnancy.lmp': ['Last period', ''],
  'pregnancy.edd': ['Expected delivery', ''], 'pregnancy.gestWeeks': ['Weeks pregnant', ''],
  'tt.dose1Given': ['TT/Td dose 1', ''], 'ifa.given': ['IFA tablets', ''],
}

function pickValues(facts = {}) {
  const out = []
  if (facts['vitals.bpSys']) out.push(['Blood pressure', `${facts['vitals.bpSys']} / ${facts['vitals.bpDia']}`])
  for (const [path, [label, unit]] of Object.entries(LABELS)) {
    const v = facts[path]
    if (v === undefined || v === null || v === '') continue
    out.push([label, v === true ? 'Given' : v === false ? 'Not given' : `${v}${unit}`])
  }
  return out.length ? out : undefined
}

const outputsOf = e => e.outputCount
  ? ['RCH portal', 'Monthly report', 'Village register'].slice(0, Math.min(3, e.outputCount))
  : []
