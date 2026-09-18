import { DERIVATIONS, riskReasons } from '../data/derivations'

/** A rule may be restricted to certain encounter types. */
const applies = (rule, type) => !rule.only || !type || rule.only.includes(type)

/** First rule wins when two rules produce the same path (see child.dobOrExpected). */
const RULE_BY_OUT = {}
for (const r of DERIVATIONS) if (!(r.out in RULE_BY_OUT)) RULE_BY_OUT[r.out] = r

/**
 * Paths that could be produced if `supply` were all available.
 *
 * `supply` is read as INPUTS ONLY. A path that a human could also be asked for
 * still counts as derivable — that is the whole point: the sex of a woman in a
 * pregnancy encounter, or a baby's date of birth on an HBNC visit, are known
 * from other answers and must never become a question.
 */
export function derivableClosure(supply, encounterType) {
  const have = new Set(supply)
  const derived = new Set()
  let changed = true
  while (changed) {
    changed = false
    for (const rule of DERIVATIONS) {
      if (!applies(rule, encounterType)) continue
      if (derived.has(rule.out)) continue
      if (rule.needs.every(n => have.has(n) || derived.has(n))) {
        derived.add(rule.out)
        changed = true
      }
    }
  }
  return derived
}

/**
 * Walk the rules backwards from what the registers want, and return the raw
 * answers that actually have to be collected to get there.
 *
 * Without this, a computed field such as "malaria rapid test positive" would be
 * reported as derived while the answer it is derived FROM was never asked, and
 * the register would come out blank.
 */
export function derivationInputs(targets, supply, derivable, encounterType) {
  const required = new Set()
  const seen = new Set()

  const want = path => {
    if (seen.has(path)) return
    seen.add(path)
    const rules = DERIVATIONS.filter(r => r.out === path && applies(r, encounterType))
    const usable = rules.find(r => r.needs.every(n => supply.has(n) || derivable.has(n)))
    if (usable) { usable.needs.forEach(want); return }
    if (supply.has(path)) required.add(path)
  }

  targets.forEach(want)
  return required
}

/** Run every rule whose inputs are satisfied, repeatedly, until stable. */
export function runDerivations(facts) {
  const out = { ...facts }
  const type = facts.__encounterType
  const trace = {}
  let changed = true, guard = 0
  while (changed && guard++ < 12) {
    changed = false
    for (const rule of DERIVATIONS) {
      if (!applies(rule, type)) continue
      if (out[rule.out] !== undefined) continue
      if (!rule.needs.every(n => out[n] !== undefined)) continue
      try {
        const v = rule.fn(out)
        if (v !== undefined) {
          out[rule.out] = v
          trace[rule.out] = { why: rule.why, from: rule.needs }
          changed = true
        }
      } catch { /* a rule that cannot run yet simply waits */ }
    }
  }
  if (out['pregnancy.isHighRisk'] !== undefined) out.__riskReasons = riskReasons(out)
  return { facts: out, trace }
}

export const ruleFor = path => RULE_BY_OUT[path]
