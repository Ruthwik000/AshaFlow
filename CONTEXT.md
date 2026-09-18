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

### All six visit types, same engine

Every tile on the visit-type screen runs `planEncounter()` against the same five
schema files, filtered by the encounter type. Measured on a household that has
been visited before, with a 24-year-old subject:

| Visit | Instrument the wording comes from | Entries | Asked |
|---|---|---:|---:|
| Pregnancy | RCH registration + MCP card | 87 | 11 |
| Newborn | HBNC mother-and-newborn card | 71 | 15 |
| Child vaccine | MCP card immunisation page / U-WIN | 51 | 8 |
| Health check | CBAC Part A + Part B | 68 | 10 (21 at age 30+) |
| Illness | IDSP syndromic line list | 47 | 8 |
| Household survey | Village / eligible-couple register | 45 | 10 |

The Health check row is the honest one: a 24-year-old skips all of CBAC Part A,
so the form collapses to ten questions; a 52-year-old answers the full
twenty-one, because the checklist genuinely asks that much.

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
- FastAPI backend, PostgreSQL + pgvector, the four LangChain agents
- Voice **input** (speaker output is in; `speechSynthesis`, no dependency)
- Register photo OCR
- Voice **input**, register photo OCR against a real engine, and the FastAPI /
  PostgreSQL backend with the four agents.

---

## 6. Planned backend (not written)

```
FastAPI + SQLModel + PostgreSQL 16 with pgvector (one DB, no separate Chroma)
```

Endpoints: `POST /sync/batch` (idempotent on client UUID), `GET /programmes`
(ETag, cached in IndexedDB), `/officer/summary`, `/officer/alerts`,
`/exports/{code}.csv`, `/agents/*`, `/woman/{token}`, `/woman/consent`.

### The four agents

| Agent | Kind | Reads | Writes | Guardrail |
|---|---|---|---|---|
| **Schema Reader** | LLM + RAG | pgvector `canonical_fields`, `programme_docs` | `programme_drafts` | Must cite a PDF page; <0.6 confidence flagged; never writes `programmes` |
| **Gap Chaser** | SQL first, LLM last | encounters, members, schedules | `visit_plans` | LLM only orders and phrases; cannot add/remove a clinical task |
| **Claim Auditor** | SQL first, RAG for edge cases | encounters, claims, `incentive_rules` | `claim_items` status=proposed | Every rupee traced to an encounter id + rule clause; ASHA confirms |
| **Benefit Helper** | LLM + RAG | her own row, `scheme_docs` | `agent_runs` only | Scheme questions only; any health question → "ask your ASHA" |

**Why a vector DB is genuinely needed:** `person.name` appears across forms as
"Name of beneficiary", "Mother's name", "लाभार्थी का नाम". Matching hundreds of
such labels is a synonym problem, and stuffing the whole canonical dictionary
into every prompt degrades as it grows. Embed it once, retrieve top-5 per label,
let the model pick and a human approve.

---

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

### 2026-09-18 — all six visit types wired, from the real forms

- **The other five encounter types now have real question sets**, taken from the
  instrument the ASHA already carries rather than invented: the **HBNC card**
  (visit schedule days 1/3/7/14/21/28/42 for a home delivery and 3/7/14/21/28/42
  for an institutional one, birth weight, temperature, breastfeeding, the eleven
  newborn danger signs and the six maternal ones), the **MCP card immunisation
  page and the National Immunization Schedule** (26 vaccines across nine
  milestones; the app builds the "given today" list from the date of birth), the
  **CBAC checklist** (Part A scored exactly as printed — age band, tobacco three
  ways, daily alcohol, waist by sex, 150 minutes of activity, family history,
  maximum 10 — and Part B for TB, oral cavity, skin and sensation, breast and
  cervical, and mental health), the **IDSP syndromic line list** (symptom set,
  days ill, IMNCI danger signs, ORS and zinc, malaria rapid test), and the
  **eligible-couple register** (couples, method in use, unmet need, births and
  deaths since the last visit, fuel, net, Ayushman card).
- **Programme fields are now scoped by encounter type.** A field in a schema
  file may carry `"for": ["Newborn", ...]`; a field with no `for` belongs to
  every visit. One schema file serves six visits with no code per visit, so the
  "a sixth programme is a sixth file" claim now also holds across visit types.
  `fieldsFor()` and `programmesFor()` in the solver are the only new API.
- **Derivation rules may be scoped too** (`only: ['Pregnancy']`). This is what
  stops a Newborn visit claiming it can derive `person.sex` from the fact that
  the encounter is a pregnancy.
- **Two real solver bugs found and fixed while wiring this up:**
  1. `derivableClosure` treated a path as un-derivable as soon as a human
     *could* be asked for it, so adding a `person.sex` question made the solver
     ask for something it already knew. Supply is now read as inputs only.
  2. A field computed from an answer that no register names by itself — the
     malaria rapid test behind the HMIS malaria count, the danger-sign list
     behind "referred" — was reported as derived while its input was never
     asked, and the register came out blank. `derivationInputs()` now walks the
     rules backwards and adds those answers to the question plan.
- **Skip logic now cascades.** A question removed by a gate silences everything
  computed from it, so a 24-year-old's CBAC score reads *Not applicable* rather
  than *missing*. Without this the Health check output looked broken.
- **`imm.dosesGiven` has a live option list** — `optionsFor(facts)` builds the
  tick list from the child's date of birth and the national schedule, so the
  ASHA sees the four vaccines actually due at 14 weeks, not all 26.
- **New `multi` input type** for the danger-sign checklists and vaccine lists,
  with a "none of these" option that clears the rest and is cleared by them.
- **Question order** is explicit (`order` on each question), so identity comes
  before household, household before clinical, and a gate is always asked after
  the answer it depends on.
- **Every emoji and Unicode-glyph icon is gone.** 40 new stroke icons in
  `Icon.jsx` (84 in total) covering the question bank, the visit types, the
  role and proof marks, the keypad backspace, the speaker, play/stop, print and
  the agent mark. Verified: `grep` for pictographic and geometric ranges over
  `src/` returns nothing.
- Per-visit **incentive activities** added (HBNC visit, JSY escort, low birth
  weight follow-up, immunisation session, cancer and leprosy referral, ORS and
  zinc, fever surveillance, household survey), each scoped to the visit types it
  can arise from, so the earnings screen cannot claim a newborn payment off an
  NCD screening. Amounts remain demonstration values.
- Verified end to end: a scripted capture of all six types fills **every field
  of every register with no missing required value**, and the full source tree
  bundles clean.

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
