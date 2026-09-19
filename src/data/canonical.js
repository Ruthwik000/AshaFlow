// The canonical dictionary. Every programme field maps to one of these paths.
// `ask` entries are the only things a human can ever be asked for; everything
// else is either derived (see derivations.js) or remembered from the household.
//
// Question wording follows the actual government instruments an ASHA already
// carries: the RCH pregnant-woman registration page, the HBNC mother-and-
// newborn card, the MCP card immunisation page, the CBAC checklist (Part A risk
// score and Part B early-detection symptoms), the IDSP syndromic fever line
// list, and the village / eligible-couple register. Sources are cited on each
// programme file in data/programmes.
//
// `icon` is a name in components/Icon.jsx. Never a Unicode glyph, never emoji.
// `order` sorts the question run so identity comes before clinical detail.

import { dueVaccines, helpers } from './derivations'

const MOTHER_VISITS = ['Newborn', 'Child vaccine']
const monthsSince = d => (d ? Math.floor(helpers.daysBetween(d, new Date()) / 30.4) : -1)

export const QUESTION_BANK = {
  /* ---------------------------------------------------------------- person */
  'person.name': {
    icon: 'user', order: 10, q: 'What is her name?', hi: 'उनका नाम क्या है?',
    // On a newborn or immunisation visit this field is the mother's name on the
    // U-WIN and RCH forms, so the question says so rather than leaving the ASHA
    // to guess whose name the screen wants.
    qFor: f => MOTHER_VISITS.includes(f.__encounterType) ? "What is the mother's name?" : 'What is her name?',
    hiFor: f => MOTHER_VISITS.includes(f.__encounterType) ? 'माता का नाम क्या है?' : 'उनका नाम क्या है?',
    type: 'text', placeholder: 'Full name',
  },
  'person.sex': {
    icon: 'couple', order: 11, q: 'Woman or man?', hi: 'महिला या पुरुष?',
    type: 'choice', options: [{ v: 'F', l: 'Woman' }, { v: 'M', l: 'Man' }],
  },
  'person.age': {
    icon: 'cake', order: 12, q: 'How old is she?', hi: 'उनकी उम्र क्या है?',
    qFor: f => (f['person.sex'] === 'M' ? 'How old is he?' : 'How old is she?'),
    type: 'number', unit: 'years', min: 1, max: 110,
  },
  'person.husbandName': {
    icon: 'man', order: 13, q: "Husband's or father's name?", hi: 'पति या पिता का नाम?',
    type: 'text', placeholder: 'Full name',
  },
  'person.mobile': {
    icon: 'phone', order: 14, q: 'Mobile number?', hi: 'मोबाइल नंबर?',
    type: 'number', unit: '10 digits', min: 6000000000, max: 9999999999,
  },
  'person.caste': {
    icon: 'clipboard', order: 15, q: 'Which category?', hi: 'श्रेणी?',
    type: 'choice', options: [
      { v: 'SC', l: 'SC' }, { v: 'ST', l: 'ST' },
      { v: 'OBC', l: 'OBC' }, { v: 'GEN', l: 'General' },
    ],
  },
  'person.aadhaarLast4': {
    icon: 'id', order: 16, q: 'Last 4 digits of Aadhaar?', hi: 'आधार के अंतिम 4 अंक?',
    type: 'number', unit: '4 digits', min: 0, max: 9999, optional: true,
  },

  /* ------------------------------------------------------------- household */
  'household.houseNo': {
    icon: 'home', order: 20, q: 'House number?', hi: 'मकान संख्या?', type: 'text', placeholder: 'e.g. 14',
  },
  'household.headName': {
    icon: 'user', order: 21, q: 'Head of the family?', hi: 'परिवार के मुखिया?', type: 'text',
  },
  'household.village': {
    icon: 'pin', order: 22, q: 'Which village?', hi: 'कौन सा गाँव?',
    type: 'choice', options: [
      { v: 'Rampur', l: 'Rampur' }, { v: 'Kishanpur', l: 'Kishanpur' },
      { v: 'Bela', l: 'Bela' }, { v: 'Sohagpur', l: 'Sohagpur' },
    ],
  },
  'household.membersCount': {
    icon: 'families', order: 23, q: 'How many people live here?', hi: 'कितने लोग रहते हैं?',
    type: 'number', unit: 'people', min: 1, max: 20,
  },
  'household.bplCard': {
    icon: 'card', order: 24, q: 'Do they have a BPL card?', hi: 'क्या BPL कार्ड है?', type: 'yesno',
  },
  'household.hasToilet': {
    icon: 'toilet', order: 25, q: 'Is there a toilet in the house?', hi: 'घर में शौचालय है?', type: 'yesno',
  },
  'household.waterSource': {
    icon: 'tap', order: 26, q: 'Main drinking water source?', hi: 'पीने का पानी कहाँ से?',
    type: 'choice', options: [
      { v: 'tap', l: 'Tap' }, { v: 'handpump', l: 'Hand pump' },
      { v: 'well', l: 'Well' }, { v: 'other', l: 'Other' },
    ],
  },
  'household.cookingFuel': {
    icon: 'flame', order: 27, q: 'What do they cook on?', hi: 'खाना किस पर बनता है?',
    type: 'choice', options: [
      { v: 'lpg', l: 'LPG cylinder' }, { v: 'wood', l: 'Firewood' },
      { v: 'dung', l: 'Dung cakes' }, { v: 'other', l: 'Other' },
    ],
  },
  'household.ayushmanCard': {
    icon: 'shield', order: 28, q: 'Does the family have an Ayushman card?',
    hi: 'क्या आयुष्मान कार्ड है?', type: 'yesno',
  },
  'household.eligibleCouples': {
    icon: 'couple', order: 29, q: 'How many eligible couples in this house?',
    hi: 'कितने योग्य दंपति हैं?', hint: 'Married, wife aged 15 to 49',
    type: 'number', unit: 'couples', min: 0, max: 8,
  },
  'household.fpMethod': {
    icon: 'shield', order: 30, q: 'Which family planning method is being used?',
    hi: 'कौन सा परिवार नियोजन साधन?',
    type: 'choice', options: [
      { v: 'none', l: 'None' }, { v: 'condom', l: 'Condom' },
      { v: 'pills', l: 'Oral pills' }, { v: 'iucd', l: 'IUCD / PPIUCD' },
      { v: 'injectable', l: 'Antara injection' }, { v: 'sterilisation', l: 'Sterilisation' },
    ],
  },
  'household.pregnantWomen': {
    icon: 'pregnant', order: 31, q: 'How many pregnant women live here now?',
    hi: 'अभी कितनी गर्भवती महिलाएँ हैं?', type: 'number', unit: 'women', min: 0, max: 6,
  },
  'household.childrenUnder5': {
    icon: 'baby', order: 32, q: 'How many children under 5 years?',
    hi: '5 साल से छोटे कितने बच्चे?', type: 'number', unit: 'children', min: 0, max: 10,
  },
  'household.birthsSince': {
    icon: 'baby', order: 33, q: 'Any birth in this house since the last visit?',
    hi: 'पिछली बार के बाद कोई जन्म?', type: 'yesno',
  },
  'household.deathsSince': {
    icon: 'alert', order: 34, q: 'Any death in this house since the last visit?',
    hi: 'पिछली बार के बाद कोई मृत्यु?', type: 'yesno',
  },
  'household.mosquitoNet': {
    icon: 'mosquito', order: 35, q: 'Does the family sleep under a mosquito net?',
    hi: 'क्या मच्छरदानी का उपयोग होता है?', type: 'yesno',
  },

  /* ------------------------------------------------------------- pregnancy */
  'pregnancy.lmp': {
    icon: 'calendar', order: 40, q: 'When was her last period?', hi: 'आखिरी माहवारी कब थी?',
    type: 'date', hint: 'This one answer fills 18 other fields',
    quick: [
      { l: '1 month ago', days: 30 }, { l: '2 months ago', days: 60 },
      { l: '3 months ago', days: 90 }, { l: '5 months ago', days: 150 },
    ],
  },
  'pregnancy.gravida': {
    icon: 'pregnant', order: 41, q: 'Which pregnancy is this?', hi: 'यह कौन सी गर्भावस्था है?',
    type: 'choice', options: [
      { v: 1, l: 'First' }, { v: 2, l: 'Second' },
      { v: 3, l: 'Third' }, { v: 4, l: 'Fourth or more' },
    ],
  },
  'pregnancy.prevCesarean': {
    icon: 'hospital', order: 42, q: 'Any previous caesarean delivery?', hi: 'पहले कभी सिज़ेरियन हुआ?',
    type: 'yesno', applicableWhen: f => (f['pregnancy.gravida'] || 1) > 1,
  },

  /* ---------------------------------------------- delivery and the newborn */
  'delivery.date': {
    icon: 'calendar', order: 45, q: 'When was the baby born?', hi: 'बच्चा कब पैदा हुआ?',
    type: 'date', hint: 'Sets the visit schedule and every vaccine date',
    quick: [
      { l: 'Today', days: 0 }, { l: '3 days ago', days: 3 },
      { l: '1 week ago', days: 7 }, { l: '3 weeks ago', days: 21 },
    ],
  },
  'delivery.place': {
    icon: 'hospital', order: 46, q: 'Where was the baby born?', hi: 'बच्चा कहाँ पैदा हुआ?',
    type: 'choice', options: [
      { v: 'govt', l: 'Government hospital' }, { v: 'chc', l: 'PHC or CHC' },
      { v: 'private', l: 'Private hospital' }, { v: 'home', l: 'At home' },
    ],
  },
  'delivery.type': {
    icon: 'stethoscope', order: 47, q: 'How was the delivery?', hi: 'प्रसव कैसे हुआ?',
    type: 'choice', options: [
      { v: 'normal', l: 'Normal' }, { v: 'caesarean', l: 'Caesarean' },
      { v: 'assisted', l: 'Assisted (forceps)' },
    ],
  },
  'child.name': {
    icon: 'baby', order: 48, q: "What is the child's name?", hi: 'बच्चे का नाम?',
    type: 'text', placeholder: 'Name, or Baby of mother',
  },
  'child.sex': {
    icon: 'baby', order: 49, q: 'Boy or girl?', hi: 'लड़का या लड़की?',
    type: 'choice', options: [{ v: 'M', l: 'Boy' }, { v: 'F', l: 'Girl' }],
  },
  'child.birthWeight': {
    icon: 'scale', order: 50, q: 'What was the birth weight?', hi: 'जन्म के समय वज़न?',
    type: 'number', unit: 'kg', min: 0.5, max: 6, step: 0.1,
    hint: 'Under 2.5 kg is low birth weight and needs close follow-up',
  },
  'newborn.weightToday': {
    icon: 'scale', order: 51, q: 'Baby weight today?', hi: 'आज बच्चे का वज़न?',
    type: 'number', unit: 'kg', min: 0.5, max: 12, step: 0.1,
  },
  'newborn.temperature': {
    icon: 'thermometer', order: 52, q: 'Baby temperature?', hi: 'बच्चे का तापमान?',
    type: 'number', unit: 'degrees F', min: 90, max: 108, step: 0.1,
    hint: 'Below 97 or above 99 on the HBNC card means refer',
  },
  'newborn.breastfedWithin1Hr': {
    icon: 'glass', order: 53, q: 'Was the baby breastfed within one hour of birth?',
    hi: 'क्या जन्म के एक घंटे में स्तनपान कराया?', type: 'yesno',
  },
  'newborn.exclusiveBreastfeed': {
    icon: 'glass', order: 54, q: 'Is the baby getting only breast milk, nothing else?',
    hi: 'क्या केवल माँ का दूध दे रहे हैं?', type: 'yesno',
    hint: 'No water, no honey, no top feed',
  },
  'newborn.dangerSigns': {
    icon: 'alert', order: 55, type: 'multi', noneValue: 'none',
    q: 'Does the baby have any of these signs?', hi: 'बच्चे में इनमें से कोई लक्षण?',
    hint: 'Tick everything you see. Any one of these means refer today.',
    options: [
      { v: 'none', l: 'None of these' },
      { v: 'notFeeding', l: 'Not feeding or stopped feeding' },
      { v: 'fastBreathing', l: 'Fast or difficult breathing' },
      { v: 'chestIndrawing', l: 'Chest drawing in' },
      { v: 'cold', l: 'Cold to touch' },
      { v: 'fever', l: 'Body very hot' },
      { v: 'jaundice', l: 'Yellow eyes, palms or soles' },
      { v: 'cordPus', l: 'Pus or redness at the cord' },
      { v: 'noMovement', l: 'Very sleepy, no movement, or fits' },
      { v: 'skinPustules', l: 'Many skin pustules or boils' },
      { v: 'noStoolUrine', l: 'No stool or urine passed' },
    ],
  },
  'mother.dangerSigns': {
    icon: 'alert', order: 56, type: 'multi', noneValue: 'none',
    q: 'Does the mother have any of these signs?', hi: 'माँ में इनमें से कोई लक्षण?',
    hint: 'Any one of these means refer today.',
    options: [
      { v: 'none', l: 'None of these' },
      { v: 'bleeding', l: 'Heavy bleeding' },
      { v: 'fever', l: 'Fever with foul-smelling discharge' },
      { v: 'fits', l: 'Fits or unconsciousness' },
      { v: 'notSpeaking', l: 'Speaking strangely or very low mood' },
      { v: 'breastPain', l: 'Swollen, painful breast' },
      { v: 'noUrine', l: 'Not passing urine' },
    ],
  },
  'mother.postpartumFP': {
    icon: 'shield', order: 57, q: 'Was family planning discussed with the mother?',
    hi: 'क्या परिवार नियोजन पर बात हुई?', type: 'yesno',
  },

  /* ----------------------------------------------- child and immunisation */
  'child.dob': {
    icon: 'calendar', order: 58, q: 'When was the child born?', hi: 'बच्चा कब पैदा हुआ?',
    type: 'date', hint: 'Every vaccine due date is worked out from this',
    quick: [
      { l: '6 weeks ago', days: 42 }, { l: '10 weeks ago', days: 70 },
      { l: '14 weeks ago', days: 98 }, { l: '9 months ago', days: 274 },
    ],
  },
  'imm.dosesGiven': {
    icon: 'syringe', order: 59, type: 'multi', noneValue: 'none',
    q: 'Which vaccines were given today?', hi: 'आज कौन से टीके लगे?',
    hint: 'The list is built from the date of birth and the national schedule',
    optionsFor: f => [
      { v: 'none', l: 'None given today' },
      ...dueVaccines(f['child.dob']).map(v => ({ v: v.code, l: v.name })),
    ],
  },
  'imm.sessionSite': {
    icon: 'pin', order: 60, q: 'Where was the vaccine given?', hi: 'टीका कहाँ लगा?',
    type: 'choice', options: [
      { v: 'vhnd', l: 'VHND or Anganwadi' }, { v: 'subcentre', l: 'Sub-centre' },
      { v: 'phc', l: 'PHC or CHC' }, { v: 'outreach', l: 'Outreach session' },
    ],
  },
  'imm.aefi': {
    icon: 'alert', order: 61, q: 'Any reaction after the vaccine?',
    hi: 'टीके के बाद कोई प्रतिक्रिया?', type: 'yesno',
    hint: 'High fever, swelling, fits, or anything the mother is worried about',
  },
  'imm.cardUpdated': {
    icon: 'clipboard', order: 62, q: 'Was the MCP card filled in?',
    hi: 'क्या MCP कार्ड भरा गया?', type: 'yesno',
  },
  'child.feedingMeals': {
    icon: 'plate', order: 63, q: 'How many times a day does the child eat solid food?',
    hi: 'बच्चा दिन में कितनी बार ठोस खाना खाता है?',
    type: 'number', unit: 'times a day', min: 0, max: 8,
    applicableWhen: f => monthsSince(f['child.dob']) >= 6,
  },
  'child.deworming': {
    icon: 'pill', order: 64, q: 'Was deworming syrup given in this round?',
    hi: 'क्या पेट के कीड़े की दवा दी गई?', type: 'yesno',
    applicableWhen: f => monthsSince(f['child.dob']) >= 12,
  },

  /* ----------------------------------------------------------------- vitals */
  'vitals.weight': {
    icon: 'scale', order: 70, q: 'Her weight?', hi: 'उनका वज़न?',
    type: 'number', unit: 'kg', min: 25, max: 120, step: 0.5,
  },
  'vitals.height': {
    icon: 'ruler', order: 71, q: 'Her height?', hi: 'उनकी लंबाई?',
    type: 'number', unit: 'cm', min: 120, max: 190,
  },
  'vitals.bp': {
    icon: 'stethoscope', order: 72, q: 'Blood pressure reading?', hi: 'रक्तचाप?',
    type: 'bp', provides: ['vitals.bpSys', 'vitals.bpDia'],
  },
  'vitals.hb': {
    icon: 'drop', order: 73, q: 'Haemoglobin level?', hi: 'हीमोग्लोबिन?',
    type: 'number', unit: 'g/dL', min: 4, max: 16, step: 0.1,
  },
  'vitals.bloodSugar': {
    icon: 'vial', order: 74, q: 'Random blood sugar reading?', hi: 'रक्त शर्करा?',
    type: 'number', unit: 'mg/dL', min: 40, max: 500, optional: true,
  },

  /* ------------------------------------------------- CBAC Part A risk score */
  'ncd.tobacco': {
    icon: 'nosmoke', order: 80,
    q: 'Do you smoke, or use gutka or khaini?', hi: 'क्या बीड़ी, सिगरेट, गुटखा या खैनी लेते हैं?',
    type: 'choice', options: [
      { v: 'never', l: 'Never' },
      { v: 'past', l: 'In the past, or sometimes' },
      { v: 'daily', l: 'Every day' },
    ],
    applicableWhen: f => (f['person.age'] || 0) >= 30,
  },
  'ncd.alcohol': {
    icon: 'bottle', order: 81, q: 'Do you drink alcohol every day?', hi: 'क्या रोज़ शराब पीते हैं?',
    type: 'yesno', applicableWhen: f => (f['person.age'] || 0) >= 30,
  },
  'ncd.waistCm': {
    icon: 'tape', order: 82, q: 'Waist measurement?', hi: 'कमर का माप?',
    type: 'number', unit: 'cm', min: 40, max: 160,
    applicableWhen: f => (f['person.age'] || 0) >= 30,
  },
  'ncd.physicalActivity': {
    icon: 'walk', order: 83,
    q: 'At least 150 minutes of physical activity in a week?',
    hi: 'हफ्ते में कम से कम 150 मिनट शारीरिक गतिविधि?',
    type: 'yesno', applicableWhen: f => (f['person.age'] || 0) >= 30,
  },
  'ncd.familyHistory': {
    icon: 'families', order: 84,
    q: 'Do parents or siblings have BP, diabetes or heart disease?',
    hi: 'माता-पिता या भाई-बहन को BP, शुगर या हृदय रोग?',
    type: 'yesno', applicableWhen: f => (f['person.age'] || 0) >= 30,
  },
  'ncd.onTreatment': {
    icon: 'pill', order: 85, type: 'multi', noneValue: 'none',
    q: 'Is she already taking medicine for any of these?',
    hi: 'क्या इनमें से किसी की दवा चल रही है?',
    options: [
      { v: 'none', l: 'No medicine' },
      { v: 'bp', l: 'Blood pressure' },
      { v: 'diabetes', l: 'Diabetes' },
      { v: 'tb', l: 'TB treatment now' },
      { v: 'other', l: 'Something else' },
    ],
    applicableWhen: f => (f['person.age'] || 0) >= 30,
  },

  /* --------------------------------- CBAC Part B early-detection symptoms */
  'tb.cough2weeks': {
    icon: 'mask', order: 92, q: 'Any cough lasting more than 2 weeks?', hi: 'क्या 2 हफ्ते से ज़्यादा खाँसी है?',
    type: 'yesno',
  },
  'tb.symptoms': {
    icon: 'lungs', order: 93, type: 'multi', noneValue: 'none',
    q: 'Any of these along with the cough?', hi: 'खाँसी के साथ इनमें से कुछ?',
    options: [
      { v: 'none', l: 'None of these' },
      { v: 'blood', l: 'Blood in the sputum' },
      { v: 'fever2w', l: 'Fever for more than 2 weeks' },
      { v: 'weightLoss', l: 'Losing weight' },
      { v: 'nightSweats', l: 'Night sweats' },
      { v: 'breathless', l: 'Short of breath' },
      { v: 'contact', l: 'Someone at home has TB' },
    ],
    applicableWhen: f => f['tb.cough2weeks'] === true,
  },
  'ncd.oralSymptoms': {
    icon: 'mouth', order: 94, type: 'multi', noneValue: 'none',
    q: 'Anything wrong in the mouth or throat?', hi: 'मुँह या गले में कोई समस्या?',
    options: [
      { v: 'none', l: 'Nothing' },
      { v: 'openMouth', l: 'Cannot open the mouth fully' },
      { v: 'ulcer', l: 'Ulcer, white patch or growth' },
      { v: 'voice', l: 'Voice has changed' },
      { v: 'swallow', l: 'Trouble swallowing' },
    ],
    applicableWhen: f => (f['person.age'] || 0) >= 30,
  },
  'ncd.skinSymptoms': {
    icon: 'skin', order: 95, type: 'multi', noneValue: 'none',
    q: 'Any patch on the skin, or numbness?', hi: 'त्वचा पर चकत्ता या सुन्नपन?',
    options: [
      { v: 'none', l: 'Nothing' },
      { v: 'patch', l: 'Pale or reddish patch' },
      { v: 'numb', l: 'No feeling in that patch' },
      { v: 'grip', l: 'Weak grip in the hands' },
      { v: 'feet', l: 'Numbness in hands or feet' },
    ],
    applicableWhen: f => (f['person.age'] || 0) >= 30,
  },
  'ncd.womenSymptoms': {
    icon: 'ribbon', order: 96, type: 'multi', noneValue: 'none',
    q: 'Any of these for a woman?', hi: 'महिला के लिए इनमें से कुछ?',
    hint: 'Breast and cervical cancer signs on CBAC Part B',
    options: [
      { v: 'none', l: 'None of these' },
      { v: 'lump', l: 'Lump in the breast' },
      { v: 'discharge', l: 'Discharge from the nipple' },
      { v: 'shape', l: 'Breast shape has changed' },
      { v: 'betweenPeriods', l: 'Bleeding between periods' },
      { v: 'afterMenopause', l: 'Bleeding after menopause' },
      { v: 'afterSex', l: 'Bleeding after intercourse' },
      { v: 'foulDischarge', l: 'Foul-smelling discharge' },
    ],
    applicableWhen: f => (f['person.age'] || 0) >= 30 && f['person.sex'] !== 'M',
  },
  'ncd.otherSymptoms': {
    icon: 'brain', order: 97, type: 'multi', noneValue: 'none',
    q: 'Any of these problems?', hi: 'इनमें से कोई परेशानी?',
    options: [
      { v: 'none', l: 'None of these' },
      { v: 'fits', l: 'Fits or seizures' },
      { v: 'vision', l: 'Blurred vision' },
      { v: 'hearing', l: 'Trouble hearing' },
      { v: 'lowMood', l: 'Low mood, no interest in anything' },
      { v: 'sleep', l: 'Not sleeping' },
    ],
    applicableWhen: f => (f['person.age'] || 0) >= 30,
  },

  /* ---------------------------------------------------------------- illness */
  'illness.symptoms': {
    icon: 'thermometer', order: 86, type: 'multi',
    q: 'What is the problem?', hi: 'क्या तकलीफ़ है?',
    options: [
      { v: 'fever', l: 'Fever' },
      { v: 'cough', l: 'Cough or cold' },
      { v: 'diarrhoea', l: 'Loose motions' },
      { v: 'vomiting', l: 'Vomiting' },
      { v: 'bodyPain', l: 'Body pain' },
      { v: 'rash', l: 'Rash' },
      { v: 'breathless', l: 'Difficulty breathing' },
      { v: 'other', l: 'Something else' },
    ],
  },
  'illness.daysIll': {
    icon: 'clock', order: 87, q: 'For how many days?', hi: 'कितने दिन से?',
    type: 'number', unit: 'days', min: 0, max: 90,
  },
  'illness.dangerSigns': {
    icon: 'alert', order: 88, type: 'multi', noneValue: 'none',
    q: 'Any of these danger signs?', hi: 'कोई खतरे का लक्षण?',
    hint: 'Any one of these means send to the facility now',
    options: [
      { v: 'none', l: 'None of these' },
      { v: 'cannotDrink', l: 'Cannot drink or feed' },
      { v: 'vomitsAll', l: 'Vomits everything' },
      { v: 'convulsions', l: 'Convulsions' },
      { v: 'unconscious', l: 'Very sleepy or unconscious' },
      { v: 'fastBreathing', l: 'Fast breathing' },
      { v: 'chestIndrawing', l: 'Chest drawing in' },
      { v: 'bloodStool', l: 'Blood in the stool' },
      { v: 'sunkenEyes', l: 'Sunken eyes, no tears' },
    ],
  },
  'illness.orsZincGiven': {
    icon: 'glass', order: 89, q: 'Were ORS and zinc given?', hi: 'क्या ORS और ज़िंक दिया?',
    type: 'yesno',
    applicableWhen: f => (f['illness.symptoms'] || []).includes('diarrhoea'),
  },
  'illness.malariaTest': {
    icon: 'mosquito', order: 90, q: 'Was a malaria test done?', hi: 'क्या मलेरिया की जाँच हुई?',
    type: 'choice', options: [
      { v: 'negative', l: 'Rapid test, negative' },
      { v: 'positive', l: 'Rapid test, positive' },
      { v: 'slide', l: 'Blood slide taken' },
      { v: 'none', l: 'Not done' },
    ],
    applicableWhen: f => (f['illness.symptoms'] || []).includes('fever'),
  },
  'illness.paracetamolGiven': {
    icon: 'pill', order: 91, q: 'Was paracetamol given from the kit?',
    hi: 'क्या किट से पैरासिटामोल दी?', type: 'yesno',
    applicableWhen: f => (f['illness.symptoms'] || []).includes('fever'),
  },

  /* -------------------------------------------------------- services given */
  'tt.dose1Given': {
    icon: 'syringe', order: 110, q: 'Was TT/Td dose 1 given today?', hi: 'क्या आज TT/Td पहला टीका लगा?',
    type: 'yesno',
  },
  'ifa.given': {
    icon: 'pill', order: 111, q: 'Were IFA tablets handed over?', hi: 'क्या आयरन की गोलियाँ दीं?',
    type: 'yesno',
  },
  'referral.madeTo': {
    icon: 'hospital', order: 112, q: 'Where was she sent?', hi: 'कहाँ भेजा गया?',
    type: 'choice', options: [
      { v: 'none', l: 'Not sent anywhere' }, { v: 'subcentre', l: 'Sub-centre or ANM' },
      { v: 'phc', l: 'PHC or CHC' }, { v: 'dh', l: 'District hospital' },
    ],
  },
}

// Labels for display of every canonical path, derived ones included.
export const PATH_LABELS = {
  'person.name': 'Name', 'person.age': 'Age', 'person.sex': 'Sex',
  'person.husbandName': "Husband's / father's name", 'person.mobile': 'Mobile',
  'person.caste': 'Category', 'person.aadhaarLast4': 'Aadhaar (last 4)',
  'person.abhaId': 'ABHA ID',

  'household.houseNo': 'House no.', 'household.headName': 'Head of family',
  'household.village': 'Village', 'household.membersCount': 'Members',
  'household.bplCard': 'BPL card', 'household.hasToilet': 'Toilet',
  'household.waterSource': 'Water source', 'household.cookingFuel': 'Cooking fuel',
  'household.ayushmanCard': 'Ayushman card', 'household.eligibleCouples': 'Eligible couples',
  'household.fpMethod': 'Family planning method', 'household.pregnantWomen': 'Pregnant women',
  'household.childrenUnder5': 'Children under 5', 'household.birthsSince': 'Birth since last visit',
  'household.deathsSince': 'Death since last visit', 'household.mosquitoNet': 'Mosquito net',
  'household.unmetNeed': 'Unmet need for contraception',
  'household.surveyedOn': 'Surveyed on',

  'pregnancy.lmp': 'LMP', 'pregnancy.edd': 'EDD',
  'pregnancy.gestWeeks': 'Gestational age', 'pregnancy.gravida': 'Gravida',
  'pregnancy.prevCesarean': 'Previous caesarean',
  'pregnancy.registeredOn': 'Registered on', 'pregnancy.rchId': 'RCH ID',
  'pregnancy.isHighRisk': 'High-risk pregnancy',
  'anc.visit1Due': 'ANC 1 due', 'anc.visit2Due': 'ANC 2 due',
  'anc.visit3Due': 'ANC 3 due', 'anc.visit4Due': 'ANC 4 due',
  'anc.visitsDone': 'ANC visits done',

  'delivery.date': 'Date of delivery', 'delivery.place': 'Place of delivery',
  'delivery.type': 'Type of delivery', 'delivery.institutional': 'Institutional delivery',
  'delivery.jsyEligible': 'JSY claim eligible',

  'child.name': 'Child name', 'child.sex': 'Child sex',
  'child.dob': 'Date of birth', 'child.birthWeight': 'Birth weight',
  'child.ageDays': 'Age in days', 'child.ageMonths': 'Age in months',
  'child.lowBirthWeight': 'Low birth weight',
  'child.feedingMeals': 'Complementary feeds a day', 'child.deworming': 'Deworming given',
  'child.expectedDob': 'Expected child DOB', 'child.dobOrExpected': 'Child DOB, actual or expected',
  'child.bcgDue': 'BCG due', 'child.opv0Due': 'OPV-0 due',
  'child.penta1Due': 'Penta-1 due', 'child.penta2Due': 'Penta-2 due',
  'child.penta3Due': 'Penta-3 due', 'child.mr1Due': 'MR-1 due',
  'child.vitA1Due': 'Vitamin A 1 due',

  'newborn.visitDay': 'Day of life at this visit', 'newborn.visitNumber': 'HBNC visit number',
  'newborn.nextVisitDue': 'Next HBNC visit due', 'newborn.weightToday': 'Weight today',
  'newborn.temperature': 'Temperature', 'newborn.breastfedWithin1Hr': 'Breastfed within 1 hour',
  'newborn.exclusiveBreastfeed': 'Exclusively breastfed', 'newborn.dangerSigns': 'Newborn danger signs',
  'newborn.sepsisSuspected': 'Suspected sepsis', 'newborn.referred': 'Newborn referred',
  'mother.dangerSigns': 'Mother danger signs', 'mother.referred': 'Mother referred',
  'mother.postpartumFP': 'Postpartum FP counselled',

  'imm.dosesGiven': 'Vaccines given today', 'imm.dueList': 'Vaccines due',
  'imm.doseCount': 'Doses administered', 'imm.nextDue': 'Next vaccine due',
  'imm.sessionSite': 'Session site', 'imm.aefi': 'Reaction after vaccine',
  'imm.cardUpdated': 'MCP card updated', 'imm.upToDate': 'Immunisation up to date',

  'vitals.weight': 'Weight', 'vitals.height': 'Height',
  'vitals.bpSys': 'BP systolic', 'vitals.bpDia': 'BP diastolic', 'vitals.hb': 'Haemoglobin',
  'vitals.bloodSugar': 'Blood sugar', 'vitals.bmi': 'BMI',

  'tt.dose1Given': 'TT/Td dose 1', 'tt.dose2Due': 'TT/Td dose 2 due',
  'ifa.given': 'IFA given', 'ifa.tablets': 'IFA tablets',

  'ncd.age40plus': 'Age 40+', 'ncd.tobacco': 'Tobacco use',
  'ncd.alcohol': 'Daily alcohol', 'ncd.waistCm': 'Waist',
  'ncd.familyHistory': 'Family history', 'ncd.physicalActivity': 'Activity 150 min a week',
  'ncd.onTreatment': 'Already on treatment',
  'ncd.cbacScore': 'CBAC score', 'ncd.screenRequired': 'Screening required',
  'ncd.oralSymptoms': 'Oral cavity symptoms', 'ncd.skinSymptoms': 'Skin and sensation symptoms',
  'ncd.womenSymptoms': 'Breast and cervical symptoms', 'ncd.otherSymptoms': 'Other symptoms',
  'ncd.partBPositive': 'Part B symptom present', 'ncd.suspectedOral': 'Suspected oral lesion',
  'ncd.suspectedBreastCervical': 'Suspected breast or cervical lesion',
  'ncd.suspectedLeprosy': 'Suspected leprosy', 'ncd.mentalHealthFlag': 'Mental health follow-up',

  'tb.cough2weeks': 'Cough over 2 weeks', 'tb.symptoms': 'Other TB symptoms',
  'tb.referred': 'Referred for TB test', 'tb.symptomatic': 'TB presumptive',

  'illness.symptoms': 'Symptoms', 'illness.daysIll': 'Days ill',
  'illness.dangerSigns': 'Danger signs', 'illness.orsZincGiven': 'ORS and zinc given',
  'illness.malariaTest': 'Malaria test', 'illness.paracetamolGiven': 'Paracetamol given',
  'illness.referred': 'Referred urgently', 'illness.syndrome': 'IDSP syndrome',
  'referral.madeTo': 'Referred to', 'referral.any': 'Referral made',

  'hmis.reportMonth': 'Reporting month', 'hmis.ancNewRegistrations': 'New ANC registrations',
  'hmis.ttDosesGiven': 'TT doses given', 'hmis.ifaDistributed': 'IFA distributed',
  'hmis.hrpIdentified': 'HRP identified', 'hmis.hbncVisits': 'HBNC visits made',
  'hmis.newbornsWeighed': 'Newborns weighed', 'hmis.lbwNewborns': 'Low birth weight newborns',
  'hmis.institutionalDeliveries': 'Institutional deliveries',
  'hmis.immunisationDoses': 'Immunisation doses given', 'hmis.aefiReported': 'AEFI reported',
  'hmis.cbacFilled': 'CBAC forms filled', 'hmis.ncdReferred': 'NCD referrals',
  'hmis.feverCases': 'Fever cases seen', 'hmis.diarrhoeaOrs': 'Diarrhoea cases given ORS',
  'hmis.ariCases': 'ARI cases seen', 'hmis.malariaPositive': 'Malaria positive',
  'hmis.householdsSurveyed': 'Households surveyed',

  'visit.date': 'Visit date', 'visit.ashaId': 'ASHA code',
  'visit.type': 'Visit type', 'visit.consentGiven': 'Consent taken',
}

// Which paths a household remembers between visits, so they are never re-asked.
/* What a household never has to say twice.
 *
 * The rule is simple: anything that does not change between two visits. Who
 * she is, where she lives, which papers she holds, and — within one pregnancy
 * — when it started and when it is due. Her name was missing from this list,
 * which is why a follow-up visit opened by asking a woman her own name again.
 *
 * Almost nothing measured belongs here. Weight, blood pressure, haemoglobin,
 * today's symptoms and today's doses are taken fresh every visit, which is the
 * point of the visit. Height is the exception: an adult's does not change.
 */
export const REMEMBERED_PATHS = [
  // the household
  'household.houseNo', 'household.headName', 'household.village',
  'household.membersCount', 'household.bplCard', 'household.hasToilet',
  'household.waterSource', 'household.cookingFuel', 'household.ayushmanCard',

  // the person
  'person.name', 'person.sex', 'person.age',
  'vitals.height',                // measured once for an adult, not every visit
  'person.husbandName', 'person.caste',
  'person.aadhaarLast4', 'person.mobile', 'person.abhaId',

  // this pregnancy — fixed once it is registered
  'pregnancy.lmp', 'pregnancy.edd', 'pregnancy.rchId',
  'pregnancy.registeredOn', 'pregnancy.gravida',

  // this child — fixed facts of birth
  'child.name', 'child.sex', 'child.dob', 'child.birthWeight',
  'delivery.date', 'delivery.place', 'delivery.type',
]
