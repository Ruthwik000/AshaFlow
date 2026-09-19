# ASHAFlow — project context

> **Read this first.** Single source of truth for what this project is, why each
> decision was made, and what has changed. Anyone (or any AI session) picking
> this up cold should be able to start from this file alone.
>
> **Rule: after every change, add one or two lines to the Memory log at the
> bottom. Newest first. Date, what changed, why.**

---

## 1. What we are building

**ASHAFlow — one visit, one entry, five systems.**

An ASHA (India's community health worker) visits a household once, then writes
substantially the same facts into five separate systems: the RCH portal, U-WIN
immunisation, the HMIS monthly report, the NP-NCD/CBAC screening form, and the
paper village register.

We capture the encounter **once** and generate all five.

Hackathon problem statement: **PS-H02 "One Worker, Five Systems"**.

### The three-line pitch
> We did not build another form. We built a solver that computes the smallest
> set of questions satisfying every downstream programme schema at once. It runs
> offline on the phone, it pays the worker, and the woman can see her own record.

---

## 2. The insight the project rests on

Most teams will build "one form → N JSON outputs". That is the problem
statement's *minimum*, so it scores nothing. A judge's first question is
*"why hasn't the government just merged the databases?"*

Our answer — the duplication is not a mapping problem, it is three problems:

1. **The schemas overlap semantically but not structurally.** RCH wants an LMP
   date, U-WIN wants child vaccine due dates, HMIS wants a monthly *count*, the
   register wants a row. Same conversation at four granularities. A field map
   cannot bridge granularity; a transform can.
2. **The ASHA's pay depends on documentation but is claimed separately**, so the
   paperwork she is most motivated to do is a *sixth* system nobody builds for.
3. **Paper registers are legally mandated.** Any tool that assumes paper
   disappears adds a sixth write instead of removing four.

We address all three. That is the differentiation.

---

## 3. The headline numbers (computed, not hard-coded)

`src/engine/solver.js` → `planEncounter()` produces these at render time from
the five schema files. Change a schema file and the numbers change.

```
87   field entries across 5 registers   (sum of fields in the 5 JSON schemas)
65   unique canonical paths             (duplicates collapsed)
-34  derived                            (computed by rules from other answers)
-12  remembered                         (this household already told us)
-6   skipped                            (skip logic: NCD not applicable under 30)
---
11   questions a human actually answers
```

Worked example: one answer — `pregnancy.lmp = 2 May 2026` — fills 18 fields
(EDD, gestational age, ANC 1–4 windows, Td schedule, the baby's whole first-year
NIS immunisation calendar, and the HMIS row it increments).

Time model: **6.5 seconds per field entry**. That constant is a *guess* — it is
in `src/pages/asha/Proof.jsx` and must be replaced with a real stopwatch result
before the claim is made publicly.

---

## 4. Architecture decisions (and why)

### D1 — The engine runs in the browser, not on the server
The village has no signal. If the solver and mapper live in Python, the app dies
offline and so does the entire claim. Server-side Python re-runs the same rules
only to *verify* and to build exports.

Consequence: the derivation rules exist twice (JS + Python). Accepted
deliberately. Keep rule *definitions* in shared data so only the interpreter is
duplicated.

### D2 — Programme schemas are data, not code
`src/data/programmes/*.json`. A sixth programme is a sixth file, no code change.
This is also what the Schema Reader agent produces.

### D3 — The phone mints the encounter UUID
Append-only log + client-generated ids ⇒ a retry over a flaky connection is
safe. Server does `SELECT by id → skip if present`. No merge logic, no
last-writer-wins, no lost visit.

### D4 — Agents at the edges, rules at the core
Rules run on the phone (fast, offline, auditable, cannot hallucinate). Agents
run on the server, are advisory, and every output is a *proposal* written to a
drafts table that a human promotes. Every run logged in `agent_runs`.

### D5 — Officers get area problems, not worker scores
No per-ASHA ranking, no GPS tracking. Stated on the dashboard itself. The
problem statement explicitly warns against adding a monitoring burden.

---

## 5. Current state

### Built and working (frontend)
- Full Vite + React 18 + Tailwind v4 PWA, installable, offline-capable
- The solver, derivation engine, mapper with provenance, incentive rules
- 5 programme schemas (RCH, U-WIN, HMIS, CBAC, village register)
- Dexie local DB with outbox, simulated sync
- **ASHA app**: Login, Today, Families, Family, Visit type, Consent, Ask Once,
  Review, Outputs fan-out, Paper helper, Earnings, Sync, More, Proof counter
- **Officer**: Dashboard, Schema Reader review UI (fixed sample response)
- **Woman**: Home + danger signs, Benefits, Benefit stage tracking with blocked
  reason, My health, My records with per-programme consent toggles

### Not built yet
- A server to hold the model keys (`VITE_AI_PROXY` is the hook for it)
- Only the **Pregnancy** encounter type is wired. The other five need their own
  question sets and schema mappings — same one-file-per-programme pattern.
- Any measured field trial. Time savings are modelled, not observed.

---

## 6. Architecture: there is no backend, and there are no agents

This was once planned as FastAPI + PostgreSQL + pgvector with four LangChain
agents. **That plan is dropped.** What exists, and what the pitch should claim,
is this:

```
  the phone                                        the network
  ─────────────────────────────────────────        ───────────────
  solver · derivations · mapper · incentives
  caseload matrix · offline answer engine
  prefill · form filling · Dexie + outbox     ──▶  Gemini      (chat, OCR fallback)
  voice loop (SpeechRecognition/Synthesis)    ──▶  xAI / Groq  (OCR, chat fallback)
```

Everything that decides anything runs in the browser. Two HTTPS calls leave it,
both made straight from the page: **chat**, and **reading a photographed form**.
There is no orchestration layer, no queue of autonomous steps, no server.

**Why this is the right shape, not a shortcut.** An ASHA works where there is no
signal. A design whose answers need a server is a design that stops working in
the field. So the solver, the record, the arithmetic and the written answer
engine all run locally and need nothing; the model is an enhancement on top of
something already complete without it. Turn the network off and the app still
captures a visit, produces five records, counts her caseload and answers her
questions from her own data.

**Where the models are used, exactly:**

| Where | Call | If it fails |
|---|---|---|
| ASHA assistant (`askAsha`) | Gemini → xAI/Groq, with her caseload as context | the offline answer engine, which was going to answer anyway |
| Beneficiary chat (`askModel`) | only for a question the written engine does not recognise | the written engine's own "ask your ASHA" answer |
| Scan a form (`extractFormFromImage`) | xAI/Groq vision → Gemini vision | a worked sample, so the flow stays demonstrable |

**The one rule that survived from the agent design:** a model proposes, a person
approves. Nothing a model returns is written to a record of truth on its own —
a scanned form becomes a *draft* form the worker names and saves, a mapping is
shown with its confidence for her to accept, and an answer in the chat changes
nothing at all.

**`VITE_AI_PROXY`** is the hook for the day the keys should not sit in the
browser: set it, and the same two calls go to a small server instead of to the
providers. Nothing else in the app changes.

### The two services called "Grok"

`VITE_GROK_API_KEY` accepts a key from either, and `ai/config.js` reads the
prefix to decide where to send it:

| | prefix | base | chat | vision |
|---|---|---|---|---|
| xAI | `xai-` | `api.x.ai/v1` | `grok-2-latest` | `grok-2-vision-1212` |
| Groq | `gsk_` | `api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | `meta-llama/llama-4-scout-17b-16e-instruct` |

Both are OpenAI-compatible, so one code path serves both, and
`VITE_GROK_PROVIDER` overrides detection.

**Model names are discovered at runtime** (`providers.js`: `liveModels`,
`resolveModel`, `withModel`). Each provider is asked what this key can use, and
the choice is made from that list by a preference order; a name that answers 404
is struck off and the next is tried. A hardcoded name is a time bomb — it is
what broke `gemini-2.0-flash` and the `llama-3.x` names within days of being
written. The `VITE_*_MODEL` variables now only pin a choice, and are ignored
when the key cannot see that model.

## 7. Design system — "tactile minimal"

Chosen deliberately over both flat and full skeuomorphism: sparse layout and a
restrained palette, but every control has real physical depth.

**Depth primitives — all in `src/index.css`. Use these, never ad-hoc shadows.**

| Class | Means | Used for |
|---|---|---|
| `.raise` / `.raise-sm` | lifted off the paper | cards, list containers, keypad keys |
| `.sink` | pressed into the paper | inputs, number readouts, progress tracks, tab strips |
| `.press` | depresses 1.5px on touch | every interactive element |
| `.btn-solid` / `.btn-quiet` / `.btn-dark` / `.btn-danger` | gradient + inner highlight + outer shadow | buttons |
| `.switch-track` / `.switch-knob` | physical toggle | switches |
| `.paper-ground` | warm paper with an SVG grain overlay | the app frame background |
| `.ruled` | ledger rule lines | only where a paper register is being echoed |

Other rules, unchanged:

- Minimum **56px** touch targets, **18px+** text
- Always **icon and word**, never one alone
- Three colours that mean something: green done · amber due · red late — kept
  separate from the brand green
- Speaker button on every question
- **One question per screen.** Never a long scrolling form
- Five items in the bottom bar with **Add** raised in the centre
- Plain words on the ASHA and woman screens. Engineering language lives only on
  the Proof and Officer screens, where judges look.

Tokens: `src/index.css` (`@theme`). Brand `#0E6349`, paper `#EDEEE8`.
Type: Noto Sans + Noto Sans Devanagari; **Fraunces** for the landing hero only.

---

## 8. File map

```
src/
  data/
    programmes/*.json  the 5 schemas — DATA. A 6th programme is a 6th file.
    canonical.js       canonical dictionary + QUESTION_BANK + REMEMBERED_PATHS
    derivations.js     LMP→EDD, ANC windows, NIS schedule, CBAC score, HRP rules
    seed.js            synthetic households, schemes, updates, officer data
  engine/
    solver.js          planEncounter() — THE project
    derive.js          derivableClosure() + runDerivations()
    mapper.js          facts → 5 payloads, with per-field provenance
    incentives.js      ASHA incentive activity codes
  db/db.js             Dexie: households, members, encounters, outbox, earnings
  store/useStore.js    zustand: session, draft encounter, settings
  components/          ui.jsx, inputs.jsx, BottomNav.jsx
  pages/public/      Landing, Portals (portal chooser)
  pages/asha/        Login, Home, Add, ScanForm, NewSchema, Assistant,
                     Families, Family, VisitType, Consent, AskOnce, Review,
                     Outputs, Paper, Earnings, GovPortal, Reminders, Sync,
                     More, Proof
  pages/officer/     Dashboard, AddProgramme
  pages/woman/       Home, Records, Schemes, SchemeDetail, Ask, Me
```

### Navigation
```
/  Landing  →  /portals  →  /login?as=asha|officer|woman  →  the portal

ASHA bottom bar:  Home · Families · [＋ Add] · Assist · Earnings
/asha/add branches three ways:
   existing form  →  pick family  →  Consent  →  AskOnce  →  Review  →  Outputs
   scan a form    →  OCR extract  →  confirm values  →  start a visit, or save as a form
   new form       →  read a PDF (agent)  or  add fields by hand
```

---

## 9. Demo script (4 minutes)

Split screen. Left: five blank paper registers being filled by hand, timer
running. Right: the app.

1. Play a 25-second scripted ASHA-and-pregnant-woman audio clip (synthetic, say so)
2. Start filling register 1 by hand on the left. Never finish it.
3. Right side: 11 questions. Counter chip visible. Answer "age 24" → **5
   questions vanish on screen**.
4. Fan-out: 5 records appear.
5. Tap a field → provenance ("LMP + 280 days").
6. Privacy tab → what each programme does *not* get.
7. Earnings → "₹300 earned" + the unclaimed-money alert.
8. More → *Pretend there is no signal* → capture another visit → sync.
9. Cut to the left side. Still on register 2.

**Insurance:** seed the DB and cache every agent result before presenting. The
capture-to-five-outputs flow must work with venue wifi off — that is the claim.

---

## 10. Honest limitations (keep this slide, do not cut it)

- Schemas derived from public documentation; they vary by state and may be incomplete
- Never validated with a real ASHA worker
- Time savings are **modelled**, not measured in the field
- Paper registers remain legally required — we reduce copying time, not the register
- Incentive and scheme amounts are demonstration values in config files
- Offline voice input not built; ASR accuracy would degrade with dialect and noise
- **No integration with any real government health information system is claimed**
- All demonstration data is synthetic; no real individual's health information

---

## 11. Reference links

- RCH Portal data entry manual — https://nhmmizoram.org/upload/RCH%20Portal%20Data%20Entry%20Manual.pdf
- U-WIN platform — https://www.india.gov.in/category/health-wellness/subcategory/childrens-health-immunisation/details/website-of-u-win-platform
- NHM ASHA incentive package — https://www.nhm.gov.in/New_Update-2022-23/communization/ASHA/Orders_and_guidelines/ASHA-Incentive.pdf
- JSY (NHM) — https://nhm.gov.in/index1.php?lang=1&level=3&lid=309&sublinkid=841
- FHIR Implementation Guide for ABDM — https://nrces.in/ndhm/fhir/r4/
- ASHA workload, time-motion study — https://pmc.ncbi.nlm.nih.gov/articles/PMC10746798/
- WhatsApp and CHW burden, Varanasi 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12527129/

---

## 12. Memory log

> One or two lines per change. **Newest first.** Date · what changed · why.
> Add an entry every time anything in this repo changes.

### 2026-09-19 — the officer portal: who is carrying what, and getting supplies to them
- The block dashboard was four static tiles and a village bar chart read out of a fixed array. It
  answered none of the questions an officer actually opens a dashboard with: how many workers do I
  have, where are they, how many families do they cover, who is struggling, and what do they need.
- **New `engine/officer.js`.** Eight ASHAs across four villages, and **one of them is not data** —
  ASHA-RMP-014 is the phone the app is running on, so her families, people, pregnancies, overdue
  visits and drug kit are read from the local database. Record a visit in the worker app and the
  officer's number moves. Her row is badged **Live** and the detail page says why.
- **Three screens.** The dashboard (workers, villages, families, pregnancies, overdue, and the two
  things he can act on); `/officer/workers` with a village filter and a detail page per worker; and
  `/officer/supply`, the block store.
- **The supply loop is real, and it crosses the portals.** The live worker's shortages are computed
  from her actual `medicineKit` rows — she files nothing, the gap simply appears in the officer's
  store. Dispatching writes the stock back to her kit and adds a line to her medicine log saying the
  block store sent it. Verified end to end: sent 20 packs → the item left her at-or-below-minimum
  list → her own Med Kit screen went from 2 out of stock to 1, with "block store" in the log. A
  dashboard that only counts is a report, and a report does not get tablets to a woman who has none.
- **The ethic held, because the user asked for per-worker progress and that is exactly where this
  goes wrong.** There is no score, no rank, and nothing sorted by output. The village percentage is
  visits done against visits due — the area's work, not a mark for anyone in it. The worker list
  sorts by area and the support list by how many problems she is carrying. The only badge on a
  worker says what she needs, so a visit to her page ends in help being sent rather than a remark
  being recorded. Both screens say so on the page.
- Smoke: **PASS, 47 routes × 2 configs.**

### 2026-09-19 — the beneficiary portal never spoke her language, and two people shared one login
- **Not one of the eight beneficiary screens read the language setting.** The chip in the header
  changed `lang` and nothing else; the whole portal was hardcoded English. New `i18n/woman.js` holds
  ~110 keys in English, Hindi and Telugu — kept in its own file because it is the largest block of
  copy in the app, it belongs to one audience, and `i18n/index.js` is being edited by another
  session. `useT()` gained `{name}` interpolation so a sentence stays one translatable string
  instead of three fragments glued together in English word order.
- Converted `WomanBar`, `WomanNav`, Home, My record, Schemes, one scheme, Me and Ask. Verified all
  five routes in all three languages.
- **The danger signs and the status line** were seeded English shown on every screen, so they carry
  translation keys now: "5 months pregnant" / "{name} की माँ, 3 महीने".
- **What is still English, and why.** Scheme text, news bodies, visit labels and ministry names are
  clinical and official wording. This project's rule is that such wording is translated by a person,
  not a machine, so the news section now says so plainly in her language rather than leaving her to
  wonder — the same honesty the assistant already uses for an unreviewed answer.
- **Two beneficiaries, one login.** The portal serves a pregnant woman and a mother with a baby, and
  which one you are changes the record, the schemes and the history behind every screen — but the
  mode was a toggle buried in settings. Each now has her own credentials on `/login?as=woman`, the
  card picker sets which, and signing in sets `womanMode`, so choosing the account *is* how the
  portal is told who it is for. Verified: sunita.devi@ → pregnant, rekha.kumari@ → mother.
- Smoke: **PASS, 43 routes × 2 configs.**

### 2026-09-19 — a missing export took the whole app down
- `Home.jsx` imported `MEDICINE_KIT` from `seed.js`, which never exported it. Another editing
  session had added the Medicine Kit screen, its route, its nav item and its i18n keys, but not the
  data or the Dexie tables, so the import threw and the app would not build at all.
- Added the kit (14 items with category, unit, quantity and a minimum level), a short movement log
  so the history is not empty, and `db.version(5)` with `medicineKit` / `medicineLog`, seeded and
  cleared with the rest. The screen reads 14 items · 4 low · 2 out of stock.
- **Two sessions are editing this repo.** Twenty-eight files had drifted once already; ten more
  changed mid-task this time, including two new screens. The routine now is: hash every file in
  `src`, compare, and pull what differs before touching anything. A blanket copy from the uploads
  folder is not safe — it still holds older staged copies and silently reverted four files.

### 2026-09-19 — a follow-up visit was asking everything again
- **The visit never loaded the person's record.** `VisitType.start()` seeded the draft with the
  *household's* facts only — no member row, no past encounters, nothing learned. So the second visit
  to the same woman opened exactly like the first. The whole "ask once" claim was true in the engine
  and untrue in the flow.
- **`REMEMBERED_PATHS` was missing the person.** It listed the household and a few documents, but not
  her name, sex, age, or the LMP that fixes a pregnancy. A follow-up opened by asking a woman her own
  name. Added the person, this pregnancy, this child's facts of birth — and `vitals.height`, because
  an adult's height is measured once, not monthly. Nothing else measured is on the list.
- **New `buildCarryForwardFacts()`.** Seeding the *full* record was the opposite mistake: last visit's
  weight, blood pressure and haemoglobin arrive already answered, and taking them again is the point
  of the visit. A visit now carries forward only what does not change, then runs the derivations over
  it, so ages and due dates are recomputed rather than remembered stale.
- **No schema field was scoped to a visit type.** Every `for` array was missing, so `fieldsFor()`
  never filtered and a child's immunisation visit dragged in the whole CBAC NCD checklist — all six
  tiles claimed the same 68 fields. Scoped all 87 fields by the part of the record they belong to.
  Baselines are now honest per visit: Pregnancy 68, Newborn 53, Child vaccine 47, Health check 56,
  Illness 48, Household survey 39.
- **The person list now shows the number that matters.** Each name carries "Follow-up · 5 questions ·
  21 already on her record" or "First visit · 10 questions", computed from that person's own record.
  The tile keeps the first-visit number; the two agree now that both pass `__encounterType`, which
  steers wording, derivations and skip logic.
- Fixed in passing, both visible on screen: the seed generator gave two children in one house the
  same name, and called every child over five an "adolescent".
- Measured end to end: **first visit 68 → 10** (name, age, LMP, gravida, weight, height, BP, Hb, Td,
  IFA); **follow-up 68 → 5** (weight, BP, Hb, Td, IFA — only what is measured today). Confirmed the
  carry-forward leaves `vitals.weight/hb/bpSys` undefined where the full record would have filled
  them. Smoke: **PASS, 40 routes × 2 configs.**

### 2026-09-19 — the mapping control appeared where it was least useful
- **It was shown only for fields the reader could not match, or matched unsurely.** That is exactly
  backwards. OCR is confidently wrong all the time, and a confident wrong match — "Name of pregnant
  woman" read as the *head of family* — was the one thing the worker could not correct, because a
  95% row had no control at all. Every field now carries the same control.
- **And when it did appear it was a flat list of 150 record fields**, in no order, with no hint
  which one the printed label meant. New `engine/mapSuggest.js` scores every canonical path against
  the label and puts the plausible ones in a "Likely match for this label" group at the top; the
  whole record follows, grouped by area (the person, the household, pregnancy, measurements…).
  Scoring weighs what a field is *called* above how its question is worded, stems plurals
  (pregnancies → pregnancy) and carries a small synonym table for registrar's English (TT → Td,
  IFA → iron, Hb → haemoglobin, born → birth). An exact label match scores 1 and sorts first.
- **"no match — will be asked every time" was simply untrue.** An unmapped field is saved as
  `scan.<slug>`, written by `saveLearned` on submit and merged back by `buildSubjectFacts` — so it
  is asked once for a family and remembered after that. The orange warning is gone; the row now
  says what actually happens, and the summary counts "8 fill themselves from the record · 1 asked
  once, then remembered · 3 read unclearly" instead of calling the remainder a failure.
- Verified on the worked sample: **9 controls for 9 fields** where there had been 1, each preselected
  with its likely match (Name → person.name, House no. → household.houseNo, LMP → pregnancy.lmp,
  Hb → vitals.hb, TT dose given → tt.dose1Given), and changing one updates the caption to the new
  path. Smoke: **PASS, 40 routes × 2 configs.**

### 2026-09-19 — the demo account filled nothing, and nothing was ever spoken aloud
- **"Use demo account" did nothing** because `ASHA` in `seed.js` has no `email`, so `r.email` was
  `undefined` and `setEmail(undefined)` turned a controlled input into an uncontrolled one — the
  React warning in the console was the same bug, not a separate one. `ASHA.email` added;
  `Login.jsx` now derives `demoEmail` with a fallback, matches the sign-in against it, and both
  inputs take `value={x ?? ''}` so a missing field can never blank the form again. Checked for all
  three roles.
- **Speech was silent.** Two separate causes:
  - `say()` in `useStore` — the Read-aloud path — was calling `speechSynthesis.cancel()` and
    `speak()` in the same tick, with no voice chosen and no waiting for the engine to load its
    voices. Chrome answers all three of those with silence. It now delegates to `speakOnce`.
  - `speak()` in `voice.js` had the same cancel-then-speak race. It now waits for `voiceschanged`,
    pauses after cancelling, picks a voice by degrading the locale (hi-IN → hi → en-IN → en →
    default → any), speaks in sentence-sized pieces under 180 characters so nothing is cut off at
    Chrome's fifteen-second limit, and calls `resume()` every four seconds because Chrome pauses
    its own engine.
  - **A watchdog**, because the worst outcome is not silence but a panel stuck on "Speaking…" with
    the loop never handing the turn back. If nothing has begun within two seconds the turn is
    returned and she is told the answer is on the screen.
- **Caught while testing:** my own fix could kill speech outright — assigning a voice the engine
  will not accept throws, and the throw was outside the try that wrapped `speak()`. A bad voice now
  degrades to the default. This is exactly the failure the change existed to prevent.
- Voice errors now read as sentences: a bare code like `not-allowed` is explained, anything already
  written as a sentence is shown as-is rather than prefixed "Voice stopped:".
- **The working copy had drifted from the machine** — 28 files differed, including a rewritten
  `Login.jsx`, `Icon.jsx` and several engine files from another session. Resynced from the device
  before touching anything, so nothing was clobbered.
- Verified: demo fill for ASHA, officer and beneficiary with no React warning and a successful
  sign-in; Read aloud and a live spoken turn each queueing two utterances split at a sentence
  boundary; and an engine that silently swallows speech leaving the panel closed with a plain
  explanation instead of a stuck "Speaking…". Smoke: **PASS, 40 routes × 2 configs.**

### 2026-09-19 — Gemini 2.5 Flash, patience for a busy provider, and errors that explain themselves
- **Gemini is pinned to `gemini-2.5-flash`** as the first preference, as asked, with
  `gemini-flash-latest` behind it and the rest of the ladder unchanged.
- **503 is not a failure, it is a queue.** An overloaded model was falling straight through to the
  next provider and then to the offline engine. `patiently()` now retries a busy provider (503, 502,
  504, 429, "overloaded") up to three times with a growing pause, and `withModel()` no longer strikes
  a model off as dead when the provider was merely busy.
- **400 is the request, not the key and not the model.** Providers disagree about `max_tokens` vs
  `max_completion_tokens`, about `response_format`, even about `temperature` on some models. Rather
  than guess which field a given model dislikes, `postChat()` sends the request again with nothing
  but the model and the messages — the answer is still correct, and the provider's own complaint is
  logged. Chat now sends `max_completion_tokens`, the current field name.
- **The failure is now legible.** "gemini, grok unavailable" told nobody what to change. Each
  provider's own words are logged to the console and shown in the chat behind a tap, with a line
  saying the answer came from the phone instead so nothing was lost. The badge names the service
  that actually answered — "Groq", not "GROK", when the key is a Groq key.
- Verified against a stubbed provider: two 503s were waited out and answered on the third attempt
  **without touching the fallback**; a 400 on `max_completion_tokens` was recovered by resending
  `{model, messages}` alone; and with both providers genuinely down the detail panel showed
  *"GEMINI — 400 API key not valid"* and *"Groq — 429 Organization has been rate limited"* over an
  answer from the offline engine. Smoke: **PASS, 40 routes × 2 configs.**

### 2026-09-19 — 404 is not a bad key: model names are now discovered, not hardcoded
- Both providers answered **404** — `gemini-2.0-flash` and the `llama-3.x` names no longer exist for
  those keys. 404 means the key was accepted and the *name* was not found; 401 or 403 would have
  meant a bad key. Nothing needed replacing.
- **The names are no longer written into the app.** `providers.js` gained `liveModels()` (ask the
  provider what this key can use, once per session), `resolveModel()` (choose by a preference order,
  newest and cheapest first, skipping whisper / tts / embedding / guard / image-generation) and
  `withModel()` (call it, and on a model-not-found strike that name off and try the next). A
  retirement now costs one wasted request, once — never a broken screen.
- `VITE_GEMINI_MODEL` and friends are demoted to *pins*: honoured when the key can see that model,
  ignored otherwise. `.env.example` says to leave them blank.
- Diagnostics reports the model it settled on rather than the one .env guessed.
- Verified against a stubbed provider reproducing exactly this failure — a Gemini list without
  `gemini-2.0-flash` and a Groq list without any `llama-3.x`: the app listed, picked
  `gemini-flash-latest`, and answered on the first call, **zero wasted requests**; Groq resolved to
  Llama 4 Scout for both chat and OCR. Smoke: **PASS, 40 routes × 2 configs.**

### 2026-09-19 — the key was for the wrong company, and a father could be pregnant
- **The OCR key was never bad — it was being sent to the wrong company.** The key in `.env` begins
  `gsk_`, which is a **Groq** key (console.groq.com). The app was posting it to **xAI** (api.x.ai),
  whose keys begin `xai-`. Two different companies answer to the name "grok", and each refuses the
  other's key with `400 Incorrect API key provided` — which reads like a bad key and is really a bad
  address. `ai/config.js` now reads the prefix and picks the base URL, the model defaults and the
  console name from it; both services are OpenAI-compatible, so one code path serves both.
  `VITE_GROK_PROVIDER` overrides the detection.
- A model name belonging to the other service is **ignored rather than sent** (the `grok-2-*` names
  in `.env` mean nothing on Groq), and `tryModels()` walks a candidate list so a retired name falls
  through instead of failing the provider. Groq vision does OCR with Llama 4 Scout.
- Diagnostics opens with a banner naming the service the key was read as, the base URL it will call,
  the model names it will try in order, and any name it ignored. `.env.example` and the README carry
  the same table.
- **`engine/roles.js` — sex, relation and status can no longer contradict each other.** A father was
  able to be pregnant. The rules live in one file and both intake screens apply them: an impossible
  chip is shown greyed with the reason on it ("only a woman", "over 18"), and a choice that
  invalidates another field repairs it and says what it changed. The field just touched is never
  overruled — everything moves around it. `Chips` gained an `off` reason per option.
- Add-a-person gained the relation and status chips it was missing, on the same rules.
- **Both chats show the send button and the talk button together** instead of one swapping into the
  other. (`flex-1` without `min-w-0` had pushed the send button off a 390px screen.)
- **The form fill screen now shows what was filled**, field by field with its value and whether it
  came from the record or was calculated — a progress bar is a claim, this is the evidence.
- **The agent framing is gone.** There is no FastAPI backend, no pgvector, no LangChain agents, and
  §6 of this file now describes what actually exists: everything decides in the browser, and exactly
  two calls leave it — chat, and reading a photographed form. The one rule that survived is the one
  that mattered: a model proposes, a person approves.
- Verified: scan → save as a form → pick Sunita → **8 of 9 fields filled from her record, the 1
  unmapped field shown as needing an answer**; the role rules driven in the browser (Father greyed
  out while pregnant, switching to Male repairing Wife→Husband and Pregnant→Adult); both chat
  buttons inside the viewport at 360px and 390px; the diagnostics banner against a `gsk_` key.
  Smoke: **PASS, 40 routes × 2 configs.**

### 2026-09-19 — the worker's chat: typed, live by voice, and grounded in her caseload
- **One answer path for typing and for talking.** `Assistant.jsx` was a fake: a regex over four
  canned strings, and a mic button that waited 1.8 seconds and pretended. Both are now real and both
  go through the same `respond()`.
- **`engine/ashaContext.js`** — her whole working picture read out of Dexie: the caseload matrix,
  every household and person with their status, scheme enrolments and tasks, overdue / due today /
  coming up, earnings and what is unclaimed, the sync queue, held-up payments, missing proofs.
  `findPeople()` resolves a name or a house number in a question to the people it means.
- **`engine/ashaBrain.js`** — the offline answer engine, 13 intents plus a person lookup, every
  answer **composed from her actual caseload**. It answers with no signal at all, and when a model is
  reachable it still supplies the sources and the follow-on actions shown under the reply. It is the
  floor, not the fallback nobody tested.
- **`ai/index.js` — `askAsha()`**, a worker-facing prompt. The worker is not the beneficiary: she
  asks "who is due today", which only her records can answer, and "how long does Aadhaar seeding
  take", which they cannot. The prompt separates the two instead of refusing the second — a general
  answer must open with "General guidance:", and the screen then drops the record sources and shows
  an honest note. `askModel()` and `askAsha()` now share one `runChat()` provider walk.
- **Live voice** uses the existing `createVoiceAgent` loop: listen → answer → speak → listen again,
  with the partial transcript in `VoiceBar` and "stop" ending it. A spoken turn passes `brief` so the
  model answers in under three sentences — she is listening, not reading.
- **The beneficiary chat** now reaches a model too, but only when the written engine does not
  recognise the question at all; her reviewed answers still win.
- **Fixed, found while testing:** `iso()` in `seed.js` built dates with `toISOString()`, which rolls
  the day backwards east of Greenwich — a task seeded "11 days ago" read as 12 days overdue on an
  Indian phone. It builds a local calendar date now.
- Verified in a real browser: eight typed questions answered from the database (who is due, a person
  by name with schemes and dates, earnings, PMMVY documents, the caseload, the vaccine schedule, a
  held-up payment, an unknown question); the model path driven against a stubbed provider, confirming
  the caseload reaches it (63 people lines) and the general-guidance note renders; and a three-turn
  live conversation with a faked microphone, each answer spoken aloud and the stop word ending it.
  Smoke: **PASS, 40 routes × 2 configs.**

### 2026-09-19 — total families in the matrix, and a complete intake form
- **"Total families" was missing from the matrix.** `caseloadMatrix()` now returns a
  `totals` block — *Total families* (with the village count) and *People in those
  families* (with the average family size) — rendered as the first two rows of the
  caseload card, above a **"Who is in them"** group holding the six clinical rows.
  The collapsed tiles became four: families · people · pregnant · under 5. The
  by-village chips now carry households **and** people.
- **Fixed:** the *Newborns* filter chip always read 0. `householdSummary()` returned
  `newborns` while the filter keyed off `newborn`. Both spellings are returned now.
- **Add a family rebuilt** (`NewHousehold.jsx`). Four blocks: the house (number, head,
  village, hamlet, mobile); **family members inline** — a repeatable card per person with
  name, age, sex, relation to the head, status, LMP or DOB, and **the schemes that person
  is on**; cards and entitlements (ration card, PM-JAY, bank account in her own name,
  category); and a collapsible *Other household details* (people count, toilet, water,
  fuel, house type, a note). Status is guessed from age and the scheme ticks are
  pre-filled from the status — both can be overridden.
- **New `src/data/enrolOptions.js`** — the scheme catalogue, each scheme carrying the roles
  it applies to plus the default phase, and `SUGGESTED` ticks per role. A state adds a
  programme by editing this list; no screen changes.
- **Dexie v4** adds an `enrolments` table with `createEnrolment()` / `enrolmentsFor()`.
  `createHousehold()` stores the new fields canonically, and an unanswered yes/no stays
  `null` — showing "No" for a question nobody asked is a lie the record should not tell.
- **Family detail** merges seeded and locally-recorded enrolments, and the People tab ends
  with a *Household details* list that shows only what was actually answered.
- Verified end to end in a real browser: new family → two members → five enrolments →
  the family page shows the schemes, the member cards with status and scheme chips, and
  the household details. Smoke: **PASS, 40 routes × 2 configs.**

### 2026-09-19 — caseload matrix and member detail
- **Her caseload is now a population, not four rows.** 19 households, 83 people
  across 4 villages. The four hand-written households stay (tasks, enrolments
  and the beneficiary portal point at them by id); the rest come from a
  **seeded generator** in `seed.js` — deterministic, so the numbers are the same
  every reload. Pregnancies and the newborn are placed explicitly rather than
  left to chance, because at this size probability gives you an empty matrix
  about a third of the time.
- **`engine/caseload.js`** — `memberStatus()` classifies one person
  (pregnant with trimester, newborn, infant, under-5, adolescent, NCD-due,
  elder) and `caseloadMatrix()` counts the population. **Nothing is stored;
  every number is counted from the household and member rows** — the same
  arithmetic an ASHA does on paper at month end.
- **Families screen**: a collapsible caseload card — 6 pregnant, 1 newborn,
  3 infants at a glance, expanding to the full matrix with a by-village
  breakdown. Each row is tappable and filters the list. Filter chips carry
  their own counts, and each household row shows what it contributes
  (`Pregnant`, `1 under 5`, `2 for NCD`).
- **Family → People is now the detail view**: each member gets an icon coloured
  by status, a status line (`Pregnant · 5 months`, `Trimester 2`), what that
  status means for her work (`Vaccines due on schedule`, `Home visits due`),
  and the schemes that member is enrolled in.
- **Profile coverage numbers are computed**, not typed. They previously claimed
  142 households against a database of 4 — now they read the database and the
  village list comes from it too.

### 2026-09-19 — Gemini vision as the OCR fallback
- **OCR chain is now Grok vision → Gemini vision → worked sample**, matching the
  shape chat already had. `geminiVision()` posts the image as an
  `inline_data` part with `responseMimeType: application/json`.
- **Either key alone covers both jobs.** `hasOCR()` is true when *either*
  provider has a key, so a Gemini-only setup still reads a real photograph.
- A provider is dropped from the chain for any reason — bad key, missing model,
  a reply that is not JSON — and the next one is tried. `parseFormJson` is
  shared, so a model that wraps its answer in a fence or adds a sentence is
  still read. Verified across seven scenarios with stubbed providers:
  both up → grok; grok key bad → gemini; grok model gone → gemini; grok returns
  prose → gemini; either configured alone; both fail → one error naming both.
- The review screen says **"read by grok"** or **"read by gemini"**, and shows a
  note when the first reader failed and the second was used.
- `VITE_GEMINI_VISION_MODEL` added, defaulting to `VITE_GEMINI_MODEL`.
  Diagnostics now lists a **chat model and a vision model per provider** and
  warns when the configured vision model is absent from the key's model list —
  for either provider, not just Grok.

### 2026-09-18 — key diagnostics
- **Reported: OCR failed with `400 Incorrect API key provided`.** That is xAI
  refusing the key, not a code fault — the request reached them and came back
  with a JSON body. The code was right; the feedback was useless.
- **`explain(provider, err)`** in `ai/config.js` classifies a failure into
  auth / quota / model / network / timeout / parse / server and returns what to
  do about it. Ten real error shapes are covered and checked. The auth message
  leads with the usual cause: **Vite reads `.env` only at startup, so a key
  added while the dev server was running is not in the page.**
- **`/asha/diagnostics`** — "Test the connections". Per provider it shows
  whether a key reached the page at all (prefix, suffix, length — never the key),
  which model is being asked for, and the result of a live `GET /v1/models`
  call. On success it lists the models the key can actually use and **says so
  when the configured model is not among them** — which is the second most
  common cause, since model names change.
- Keys are sanitised on read (trim, strip wrapping quotes) and a key containing
  whitespace is flagged, since a pasted line break is easy to miss.
- Provider errors now keep the provider's own wording (`error.message` pulled
  out of the JSON) instead of a truncated blob, which is what makes
  classification possible.
- The scan screen shows the classified failure with two buttons — "Check the
  keys" and "Use the sample" — instead of dumping raw JSON at the user.
- Smoke test now 40 routes x 2 configs.

### 2026-09-18 — Gemini + Grok, real OCR, scan-to-reusable-form
- **Provider chain.** Chat: **Gemini → Grok → the offline engine.** OCR: **Grok
  vision → a worked sample.** The offline engine is not a degraded mode — it is
  the only path that works with no signal, which is most of the time in a
  village. A model is an enhancement on top, never a dependency. Each answer
  carries a badge saying which one replied, and names any provider that failed.
- `src/ai/` — `config.js` (the single place that knows what is configured),
  `providers.js` (Gemini `generateContent`, Grok `chat/completions`, Grok vision
  with an image part), `index.js` (the chain, the grounding prompt, the OCR
  extraction).
- **Grounding prompt.** The model is given a fact sheet built from her record
  and told to answer only from it: never diagnose, never prescribe, never invent
  a number or a scheme rule, send anything urgent to 102. Emergency intents
  never reach a model at all — the local engine answers those directly.
- **`.env.example`** with `VITE_GEMINI_API_KEY`, `VITE_GROK_API_KEY`,
  `VITE_GROK_VISION_MODEL` and `VITE_AI_PROXY`. `.env` is gitignored.
  **Vite inlines `VITE_*` into the bundle, so a key there is public.** That is
  stated in the file, the README and in-app under More → Models. `VITE_AI_PROXY`
  points at a backend that holds the keys instead, and is the path to real use.
- **Scan → save → reuse, the loop the user asked for:**
  photograph a page → Grok vision returns the form's *structure* (labels, types,
  required flags, canonical mapping, per-field confidence, plus any handwritten
  value) → low-confidence or unmapped rows can be remapped or dropped →
  **"Save this as a form"** → it joins the form list → from then on, pick a
  family (existing or new) and it prefills.
  Measured on the sample: **9 fields read, 8 map to the record, so opening it
  for Sunita asks 1 question** — the unmapped "Remarks".
- Dexie **v3**: `customForms`. `data/formRegistry.js` merges built-in and scanned
  forms so the picker, prefill and submission treat them identically. Unmapped
  fields get a `scan.<slug>` path, so they are still learned per person.
- Built-in forms obey the officer's publish switch; a form an ASHA scanned is
  hers and always available.
- More → Models shows what is configured, the fallback order, and the key warning.

### 2026-09-18 — beneficiary chatbot, voice agent, Telugu
- **The woman portal now reads the same database the ASHA writes.** Each persona
  is bound to a real row (`WOMAN.pregnant.memberId = 'm1'`,
  `mother = 'm5'`), and `hooks/useSubject.js` merges household, member,
  encounters, form submissions and learned facts, runs the derivations, and
  merges live activity into her timeline. **An ASHA visit shows up in her record
  and in her chatbot with no round trip** — verified end to end.
- **`engine/assistant.js`** — an intent matcher over a written knowledge base
  (~25 intents), where every answer is COMPOSED FROM HER RECORD. It quotes her
  actual Hb, BP, EDD, vaccine week, scheme stage and blocker. Emergency
  keywords short-circuit everything and return the 102 answer in a red bubble.
  Adding an answer is adding one entry to `KB`.
- **Continuous voice agent** (`engine/voice.js`): listen → transcribe → answer →
  speak → **listen again**, hands-free until she says "stop" (matched in en/hi/te).
  Barge-in cancels playback. `VoiceBar` shows whose turn it is. Degrades to
  typing where `SpeechRecognition` is missing, with the reason stated.
- **Telugu added and reviewed** — 95 UI keys in all of en/hi/te. The language
  list now offers all 13 official languages; the 10 unreviewed ones are shown
  disabled. Language drives the UI, the date format, the speech-recognition
  locale and the synthesis voice.
- **Assistant answers are language-keyed** (`{en, hi, te}`). Where an intent has
  no reviewed translation the English text is returned **with a visible badge
  saying so** — consistent with the rule that clinical wording is never machine
  translated.
- `i18n/langs.js` split out so the store can clamp `lang` without a circular import.
- **Seed v2: past encounters now carry real facts** (Hb 9.8, BP 118/78, weight
  52, Td given). Before this the chatbot correctly answered "not recorded yet",
  which exposed that the displayed history and the actual database disagreed.
  `ensureSeeded` is versioned and re-seeds, keeping anything added in the field.
- **Bug the e2e test caught: out-of-range values were accepted.** The number pad
  warned but the Next button did not check, so Hb 104 could be committed.
  `NumberPad` now reports validity and capture refuses to advance.
- ASHA family → People now has **"Her portal"** next to a member who is a
  beneficiary, for a one-tap end-to-end demo.

### 2026-09-18 — adding families and people in the field
- **Three ways to create a record**, because a form is useless if the person is
  not on the list yet:
  1. Families tab → **Add a family** (`/asha/families/new`)
  2. Family → People tab → **Add a person** (`/asha/people/new?household=<id>`)
  3. Scheme form → pick person → **"Someone not registered yet"**, which chains
     add-person → straight into the form (`?form=<CODE>` carries through, and
     through add-household if she needs a new one too)
- `createHousehold()` / `createMember()` in `db.js` write the **canonical facts**
  alongside the row, so a household created in the field is immediately readable
  by every form and every encounter — no separate import step.
- Anything typed on the add-person screen (husband, mobile, category) goes
  through `saveLearned()`, so the form that opens next does not ask again.
  Adding a pregnant woman with her LMP means the form already has EDD, RCH ID,
  all four ANC dates and the vaccine calendar before she answers anything:
  **a brand-new woman's PMMVY form opens at 15 of 25 already filled.**
- `createMember()` also corrects the household's member count when the number of
  rows exceeds what the survey recorded.
- New UI primitives in `ui.jsx`: `Field`, `TextField`, `Chips` — for the
  admin-style forms, distinct from the one-question-per-screen capture inputs.
- Smoke test now covers 39 routes x 2 configs.

### 2026-09-18 — scheme application forms
- **The Ask Once engine pointed at government application forms.** An officer
  publishes a form; the ASHA picks it and picks a person; the record fills what
  it already knows and only the genuinely new fields are asked.
- `data/schemeForms/*.json` — 4 forms (PMMVY-1A, JSY claim, Anganwadi
  registration, birth registration). Same shape as a programme schema: every
  field names a canonical path. A fifth form is a fifth file.
- `engine/prefill.js` — `buildSubjectFacts()` merges the household survey, the
  member row, every past encounter and anything learned from an earlier form,
  runs the derivation rules, then `fillForm()` tags each field
  `record | derived | entered | missing`.
- **Measured on the seeded data: PMMVY-1A is 25 fields, 15 fill themselves,
  10 are asked.** Then Anganwadi registration for the same person comes back
  **11 of 14 already filled**, because what she typed into PMMVY was learned.
- Dexie **v2**: `formSubmissions` (submitted form, queued in the same outbox as
  encounters) and `learnedFacts` (key `<memberId>:<path>`). Manually typed
  values are written to `REMEMBERED_PATHS`, so no later form asks again.
- Screens: `/asha/forms`, `/asha/forms/:code` (pick person, suggested by
  `appliesTo`), `/asha/forms/:code/fill/:memberId`, `/asha/submissions`, and
  `/officer/forms` to publish or withdraw. Added as the first option on the Add hub.
- **Bug the e2e test caught: the ask list must be frozen when the screen loads.**
  It was recomputed from `answers`, so a number field vanished on its first
  keystroke — its card left the "missing" list mid-entry.
- **Bug the e2e test caught: duplicate DOM ids.** `TextInput`/`DatePick` had
  hardcoded `id="textfield"`/`"datefield"`, so a 10-question form rendered ten
  elements with the same id. Both now take an `id` prop.
- `e2e` coverage lives in the smoke script's sibling pattern: fill a form, assert
  it reached IndexedDB, then assert the next form for the same person prefills
  more than the first did.

### 2026-09-18 — crash fix + route smoke test
- **Fixed: the ASHA Assistant crashed on load.** `ASSISTANT_PROMPTS` was changed
  from an array to `{en, hi}`, but the edit silently failed to match (the source
  contains a literal `’`, the patch looked for the escape sequence `\u2019`),
  so the consumer indexed an array by `'en'` and called `.map` on `undefined`.
- **Root cause was a verification gap, not the typo.** The file was changed and
  then only Home was screenshotted afterwards, so the broken screen was never
  actually loaded. **Rule: after changing a screen, load that screen.**
- **Added `smoke.mjs`** — visits all 29 routes in 2 language/persona configs and
  fails on any uncaught exception, console error or empty render. Run it before
  every delivery: `npm run build && npx vite preview --port 4181 &` then
  `node smoke.mjs`. It filters external font requests the sandbox blocks.
- **Clamped both persisted enums in the store** (`lang`, `womanMode`) so a
  stale or garbage localStorage value can never hand a screen an unknown key,
  and guarded the prompts lookup with `?? []`.

### 2026-09-18 — beneficiary portal rebuilt
- **Two personas, one interface.** `WOMAN.pregnant` (Sunita Devi, 22 weeks) and
  `WOMAN.mother` (Rekha Kumari, Aarav 3 months). Same screen shapes; the data,
  the danger signs, the schemes, the news and the chat answers all switch on
  `womanMode` in the store. Switch them from **Me → Demonstration**.
- **Own bottom bar and header:** Home · My record · Schemes · Ask · Me, with
  `WomanBar` matching the ASHA `AppBar`.
- **`Records`** — the timeline the portal is built around. Every step in order
  with a connector rail, filter chips by kind, and each entry expanding to show
  the actual values, the note, what is due next, and **which systems it was sent
  to**. Each one carries a "something here is wrong" action.
- **`Schemes` + `SchemeDetail`** — written for the beneficiary, not an
  administrator: what it is, how much, who can get it, papers needed, and a
  stage tracker where a blocked stage states the reason and the exact next step.
- **`Ask`** — her own assistant. Answers are drawn from her record and the
  published scheme rules, with cited sources and a jump into the relevant
  screen. Guardrail in the UI: *not a doctor; for anything urgent call the ASHA
  or 102.* Topic chips and suggested questions change with the persona.
- **Every emoji replaced with an SVG icon**, danger signs included — 20 icons
  added to `Icon.jsx` (drop, thermometer, head, baby, waves, syringe, wallet,
  growth, history, message, hospital, calendar, pulse, id, clock…).
- **News is real content now** — scheme eligibility changes, camp dates, VHND
  timings, free-care rights — each with a named source, tagged For you / Your
  village / General.
- Removed `Benefits.jsx`, `BenefitTrack.jsx`, `MyHealth.jsx`, `MyRecords.jsx`.

### 2026-09-18 — icons, header, i18n, chat
- **Replaced every Unicode glyph icon with inline SVG** (`components/Icon.jsx`,
  24 icons, stroke-based, `currentColor`). `⌷` has no glyph in most fonts and
  was rendering as an empty box in the bottom bar. **Rule: never use a Unicode
  symbol as an icon — add a path to `Icon.jsx` instead.**
- **`AppBar`** — branded header for the top-level tabs: app name and mark on the
  first line, the contextual greeting below, with language / settings / avatar
  buttons. `TopBar` (back + title) stays for sub-pages.
- **Multi-language.** `src/i18n/index.js` holds `LANGS` + dictionaries and a
  `useT()` hook; language persists in the store and drives speech and date
  locales too. **English and Hindi are complete and reviewed. Marathi, Bengali,
  Tamil and Telugu are listed but disabled**, labelled "needs a native-speaker
  review" — a health app must not ship machine-translated clinical wording, and
  saying so is a better answer than four half-done locales.
- **Profile screen** (`/asha/profile`) — identity, month summary, verification
  checklist (bank Aadhaar-seeding flagged, since that is what actually blocks
  payment), work area, ANM and PHC, payment details, training, own documents.
- **Settings rewritten** — account row, language, display, data and sync,
  privacy, other portals, about, reset and sign out.
- **Assistant redesigned** — centred empty state with capability chips instead
  of a lone bubble, assistant mark beside each reply, timestamps, source chips,
  inline action buttons, a proper file-attachment bubble, SVG composer icons and
  a voice waveform.
- **Fixed `daysFromNow`** — compared timestamps, so something due earlier today
  read "1 days ago". Now compares calendar days and handles yesterday/tomorrow.

### 2026-09-18 — UI rebuild
- **New visual language: "tactile minimal."** Chosen over flat and over full
  skeuomorphism. Depth primitives (`.raise` / `.sink` / `.press` / `.btn-*`)
  live in `index.css`, so restyling `ui.jsx` + `index.css` propagated the new
  look to every screen already written. Paper grain via an inline SVG noise
  data-URI; **Fraunces** added for the landing hero only.
- **New public flow:** Landing (with the 87→11 proof computed live) → portal
  chooser → role-aware login. `login(role)` now stores the role, and login
  routes to that portal.
- **Home replaced Today.** Day-at-a-glance strip, one large *Add an entry*
  action, three quick tiles (scan / assistant / reminders), visit list,
  earnings and sync. `pages/asha/Today.jsx` was deleted — **it is still present
  on the user's disk and is unreferenced; safe to delete.**
- **Add hub** (`/asha/add`) branches three ways: fill an existing form, scan a
  paper form (OCR), build a new form.
- **ScanForm** — OCR extract with per-value confidence; low-confidence values
  must be corrected or dropped, and the source image is kept as the proof.
- **NewSchema** — two paths: agent reads a PDF into a draft schema for row-by-row
  approval, or add fields by hand with a canonical-path picker (mapping an
  existing path is what stops a field being asked twice).
- **Assistant** — chat over scheme knowledge, PDF attach → "build a form from
  this", simulated voice input, read-aloud, cited sources. Guardrail printed in
  the UI: scheme and process questions only, never medical advice, never
  changes a record.
- **Family screen rebuilt** with four tabs — Schemes (enrolment + phase per
  member), Proofs (document locker with verified/mismatch/missing states),
  People, History. A blocked payment or mismatched document surfaces at the top.
- **GovPortal** — simulated claim submission with per-portal toggles and
  submission history including a rejection. Carries a permanent `SimBadge`
  ("not a real government system") because the problem statement forbids
  claiming official integration. A `Notice` states the file-export fallback for
  portals with no API.
- **Reminders** — local, offline, auto-created from what the schedules say is due.
- Bottom bar went from 4 items to 5 with **Add** raised in the centre.

### 2026-09-18
- **Added `CONTEXT.md`** (this file) as the project's single source of truth,
  with a running memory log to be updated after every change.
- **Fixed: saving a visit redirected to Today instead of the Outputs screen.**
  `clearDraft()` fired before navigation, so Review's `!draft` guard won the
  race. Now navigates first, clears on the next tick.
- **Simplification pass** across ASHA and woman screens — plain wording, calmer
  section headings, engineering explanations moved to Proof/Officer only.
  Requested: "make it simple and ASHA-worker and pregnant-woman friendly,
  minimal UI."
- **Frontend built end to end** — Vite + React 18 + Tailwind v4 PWA, solver +
  derivation engine + mapper, 5 programme schemas, Dexie offline DB with outbox,
  18 screens across 3 portals. Build verified, full capture flow tested with
  Playwright, screenshots reviewed. Delivered to the ASHAFlow folder.
- **Confirmed the numbers are real:** 87 → 65 unique → 11 asked, all computed by
  `planEncounter()` rather than written into the UI.
- Decided the engine runs in the browser (D1) so the demo survives aeroplane mode.
