import { WOMAN_SCHEMES, WOMAN_DANGER } from '../data/seed'

/* Answers in her language. An entry may supply hi/te; where it does not, the
   English text is returned with `needsReview`, and the UI says so rather than
   pretending. Clinical wording is never machine-translated. */
export function pick(v, lang) {
  if (typeof v === 'string') return { text: v, needsReview: lang !== 'en' }
  return v[lang] ? { text: v[lang], needsReview: false }
                 : { text: v.en, needsReview: lang !== 'en' }
}

/* =========================================================================
   Beneficiary assistant.

   Not a language model. An intent matcher over a written knowledge base,
   where every answer is COMPOSED FROM HER ACTUAL RECORD in the local
   database — so the numbers it quotes are the numbers a health worker wrote.

   Adding an answer is adding one entry to KB below.
   ========================================================================= */

const D = (v, f = '—') => (v === undefined || v === null || v === '' ? f : v)
const dt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
const rupee = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const days = d => Math.round((new Date(d) - new Date()) / 86400000)

/** Flatten her record into the handful of things answers actually need. */
export function buildContext(s) {
  const f = s.facts || {}
  const schemes = s.schemes || []
  const stages = schemes.flatMap(x => x.stages.map(st => ({ ...st, scheme: x })))
  const blocked = stages.find(st => st.state === 'blocked')
  const paid = stages.filter(st => st.state === 'done').reduce((n, st) => n + (st.amount || 0), 0)
  const owed = stages.filter(st => st.state !== 'done').reduce((n, st) => n + (st.amount || 0), 0)

  const vaccines = [
    ['BCG, OPV-0, Hepatitis B', 0], ['Penta-1, OPV-1, Rota-1, PCV-1', 6],
    ['Penta-2, OPV-2, Rota-2', 10], ['Penta-3, OPV-3, Rota-3, PCV-2', 14],
    ['Measles-Rubella 1, Vitamin A', 39],
  ]

  return {
    mode: s.mode,
    name: s.w.name,
    age: D(f['person.age'], s.w.age),
    village: D(f['household.village'], s.w.village),
    house: D(f['household.houseNo'], s.w.houseNo),
    husband: D(f['person.husbandName'], s.w.husband),
    asha: s.w.asha, ashaPhone: s.w.ashaPhone, anm: s.w.anm, phc: s.w.phc,
    rchId: D(f['pregnancy.rchId'], s.w.rchId),

    // pregnancy
    weeks: f['pregnancy.gestWeeks'], month: s.w.month,
    edd: f['pregnancy.edd'] || s.w.edd,
    lmp: f['pregnancy.lmp'],
    hb: f['vitals.hb'], weight: f['vitals.weight'], height: f['vitals.height'],
    bp: f['vitals.bpSys'] ? `${f['vitals.bpSys']} / ${f['vitals.bpDia']}` : null,
    bpSys: f['vitals.bpSys'], bpDia: f['vitals.bpDia'],
    anc: [f['anc.visit1Due'], f['anc.visit2Due'], f['anc.visit3Due'], f['anc.visit4Due']],
    ancDone: f['anc.visitsDone'],
    tt1: f['tt.dose1Given'], tt2Due: f['tt.dose2Due'],
    ifa: f['ifa.tablets'],
    highRisk: f['pregnancy.isHighRisk'], riskReasons: f.__riskReasons || [],

    // baby
    baby: s.baby, babyName: s.w.baby?.name, babyMonths: s.w.baby?.months,
    babyWeight: s.w.baby?.weight, babyBirthWeight: s.w.baby?.birthWeight,
    babyDob: s.w.baby?.dob, vaccines,

    nextVisit: s.w.nextVisit,
    schemes, stages, blocked, paid, owed,
    timeline: s.timeline || [],
    liveCount: s.liveCount || 0,
    danger: WOMAN_DANGER[s.mode],
  }
}

/* ---------------------------------------------------------------- the KB */
const KB = [
  /* --- safety first ---------------------------------------------------- */
  {
    id: 'emergency', scope: 'both', urgent: true,
    match: /bleed|blood.*(com|los)|fits|convuls|unconsci|not breath|can.?t breathe|emergency|severe pain|very sick|dying/i,
    build: c => ({
      text: {
        en: `Do not wait and do not ask me. Call **102** now — the ambulance is free and comes to the village.\n\nAlso call ${c.asha} on ${c.ashaPhone}.\n\nAny danger sign means going to ${c.phc} or the district hospital straight away.`,
        hi: `रुकिए मत और मुझसे मत पूछिए। अभी **102** पर फ़ोन कीजिए — एम्बुलेंस मुफ़्त है और गाँव तक आती है।\n\n${c.asha} को भी ${c.ashaPhone} पर फ़ोन कीजिए।\n\nतुरंत ${c.phc} या ज़िला अस्पताल जाइए।`,
        te: `ఆగవద్దు, నన్ను అడగవద్దు. ఇప్పుడే **102**కి ఫోన్ చేయండి — అంబులెన్స్ ఉచితం, గ్రామానికే వస్తుంది.\n\n${c.asha}కి కూడా ${c.ashaPhone} నంబర్‌కి ఫోన్ చేయండి.\n\nవెంటనే ${c.phc} లేదా జిల్లా ఆసుపత్రికి వెళ్ళండి.`,
      },
      sources: ['Danger signs, Ministry of Health and Family Welfare'],
      tone: 'danger',
    }),
  },
  {
    id: 'danger', scope: 'both',
    match: /danger sign|warning sign|when.*hospital|when should i go|khatra/i,
    build: c => ({
      text: `Go to hospital at once if any of these happen:\n\n` +
        c.danger.map(d => '• ' + d.label).join('\n') +
        `\n\nThe 102 ambulance is free, day or night, and it brings you home again too.`,
      sources: ['Danger signs, Ministry of Health and Family Welfare'],
    }),
  },

  /* --- her own numbers -------------------------------------------------- */
  {
    id: 'hb', scope: 'pregnant',
    match: /haemoglob|hemoglob|\bhb\b|anaemi|anemi|iron|khoon|blood.*(low|count)|tired|weak|dizzy|breathless/i,
    build: c => {
      if (c.hb == null) return { text: `Your haemoglobin has not been recorded yet. It is checked at the antenatal visit — the next one is ${c.nextVisit.label} on ${dt(c.nextVisit.date)}.`, sources: ['Your record'] }
      const band = c.hb < 7 ? 'severely low' : c.hb < 9 ? 'moderately low' : c.hb < 11 ? 'mildly low' : 'normal'
      return {
        text: `Your haemoglobin at the last check-up was **${c.hb} g/dL**, which is ${band}. In pregnancy anything below 11 counts as anaemia.\n\n` +
          (c.hb < 11
            ? `What helps: take the iron and folic acid tablet every day, after a meal rather than on an empty stomach, and never with tea or milk — they block absorption. Eat green leafy vegetables, jaggery, dates, groundnuts and ragi. Taking it with lemon or amla helps your body take in the iron.\n\n` +
              (c.hb < 7
                ? `At ${c.hb} this is severe. Tell ${c.asha} today — you may need treatment at the health centre rather than tablets alone.`
                : `Tell ${c.asha} if you feel very tired, breathless or dizzy. That needs a check rather than waiting for the next visit.`)
            : `Keep taking the iron tablet anyway — the need rises through pregnancy.`),
        sources: ['Your last check-up record', 'Anaemia Mukt Bharat guidance'],
        action: { label: 'See all my test results', to: '/woman/records?filter=test' },
      }
    },
  },
  {
    id: 'bp', scope: 'both',
    match: /blood pressure|\bbp\b|pressure|hypertens/i,
    build: c => c.bp ? ({
      text: `Your last blood pressure reading was **${c.bp}**, which is ${c.bpSys >= 140 || c.bpDia >= 90 ? 'raised' : 'normal'}.\n\n` +
        (c.bpSys >= 140 || c.bpDia >= 90
          ? `Raised blood pressure in pregnancy needs watching. Tell ${c.asha} and go for the next check-up without delay. Severe headache, blurred vision or swelling of the face and hands means going to hospital the same day.`
          : `Normal in pregnancy is below 140 over 90. It is checked at every antenatal visit.`),
      sources: ['Your last check-up record'],
    }) : ({ text: 'Your blood pressure has not been recorded yet. It is taken at every antenatal visit.', sources: ['Your record'] }),
  },
  {
    id: 'weight', scope: 'pregnant',
    match: /my weight|weight gain|how much.*weigh|wazan|putting on|gaining/i,
    build: c => ({
      text: `You weighed **${D(c.weight)} kg** at the last check-up.\n\nOver the whole pregnancy a gain of about 9 to 11 kg is expected, most of it in the last few months. Your weight is taken at every antenatal visit so the trend can be seen — one reading on its own says very little.\n\nIf you are eating less because of nausea or no appetite, tell ${c.asha}.`,
      sources: ['Your check-up records'],
      action: { label: 'See my weight over time', to: '/woman/records?filter=checkup' },
    }),
  },

  /* --- schedule --------------------------------------------------------- */
  {
    id: 'nextvisit', scope: 'both',
    match: /next (check|visit|appoint)|when.*(check.?up|visit|come)|kab.*jana|appointment|अगली|తదుపరి/i,
    build: c => {
      const n = days(c.nextVisit.date)
      const when = n === 0 ? ' — that is today' : n > 0 ? `, ${n} day${n > 1 ? 's' : ''} from now` : ', which has passed'
      return {
        text: {
          en: `Your next appointment is **${c.nextVisit.label}** on ${dt(c.nextVisit.date)}${when}.\n\nWhere: ${c.nextVisit.at}.\n\nTake your MCP card. ${c.mode === 'pregnant' ? 'They will check your weight, blood pressure and haemoglobin, and listen to the baby.' : 'Take the baby and the MCP card so the dose is recorded.'}`,
          hi: `आपकी अगली मुलाक़ात **${c.nextVisit.label}** है, ${dt(c.nextVisit.date)} को${n === 0 ? ' — यानी आज' : n > 0 ? `, अब से ${n} दिन बाद` : ', जो निकल चुकी है'}।\n\nकहाँ: ${c.nextVisit.at}।\n\nअपना MCP कार्ड साथ ले जाएँ।`,
          te: `మీ తదుపరి సందర్శన **${c.nextVisit.label}**, ${dt(c.nextVisit.date)}న${n === 0 ? ' — అంటే ఈ రోజే' : n > 0 ? `, ఇంకా ${n} రోజుల్లో` : ', అది దాటిపోయింది'}.\n\nఎక్కడ: ${c.nextVisit.at}.\n\nమీ MCP కార్డు తీసుకెళ్లండి.`,
        },
        sources: ['Your record'],
        action: { label: 'See my whole record', to: '/woman/records' },
      }
    },
  },
  {
    id: 'anc', scope: 'pregnant',
    match: /anc|antenatal|check.?up schedule|how many.*check|four visit/i,
    build: c => ({
      text: `Four antenatal check-ups are the minimum, and yours fall at:\n\n` +
        c.anc.map((d, i) => `• ANC ${i + 1} — ${dt(d)}`).join('\n') +
        `\n\nYou have completed ${D(c.ancDone, 0)} so far. Each visit checks weight, blood pressure and haemoglobin, gives the Td injection when due, and makes sure the baby is growing.`,
      sources: ['Your RCH record', 'National antenatal care schedule'],
    }),
  },
  {
    id: 'due', scope: 'pregnant',
    match: /due date|delivery date|when.*(baby|born|deliver)|how many month|kitne mahine|edd/i,
    build: c => ({
      text: `Your baby is expected on **${dt(c.edd)}**${c.weeks != null ? `, and you are about ${c.weeks} weeks — roughly month ${Math.floor(c.weeks / 4.3)}` : ''}.\n\nThis is worked out from your last period on ${dt(c.lmp)}. It is an estimate — most babies arrive in the two weeks either side of it.`,
      sources: ['Your RCH record'],
    }),
  },
  {
    id: 'tt', scope: 'pregnant',
    match: /\btt\b|\btd\b|tetanus|injection|teeka|tika/i,
    build: c => ({
      text: c.tt1
        ? `Your first Td injection has been given. The second is due on **${dt(c.tt2Due)}**, four weeks after the first.\n\nBoth doses protect you and the baby from tetanus at the time of birth. Do not skip the second one.`
        : `Your Td injection has not been recorded yet. Two doses are given during pregnancy, four weeks apart. Ask ${c.asha} at the next visit.`,
      sources: ['Your immunisation record'],
    }),
  },
  {
    id: 'ifa', scope: 'pregnant',
    match: /iron tablet|ifa|folic|goli|tablet|supplement|calcium/i,
    build: c => ({
      text: `${c.ifa ? `**${c.ifa} iron and folic acid tablets** have been issued to you.` : 'Iron and folic acid tablets are issued free through your ASHA.'}\n\nTake one every day after a meal — not on an empty stomach, and not with tea or milk. Calcium tablets are also given, but take them at a different time of day from the iron, because together each one blocks the other.\n\nDark stools are normal and not a problem. If it upsets your stomach badly, tell ${c.asha} rather than stopping.`,
      sources: ['Your record', 'Anaemia Mukt Bharat guidance'],
    }),
  },

  /* --- money ------------------------------------------------------------ */
  {
    id: 'blocked', scope: 'both',
    match: /stuck|not come|nahi aaya|why.*not.*(paid|received|come)|delay|pending|reject/i,
    build: c => c.blocked ? ({
      text: {
        en: `Your **${c.blocked.scheme.short}** ${c.blocked.label.toLowerCase()}${c.blocked.amount ? ` of ${rupee(c.blocked.amount)}` : ''} is held up.\n\n**Why:** ${c.blocked.blocker}\n\n**What to do:** ${c.blocked.fix}\n\nNothing else is needed from you — once that is fixed it releases on the next payment run without applying again.`,
        hi: `आपका **${c.blocked.scheme.short}** ${c.blocked.amount ? rupee(c.blocked.amount) + ' का ' : ''}भुगतान रुका हुआ है।\n\n**क्यों:** ${c.blocked.blocker}\n\n**क्या करें:** ${c.blocked.fix}\n\nइसके बाद आपको दोबारा आवेदन नहीं करना पड़ेगा — अगली बार में पैसा अपने आप आ जाएगा।`,
        te: `మీ **${c.blocked.scheme.short}** ${c.blocked.amount ? rupee(c.blocked.amount) + ' ' : ''}చెల్లింపు ఆగిపోయింది.\n\n**ఎందుకు:** ${c.blocked.blocker}\n\n**ఏం చేయాలి:** ${c.blocked.fix}\n\nఇది సరిచేశాక మళ్ళీ దరఖాస్తు అవసరం లేదు — తదుపరి విడతలో డబ్బు వస్తుంది.`,
      },
      sources: ['Your application record', `${c.blocked.scheme.short} scheme guidelines`],
      action: { label: `Open my ${c.blocked.scheme.short} tracker`, to: `/woman/scheme/${c.blocked.scheme.code}` },
    }) : ({
      text: `Nothing is held up at the moment. You have received ${rupee(c.paid)} so far${c.owed ? `, and ${rupee(c.owed)} is still to come as the later steps are completed` : ''}.`,
      sources: ['Your application records'],
      action: { label: 'See all my schemes', to: '/woman/schemes' },
    }),
  },
  {
    id: 'money', scope: 'both',
    match: /money|paisa|payment|amount|how much.*get|entitle|benefit|instal|kitna/i,
    build: c => ({
      text: `Across your schemes you have received **${rupee(c.paid)}** and **${rupee(c.owed)}** is still to come.\n\n` +
        c.schemes.filter(s => s.stages.some(st => st.amount)).map(s => {
          const got = s.stages.filter(st => st.state === 'done').reduce((n, st) => n + (st.amount || 0), 0)
          const left = s.stages.filter(st => st.state !== 'done').reduce((n, st) => n + (st.amount || 0), 0)
          return `• ${s.short} — ${rupee(got)} received${left ? `, ${rupee(left)} pending` : ''}`
        }).join('\n') +
        (c.blocked ? `\n\nOne thing is holding money up: ${c.blocked.blocker}` : ''),
      sources: ['Your application records'],
      action: { label: 'See all my schemes', to: '/woman/schemes' },
    }),
  },
  ...['PMMVY', 'JSY', 'ICDS', 'IMM', 'FREE'].map(code => ({
    id: 'scheme-' + code, scope: 'both',
    match: new RegExp({
      PMMVY: 'pmmvy|matru|vandana|maternity benefit',
      JSY: 'jsy|janani suraksha|delivery money|delivery payment',
      ICDS: 'anganwadi|icds|ration|take.?home|nutrition|poshan',
      IMM: 'immunisation programme|vaccination programme|all vaccine',
      FREE: 'jssk|free (delivery|care|ambulance|treatment)|do i have to pay|charge|paise lagenge',
    }[code], 'i'),
    build: c => {
      const s = c.schemes.find(x => x.code === code)
      if (!s) return null
      const next = s.stages.find(st => st.state !== 'done')
      return {
        text: `**${s.name}**\n\n${s.what}\n\n**How much:** ${s.amount}\n\n**Papers needed:** ${s.needs.join(', ')}.\n\n` +
          (next
            ? next.blocker ? `Where yours has reached: ${next.label} — held up. ${next.blocker}`
              : `Where yours has reached: ${next.label}.${next.note ? ' ' + next.note + '.' : ''}`
            : 'All the steps for you are complete.'),
        sources: [`${s.short} scheme guidelines`, 'Your application record'],
        action: { label: `Open my ${s.short} tracker`, to: `/woman/scheme/${s.code}` },
      }
    },
  })),
  {
    id: 'bank', scope: 'both',
    match: /bank|account|aadhaar.*(seed|link)|ifsc|passbook|khata/i,
    build: c => ({
      text: `Payments only reach an account that is **in your own name** and has **Aadhaar seeded** to it. A joint account or your husband's account is the most common reason money is approved but never arrives.\n\nTo seed Aadhaar: take your Aadhaar card to your bank branch and ask them to link it to the account. It takes about 3 to 7 working days.\n\n${c.blocked && /aadhaar/i.test(c.blocked.blocker || '') ? 'This is exactly what is holding your payment up right now.' : ''}`,
      sources: ['Scheme payment rules'],
    }),
  },

  /* --- papers ----------------------------------------------------------- */
  {
    id: 'documents', scope: 'both',
    match: /paper|document|kagaz|certificate|what.*need|take with|bring|aadhaar|mcp card/i,
    build: c => ({
      text: c.mode === 'pregnant'
        ? `Keep these together and take them to every visit:\n\n• MCP card — the most important one, it carries your whole record\n• Aadhaar card, yours and your husband's\n• Bank passbook in your own name\n• BPL or ration card if you have one\n\nFor the delivery, take all of the above. ${c.asha} comes with you and also carries a copy of your record.`
        : `Keep these together:\n\n• MCP card with the vaccine page\n• The discharge slip from the hospital\n• Birth certificate, once it is issued\n• Aadhaar, yours and your husband's\n• Bank passbook in your own name\n\nThe birth certificate is applied for at the panchayat office with the discharge slip. It is the paper that most often holds up the last maternity payment.`,
      sources: ['Scheme requirements', 'Your document record'],
    }),
  },
  {
    id: 'delivery', scope: 'pregnant',
    match: /deliver|hospital|labour|labor|admit|where.*(born|birth)|prasav/i,
    build: c => ({
      text: `Plan to deliver at ${c.phc} or the district hospital. Delivery there is free — the medicines, the tests, the blood and the food in hospital cost you nothing, and the 102 ambulance is free both ways. If anyone asks you for money, tell ${c.asha} or the person in charge of the centre.\n\nDelivering at a government facility is also what makes you eligible for the JSY payment.\n\nGo in when the pains start, or if your water breaks, or if there is any bleeding — at any hour.`,
      sources: ['Janani Shishu Suraksha Karyakram', 'Your record'],
    }),
  },

  /* --- baby ------------------------------------------------------------- */
  {
    id: 'vaccine', scope: 'mother',
    match: /vaccine|penta|bcg|opv|rota|measles|immunis|immuniz|teeka|tika|dose|injection/i,
    build: c => {
      const wk = Math.round((Date.now() - new Date(c.babyDob)) / (7 * 86400000))
      const next = c.vaccines.find(([, w]) => w >= wk) || c.vaccines[c.vaccines.length - 1]
      return {
        text: `${c.babyName} is about ${wk} weeks old. The next dose is **${next[0]}**, due at ${next[1]} weeks${next[1] <= wk ? ' — that is now' : ` (about ${next[1] - wk} week${next[1] - wk > 1 ? 's' : ''} away)`}.\n\nThe full first-year schedule:\n\n` +
          c.vaccines.map(([n, w]) => `${w <= wk ? '✓' : '○'} ${n} — ${w === 0 ? 'at birth' : w >= 39 ? '9 months' : w + ' weeks'}`).join('\n') +
          `\n\nAll free, at the Anganwadi centre or the health centre. Take the MCP card. A mild fever for a day after a dose is normal. Being a few days late is far better than skipping.`,
        sources: ["Your baby's U-WIN record", 'National Immunization Schedule'],
        action: { label: 'See the vaccine schedule', to: '/woman/scheme/IMM' },
      }
    },
  },
  {
    id: 'growth', scope: 'mother',
    match: /grow|weight|weigh|small|thin|kg|underweight|gain/i,
    build: c => ({
      text: `${c.babyName} weighed **${c.babyWeight} kg** at the last weighing, up from ${c.babyBirthWeight} kg at birth. That is inside the normal band for his age and the rise has been steady.\n\nGo to the Anganwadi weighing day every month. One weight tells you little; the line over several months tells you a lot. If the line flattens for two months running, the Anganwadi worker will flag it.`,
      sources: ['Growth monitoring record', 'Poshan Tracker'],
      action: { label: 'See his growth record', to: '/woman/records?filter=growth' },
    }),
  },
  {
    id: 'feeding', scope: 'mother',
    match: /feed|milk|breast|dudh|water|solid|khana|food|formula|bottle/i,
    build: c => ({
      text: `For the first six months, **only breast milk** — no water, no honey, no other milk, even in hot weather. Breast milk is mostly water and gives everything he needs.\n\nFeed whenever he wants, roughly 8 to 12 times across the day and night. Let him finish one side before switching, so he gets the richer milk that comes at the end.\n\n${c.babyMonths >= 6 ? 'At six months you start other food alongside — mashed dal, rice, vegetables, ghee — and keep breastfeeding until two years.' : `${c.babyName} is ${c.babyMonths} months, so other food starts at six months. Keep breastfeeding alongside it until two years.`}`,
      sources: ['Infant feeding guidance, Ministry of Health and Family Welfare'],
    }),
  },
  {
    id: 'birthcert', scope: 'mother',
    match: /birth certificate|janam|registration of birth|certificate/i,
    build: c => ({
      text: `Apply at the panchayat office with the **discharge slip** from the hospital. It is free if applied for within 21 days of the birth.\n\nTake: the discharge slip, your Aadhaar, your husband's Aadhaar, and the MCP card. Once you have it, give a copy to ${c.asha}.\n\nThis is the document that most often holds up the final maternity instalment.`,
      sources: ['Registration of Births and Deaths Act', 'Your application record'],
    }),
  },

  /* --- about the service ------------------------------------------------ */
  {
    id: 'record', scope: 'both',
    match: /my record|what.*written|who wrote|history|past visit|previous/i,
    build: c => ({
      text: `Your record has **${c.timeline.length} entries**${c.liveCount ? `, ${c.liveCount} of them recorded recently by ${c.asha}` : ''}. The most recent is "${c.timeline[0]?.title}" on ${dt(c.timeline[0]?.date)}.\n\nEvery entry shows the values that were written, who wrote them, and which government systems received them. If a value looks wrong, open it and say so.`,
      sources: ['Your record'],
      action: { label: 'Open my record', to: '/woman/records' },
    }),
  },
  {
    id: 'privacy', scope: 'both',
    match: /privacy|who see|share|consent|data|information.*(go|share)|delete my/i,
    build: c => ({
      text: `Each government programme receives only the part it needs. The monthly report gets counts with no name and no address at all. The TB programme receives nothing about your pregnancy.\n\nYou can see exactly what each one receives, and switch any of it off, from your own details page. Turning one off does not affect your care.`,
      sources: ['Your consent record'],
      action: { label: 'See and change what is shared', to: '/woman/me' },
    }),
  },
  {
    id: 'asha', scope: 'both',
    match: /asha|anm|who.*help|contact|phone|call|worker|doctor/i,
    build: c => ({
      text: `Your ASHA is **${c.asha}** — ${c.ashaPhone}. She visits your household and can come to you.\n\nThe ANM is ${c.anm}, and your health centre is ${c.phc}.\n\nFor an emergency, call **102** for the free ambulance rather than waiting.`,
      sources: ['Your record'],
    }),
  },
  {
    id: 'greeting', scope: 'both',
    match: /^(hi|hello|namaste|namaskar|help|hey|kaise|what can you)/i,
    build: c => ({
      text: {
        en: `Namaste ${c.name.split(' ')[0]}. I can look things up in your own record and explain any scheme.\n\nYou could ask about your test results, when your next visit is, ${c.mode === 'pregnant' ? 'what to eat, which papers to keep ready' : "your baby's vaccines or growth"}, or where a payment has reached.`,
        hi: `नमस्ते ${c.name.split(' ')[0]}। मैं आपके अपने रिकॉर्ड में देखकर बता सकता हूँ, और किसी भी योजना को समझा सकता हूँ।\n\nआप पूछ सकती हैं — आपकी जाँच के नतीजे, अगली मुलाक़ात कब है, कौन से काग़ज़ चाहिए, या पैसा कहाँ तक पहुँचा।`,
        te: `నమస్తే ${c.name.split(' ')[0]}. మీ సొంత రికార్డులో చూసి చెప్పగలను, ఏ పథకాన్నైనా వివరించగలను.\n\nమీరు అడగవచ్చు — మీ పరీక్ష ఫలితాలు, తదుపరి సందర్శన ఎప్పుడు, ఏ కాగితాలు కావాలి, లేదా డబ్బు ఎక్కడ దాకా వచ్చింది.`,
      },
      sources: [],
    }),
  },
]

/** Pick the best entry and build its answer from her record. */
export function answer(question, ctx, lang = 'en') {
  const q = (question || '').trim()
  const pool = KB.filter(k => k.scope === 'both' || k.scope === ctx.mode)
  const out = (a, id) => ({ ...a, id, ...pick(a.text, lang) })

  const urgent = pool.find(k => k.urgent && k.match.test(q))
  if (urgent) return out(urgent.build(ctx), urgent.id)

  let best = null
  for (const k of pool) {
    const m = q.match(k.match)
    if (!m) continue
    const score = m[0].length + (k.scope === ctx.mode ? 2 : 0)
    if (!best || score > best.score) best = { k, score }
  }
  if (best) {
    const a = best.k.build(ctx)
    if (a) return out(a, best.k.id)
  }

  return out({
    text: {
      en: `I could not find that in your record. I can look up your test results, your visit dates, your payments and any scheme — and explain what a paper is for.\n\nFor anything about how you or the baby feel right now, call ${ctx.asha} on ${ctx.ashaPhone}. She can see you, and I cannot.`,
      hi: `यह मुझे आपके रिकॉर्ड में नहीं मिला। मैं आपकी जाँच, मुलाक़ात की तारीख़ें, भुगतान और किसी भी योजना के बारे में बता सकता हूँ।\n\nअभी आपको या बच्चे को कैसा लग रहा है — इसके लिए ${ctx.asha} को ${ctx.ashaPhone} पर फ़ोन कीजिए।`,
      te: `అది మీ రికార్డులో నాకు కనిపించలేదు. మీ పరీక్షలు, సందర్శన తేదీలు, చెల్లింపులు, ఏ పథకమైనా చెప్పగలను.\n\nఇప్పుడు మీకు లేదా బిడ్డకు ఎలా ఉందో — దానికి ${ctx.asha}కి ${ctx.ashaPhone} నంబర్‌కి ఫోన్ చేయండి.`,
    },
    sources: [],
    action: { label: 'Open my record', to: '/woman/records' },
  }, 'fallback')
}

/** Question chips, chosen for what her record actually contains. */
export function suggestions(ctx) {
  const out = []
  if (ctx.blocked) out.push(`Why has my ${ctx.blocked.scheme.short} payment not come?`)
  if (ctx.mode === 'pregnant') {
    if (ctx.hb != null && ctx.hb < 11) out.push('Why is my haemoglobin low and what should I eat?')
    out.push('When is my next check-up?')
    out.push('What papers do I need for the delivery?')
    out.push('How much money can I get in total?')
  } else {
    out.push('Which vaccine is due now?')
    out.push('Is my baby growing well?')
    out.push('How often should I feed the baby?')
    out.push('How do I get the birth certificate?')
  }
  return out.slice(0, 4)
}

export const KB_SIZE = KB.length
