import { buildSubjectFacts } from './prefill'
import { nextVaccineDue } from '../data/derivations'

const value = v => {
  if (v === undefined || v === null || v === '') return null
  if (v === true) return 'Yes'
  if (v === false) return 'No'
  if (Array.isArray(v)) return v.filter(x => x !== 'none').join(', ') || 'None'
  return String(v)
}

const date = v => {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return value(v)
  return new Date(`${v}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const details = (facts, household) => {
  const line = (label, path, format = value) => {
    const v = format(facts[path])
    return v ? `${label}: ${v}` : null
  }
  return [
    line('Village', 'household.village'),
    line('House', 'household.houseNo'),
    line('LMP', 'pregnancy.lmp', date),
    line('Expected delivery', 'pregnancy.edd', date),
    line('Pregnancy weeks', 'pregnancy.gestWeeks'),
    line('Haemoglobin', 'vitals.hb', v => v == null ? null : `${v} g/dL`),
    line('Blood pressure', 'vitals.bpSys', v => v == null ? null : `${v}/${facts['vitals.bpDia'] ?? '—'} mm Hg`),
    line('Weight', 'vitals.weight', v => v == null ? null : `${v} kg`),
    line('High-risk pregnancy', 'pregnancy.isHighRisk'),
    line('Child date of birth', 'child.dob', date),
    line('Vaccines due', 'imm.dueList'),
    line('Next vaccine', 'imm.nextDue'),
    line('CBAC score', 'ncd.cbacScore'),
    line('NCD screening required', 'ncd.screenRequired'),
    line('Referral', 'referral.any'),
  ].filter(Boolean)
}

/**
 * A compact, explicit record context for the worker assistant. It is built
 * only from facts already held on the device for the selected person.
 */
export function buildAshaSubject({ household, member, encounters = [], tasks = [], learned = {} }) {
  const { facts, trace } = buildSubjectFacts({ household, member, encounters, learned })
  const recent = [...encounters]
    .sort((a, b) => String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date)))
    .slice(0, 3)
    .map(e => `${e.type || 'Visit'} on ${date(String(e.createdAt || e.date || '').slice(0, 10))}`)
  const dueTasks = tasks
    .filter(t => t.memberId === member.id || !t.memberId)
    .slice(0, 4)
    .map(t => `${t.title || t.reason}${t.due ? ` — due ${date(t.due)}` : ''}`)

  const summary = details(facts, household)
  const prompt = [
    `Name: ${member.name}; age: ${member.age}; sex: ${member.sex || 'not recorded'}`,
    `Household: house ${household?.houseNo || '—'}, ${household?.village || '—'}`,
    summary.length ? `Known record facts:\n- ${summary.join('\n- ')}` : 'Known record facts: none yet.',
    recent.length ? `Recent visits:\n- ${recent.join('\n- ')}` : null,
    dueTasks.length ? `Open follow-ups:\n- ${dueTasks.join('\n- ')}` : null,
  ].filter(Boolean).join('\n')

  return {
    id: member.id,
    name: member.name,
    age: member.age,
    household,
    member,
    facts,
    trace,
    summary,
    recent,
    dueTasks,
    prompt,
  }
}

/** Offline, deterministic lookup for the most common person-specific asks. */
export function answerAshaOffline(question, subject, fallback) {
  if (!subject) return fallback
  const q = String(question || '').toLowerCase()
  const f = subject.facts
  const title = `${subject.name}'s record`

  if (/record|summary|detail|about (this|him|her|person)|who is/.test(q)) {
    return {
      text: `${title}: ${subject.summary.join(' · ') || 'no clinical facts recorded yet.'}` +
        (subject.dueTasks.length ? `\n\nOpen follow-ups:\n• ${subject.dueTasks.join('\n• ')}` : ''),
      sources: ['Selected local record'],
      via: 'local record',
    }
  }
  if (/haemoglob|hemoglob|\bhb\b|anaemi|anemi/.test(q)) {
    const hb = f['vitals.hb']
    return {
      text: hb == null
        ? `${title} has no haemoglobin result recorded yet. Arrange the routine check-up or confirm it from the MCP card.`
        : `${title} shows haemoglobin ${hb} g/dL. The app cannot diagnose or prescribe; follow the current ANC protocol and refer to the ANM/PHC if the result or symptoms need attention.`,
      sources: ['Selected local record'], via: 'local record',
    }
  }
  if (/blood pressure|\bbp\b|pressure/.test(q)) {
    const sys = f['vitals.bpSys'], dia = f['vitals.bpDia']
    return {
      text: sys == null
        ? `${title} has no blood-pressure reading recorded yet.`
        : `${title} shows blood pressure ${sys}/${dia ?? '—'} mm Hg. Confirm the reading and follow the current referral protocol; this assistant does not make a diagnosis.`,
      sources: ['Selected local record'], via: 'local record',
    }
  }
  if (/delivery|due date|edd|last period|\blmp\b|pregnan/.test(q)) {
    const edd = f['pregnancy.edd']
    return {
      text: edd
        ? `${title} has expected delivery ${date(edd)}${f['pregnancy.gestWeeks'] != null ? ` and is about ${f['pregnancy.gestWeeks']} weeks pregnant` : ''}.`
        : `${title} has no pregnancy due date recorded yet.`,
      sources: ['Selected local record'], via: 'local record',
    }
  }
  if (/vaccine|vaccin|immuni|penta|bcg|opv/.test(q)) {
    const next = nextVaccineDue(f['child.dob'])
    return {
      text: f['imm.dueList']
        ? `${title} has these doses due now: ${f['imm.dueList']}.${f['imm.nextDue'] ? ` Next milestone: ${f['imm.nextDue']}.` : ''}`
        : next
          ? `${title}'s next vaccine milestone is ${next.milestone} on ${date(next.date)}: ${next.names.join(', ')}.`
          : `${title} has no child date of birth recorded, so the vaccine schedule cannot be calculated yet.`,
      sources: ['Selected local record', 'National Immunization Schedule'], via: 'local record',
    }
  }
  if (/follow.?up|task|visit due|what.*due|next visit/.test(q)) {
    return {
      text: subject.dueTasks.length
        ? `${title} has these open follow-ups:\n• ${subject.dueTasks.join('\n• ')}`
        : `${title} has no open follow-up recorded on this phone.`,
      sources: ['Selected local record'], via: 'local record',
    }
  }

  return {
    text: `I am offline, so I can only look up ${subject.name}'s saved record right now. ${subject.summary.length ? `Known details: ${subject.summary.slice(0, 4).join(' · ')}.` : 'No clinical details are recorded yet.'}\n\nFor a general programme or workflow question, connect a Gemini or Grok model under More → Models.`,
    sources: ['Selected local record'], via: 'local record',
  }
}
