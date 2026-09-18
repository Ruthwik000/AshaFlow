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
npm run dev        # open the printed network URL on your phone
```

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

## Not built yet

Voice **input** (speaker output is in), register photo OCR, the FastAPI backend
and the LangChain agents. The Schema Reader screen at `/officer/add-programme`
shows the intended review flow against a fixed sample response.

## Honest limitations

Schemas were derived from public documentation and vary by state. Time savings
are modelled at 6.5 seconds per field entry — a simulation, not a measured field
trial. Incentive and scheme amounts are demonstration values in configuration
files and must be verified before any real use. Paper registers remain legally
required; the paper helper reduces copying time, it does not remove the register.
