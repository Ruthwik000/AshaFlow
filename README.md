# ASHAFlow — one visit, one entry, five systems

Frontend prototype for the "One Worker, Five Systems" problem statement.
An ASHA captures a household encounter **once**; the app works out the smallest
set of questions that satisfies every downstream programme schema, derives the
rest, and produces five structured programme records.

**Synthetic data only. Not connected to any real government health information system.**

> 📄 **[CONTEXT.md](./CONTEXT.md)** holds the full project context, the design
> decisions and why they were made, and a running memory log. Read it first, and
> add a line to its memory log after every change.

## Run

```bash
npm install
cp .env.example .env     # optional — put your model keys in it
npm run dev              # open the printed network URL on your phone
```

**The app works with no keys at all.** Chat falls back to an offline engine that
reads the household record, and scanning walks a worked sample. Keys add:

| Key | Adds |
|---|---|
| `VITE_GEMINI_API_KEY` | first choice for chat, and the OCR fallback |
| `VITE_GROK_API_KEY` | chat fallback, and first choice for OCR |
| `VITE_AI_PROXY` | a server of your own holds the keys instead of the browser |

```
chat:  Gemini  →  xAI/Groq  →  offline engine   (always works, no network)
OCR:   xAI/Groq  →  Gemini  →  worked sample
```

**Either key alone covers both jobs.** With only a Gemini key, scanning still
reads a real photograph — it just skips the first attempt.

### The second key: two companies, one name

`VITE_GROK_API_KEY` takes a key from **either** service, and the app reads the
prefix to decide where to send it:

| | key begins | console |
|---|---|---|
| **xAI** | `xai-` | console.x.ai |
| **Groq** | `gsk_` | console.groq.com |

They are different companies, and each rejects the other's key with
`400 Incorrect API key provided` — which reads like a bad key and is really a
bad address. `VITE_GROK_PROVIDER=xai|groq` overrides the detection.

### Model names are discovered, not hardcoded

Leave `VITE_*_MODEL` blank. On its first call the app asks the key what models
it can actually use and picks the best match; a name that answers 404 is struck
off and the next is tried. A hardcoded name is a time bomb — providers retire
them, the call answers 404, and the app looks broken when nothing about it has
changed. **More → Models → Diagnostics** shows the service your key was read as
and the model it settled on.

⚠ Vite inlines `VITE_*` values into the built JavaScript. A key in `.env` is
visible to anyone who opens the page — fine for a prototype with throwaway keys,
not for real use. `VITE_AI_PROXY` is the way out.

Check what is configured at any time under **More → Models**.

Build and test the PWA properly:

```bash
npm run build && npm run preview
```

Then open it on a phone, "Add to Home Screen", and **turn on aeroplane mode** —
capture must still work end to end. Demo PIN is `1234`.

## The idea, in one file

`src/engine/solver.js` — `planEncounter()` is the whole project:

```
87 entries across 5 registers
→ 65 unique canonical paths      (duplicates collapsed)
→ −34 derived                    (computed from other answers)
→ −12 remembered                 (this household already told us)
→ −6 skipped                     (not applicable to her)
= 11 questions actually asked
```

Every number on screen is computed at render time from the five schema files.
Change a schema file and the numbers change.

## Layout

```
src/
  data/
    programmes/*.json   the 5 programme schemas — DATA, not code.
                        A 6th programme is a 6th file.
    canonical.js        canonical dictionary + the question bank
    derivations.js      LMP → EDD, ANC windows, NIS vaccine schedule, CBAC score
    seed.js             synthetic households, schemes, updates
  engine/
    solver.js           the minimum-question-set computation
    derive.js           runs the rules until stable
    mapper.js           canonical facts → 5 programme payloads + provenance
    incentives.js       ASHA incentive activity codes
  db/db.js              Dexie: households, encounters, outbox (append-only)
  pages/asha/           12 screens — capture, review, outputs, earnings, sync
  pages/officer/        dashboard + Schema Reader review UI
  pages/woman/          her health, benefits with stage tracking, her records
```

## Design rules used throughout

- Minimum 56px touch targets, 18px+ text
- Always icon **and** word, never one alone
- Three meanings only: green done, orange due, red late
- Speaker button on every question (`speechSynthesis`, no dependency)
- One question per screen — never a long scrolling form
- Four items in the bottom bar, two taps to anywhere

## What this is, architecturally

**There is no backend, and there are no agents.** Everything runs in the
browser: the solver, the derivation rules, the offline answer engine, the
caseload arithmetic and the local database. The only thing that leaves the
phone is a single call to Gemini or to xAI/Groq, made directly from the page —
chat and reading a photographed form. No orchestration, no server, no queue of
autonomous steps.

That is a deliberate fit for the problem, not a shortcut. An ASHA works where
there is no signal; a design that needs a server to answer is a design that
stops working in the field. The model is an enhancement layered on top of
something that already works without it.

`VITE_AI_PROXY` exists for the day the keys should not sit in the browser: set
it and the same two calls go to a small server of your own instead.

## Not built yet

A server for the keys, and any measured field trial. The Schema Reader screen at
`/officer/add-programme` shows the intended review flow against a fixed sample
response rather than a live read.

## Honest limitations

Schemas were derived from public documentation and vary by state. Time savings
are modelled at 6.5 seconds per field entry — a simulation, not a measured field
trial. Incentive and scheme amounts are demonstration values in configuration
files and must be verified before any real use. Paper registers remain legally
required; the paper helper reduces copying time, it does not remove the register.
