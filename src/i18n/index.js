import { useStore } from '../store/useStore'

/* A health app cannot ship machine-translated clinical wording. English and
   Hindi are complete and reviewed here; the rest are listed as pending a
   native-speaker review rather than shipped half-done. */
export { LANGS, READY, LOCALE } from './langs'
import { LOCALE } from './langs'

const EN = {
  appName: 'ASHAFlow',
  tagline: 'One visit. One entry. Five systems.',

  'nav.home': 'Home', 'nav.families': 'Families', 'nav.add': 'Add',
  'nav.assist': 'Assist', 'nav.earnings': 'Earnings',

  'common.back': 'Back', 'common.next': 'Next', 'common.done': 'Done',
  'common.save': 'Save', 'common.cancel': 'Cancel', 'common.close': 'Close',
  'common.yes': 'Yes', 'common.no': 'No', 'common.online': 'Online',
  'common.offline': 'Offline', 'common.settings': 'Settings',
  'common.profile': 'Profile', 'common.language': 'Language',
  'common.signOut': 'Sign out', 'common.readAloud': 'Read aloud',
  'common.due': 'Due', 'common.overdue': 'Overdue', 'common.sent': 'Sent',

  'home.greeting': 'Namaste', 'home.toVisit': 'to visit',
  'home.overdue': 'overdue', 'home.toSend': 'to send',
  'home.addEntry': 'Add an entry',
  'home.addEntrySub': 'Fill a form · scan one · build a new one',
  'home.scanForm': 'Scan a form', 'home.askAssistant': 'Ask assistant',
  'home.reminders': 'Reminders', 'home.visitToday': 'Visit today',
  'home.urgentFirst': 'Most urgent first.',
  'home.thisMonth': 'This month', 'home.allSent': 'All sent',
  'home.waiting': 'waiting for signal', 'home.unclaimed': 'unclaimed',
  'home.govPortal': 'Government portal',
  'home.govPortalSub': 'Submit proofs and claims',
  'home.counter': 'Duplication counter', 'home.counterSub': 'The 87 → 11 number, live',
  'home.settingsMore': 'Settings and more', 'home.open': 'Open',

  'add.title': 'Add an entry', 'add.sub': 'Three ways in',
  'add.existing': 'Fill an existing form', 'add.existingSub': 'The usual visit',
  'add.scan': 'Scan a paper form', 'add.scanSub': 'Camera or PDF',
  'add.new': 'Build a new form', 'add.newSub': 'A programme we do not have yet',

  'assist.title': 'Assistant', 'assist.sub': 'Your caseload, schemes and anything else',
  'assist.empty': 'How can I help?',
  'assist.emptyBody': 'I can read your own {families} families and {people} people — ask who is due, anyone by name, your earnings, or any question at all.',
  'assist.try': 'Try asking', 'assist.placeholder': 'Ask anything, or a name…',
  'assist.readFrom': 'Read from', 'assist.listening': 'Listening…',
  'assist.guard': 'Type, or hold a conversation by voice. Never medical advice, and it never changes a record.',
  'assist.liveHint': 'Speak naturally. It answers aloud and then listens again. Say “stop” to end.',
  'assist.offlineBody': 'No signal — answers now come from your own records on this phone. Everything else keeps working.',
  'assist.generalNote': 'General guidance, not from your records. Check anything local with your ANM.',
  'assist.verifyNote': 'Scheme rules vary by state and revision — verify on the programme portal.',
  'assist.onDevice': 'on device',
  'assist.canDo1': 'Who is due today', 'assist.canDo2': 'Your earnings',
  'assist.canDo3': 'What a scheme needs', 'assist.canDo4': 'Talk instead of typing',
  'assist.thinking': 'Thinking',

  'profile.title': 'Profile', 'profile.thisMonth': 'This month',
  'profile.visits': 'visits', 'profile.households': 'households',
  'profile.records': 'records made', 'profile.earned': 'earned',
  'profile.saved': 'writing saved', 'profile.verification': 'Verification',
  'profile.whereYouWork': 'Where you work', 'profile.reportTo': 'Who you report to',
  'profile.payment': 'Payment details', 'profile.training': 'Training',
  'profile.documents': 'Your documents', 'profile.call': 'Call',

  'settings.title': 'Settings', 'settings.display': 'Display',
  'settings.biggerText': 'Bigger text', 'settings.biggerTextSub': 'Easier to read outdoors',
  'settings.readAloudSub': 'Speaker button on every question',
  'settings.voice': 'Voice', 'settings.data': 'Data and sync',
  'settings.pretendOffline': 'Pretend offline',
  'settings.pretendOfflineSub': 'For showing how offline works',
  'settings.privacy': 'Privacy', 'settings.otherPortals': 'Other views',
  'settings.about': 'About', 'settings.reset': 'Reset demo data',
  'settings.langNote': 'Only reviewed translations are offered. A health app should not ship machine-translated clinical wording.',
  'settings.comingSoon': 'Needs a native-speaker review',
}

const HI = {
  appName: 'आशाफ़्लो',
  tagline: 'एक भेंट। एक बार दर्ज। पाँच प्रणालियाँ।',

  'nav.home': 'होम', 'nav.families': 'परिवार', 'nav.add': 'जोड़ें',
  'nav.assist': 'सहायक', 'nav.earnings': 'कमाई',

  'common.back': 'वापस', 'common.next': 'आगे', 'common.done': 'हो गया',
  'common.save': 'सहेजें', 'common.cancel': 'रद्द करें', 'common.close': 'बंद करें',
  'common.yes': 'हाँ', 'common.no': 'नहीं', 'common.online': 'ऑनलाइन',
  'common.offline': 'ऑफ़लाइन', 'common.settings': 'सेटिंग',
  'common.profile': 'प्रोफ़ाइल', 'common.language': 'भाषा',
  'common.signOut': 'साइन आउट', 'common.readAloud': 'सुनें',
  'common.due': 'बाकी', 'common.overdue': 'देर से', 'common.sent': 'भेजा गया',

  'home.greeting': 'नमस्ते', 'home.toVisit': 'जाना है',
  'home.overdue': 'देर से', 'home.toSend': 'भेजना है',
  'home.addEntry': 'नई प्रविष्टि',
  'home.addEntrySub': 'फ़ॉर्म भरें · स्कैन करें · नया बनाएँ',
  'home.scanForm': 'फ़ॉर्म स्कैन', 'home.askAssistant': 'सहायक से पूछें',
  'home.reminders': 'याद दिलाना', 'home.visitToday': 'आज की भेंट',
  'home.urgentFirst': 'सबसे ज़रूरी पहले।',
  'home.thisMonth': 'इस महीने', 'home.allSent': 'सब भेज दिया',
  'home.waiting': 'सिग्नल का इंतज़ार', 'home.unclaimed': 'बिना दावा',
  'home.govPortal': 'सरकारी पोर्टल',
  'home.govPortalSub': 'प्रमाण और दावे भेजें',
  'home.counter': 'दोहराव गिनती', 'home.counterSub': '87 → 11 का हिसाब',
  'home.settingsMore': 'सेटिंग और अन्य', 'home.open': 'खोलें',

  'add.title': 'नई प्रविष्टि', 'add.sub': 'तीन तरीके',
  'add.existing': 'मौजूदा फ़ॉर्म भरें', 'add.existingSub': 'रोज़ की भेंट',
  'add.scan': 'काग़ज़ी फ़ॉर्म स्कैन करें', 'add.scanSub': 'कैमरा या PDF',
  'add.new': 'नया फ़ॉर्म बनाएँ', 'add.newSub': 'ऐसा कार्यक्रम जो अभी नहीं है',

  'assist.title': 'सहायक', 'assist.sub': 'आपका काम, योजनाएँ और बाक़ी सब',
  'assist.empty': 'मैं कैसे मदद करूँ?',
  'assist.emptyBody': 'मैं आपके {families} परिवार और {people} लोगों का रिकॉर्ड पढ़ सकता हूँ — पूछिए आज किसके पास जाना है, किसी का नाम, आपकी कमाई, या कुछ भी।',
  'assist.try': 'ये पूछकर देखें', 'assist.placeholder': 'कुछ भी पूछें, या नाम लिखें…',
  'assist.readFrom': 'इससे पढ़ा', 'assist.listening': 'सुन रहा हूँ…',
  'assist.guard': 'लिखिए, या बोलकर बात कीजिए। चिकित्सा सलाह कभी नहीं, और रिकॉर्ड कभी नहीं बदलता।',
  'assist.liveHint': 'बस बोलिए। यह बोलकर जवाब देगा और फिर सुनेगा। ख़त्म करने के लिए “बंद करो” कहें।',
  'assist.offlineBody': 'सिग्नल नहीं है — जवाब अभी इसी फ़ोन के आपके रिकॉर्ड से आ रहे हैं। बाक़ी सब चलता रहेगा।',
  'assist.generalNote': 'यह सामान्य जानकारी है, आपके रिकॉर्ड से नहीं। स्थानीय बात ANM से पक्की कर लें।',
  'assist.verifyNote': 'योजना के नियम राज्य और संशोधन से बदलते हैं — पोर्टल पर जाँच लें।',
  'assist.onDevice': 'फ़ोन पर',
  'assist.canDo1': 'आज किसके पास जाना है', 'assist.canDo2': 'आपकी कमाई',
  'assist.canDo3': 'योजना के लिए काग़ज़', 'assist.canDo4': 'लिखने की जगह बोलिए',
  'assist.thinking': 'सोच रहा हूँ',

  'profile.title': 'प्रोफ़ाइल', 'profile.thisMonth': 'इस महीने',
  'profile.visits': 'भेंट', 'profile.households': 'परिवार',
  'profile.records': 'रिकॉर्ड बने', 'profile.earned': 'कमाई',
  'profile.saved': 'लिखाई बची', 'profile.verification': 'सत्यापन',
  'profile.whereYouWork': 'आपका कार्यक्षेत्र', 'profile.reportTo': 'आप किसे रिपोर्ट करती हैं',
  'profile.payment': 'भुगतान विवरण', 'profile.training': 'प्रशिक्षण',
  'profile.documents': 'आपके दस्तावेज़', 'profile.call': 'कॉल',

  'settings.title': 'सेटिंग', 'settings.display': 'दिखावट',
  'settings.biggerText': 'बड़ा अक्षर', 'settings.biggerTextSub': 'धूप में पढ़ना आसान',
  'settings.readAloudSub': 'हर सवाल पर सुनने का बटन',
  'settings.voice': 'आवाज़', 'settings.data': 'डेटा और सिंक',
  'settings.pretendOffline': 'ऑफ़लाइन दिखाएँ',
  'settings.pretendOfflineSub': 'ऑफ़लाइन काम दिखाने के लिए',
  'settings.privacy': 'निजता', 'settings.otherPortals': 'अन्य दृश्य',
  'settings.about': 'ऐप के बारे में', 'settings.reset': 'डेमो डेटा रीसेट करें',
  'settings.langNote': 'केवल जाँची गई भाषाएँ दी जाती हैं। स्वास्थ्य ऐप में मशीनी अनुवाद नहीं चलना चाहिए।',
  'settings.comingSoon': 'मूल वक्ता की जाँच बाकी',
}

const TE = {
  appName: 'ఆశాఫ్లో',
  tagline: 'ఒక సందర్శన. ఒకసారి నమోదు. ఐదు వ్యవస్థలు.',

  'nav.home': 'హోమ్', 'nav.families': 'కుటుంబాలు', 'nav.add': 'చేర్చు',
  'nav.assist': 'సహాయకుడు', 'nav.earnings': 'సంపాదన',

  'common.back': 'వెనక్కి', 'common.next': 'తరువాత', 'common.done': 'పూర్తయింది',
  'common.save': 'భద్రపరచు', 'common.cancel': 'రద్దు', 'common.close': 'మూసివేయి',
  'common.yes': 'అవును', 'common.no': 'కాదు', 'common.online': 'ఆన్‌లైన్',
  'common.offline': 'ఆఫ్‌లైన్', 'common.settings': 'సెట్టింగ్‌లు',
  'common.profile': 'ప్రొఫైల్', 'common.language': 'భాష',
  'common.signOut': 'సైన్ అవుట్', 'common.readAloud': 'చదివి వినిపించు',
  'common.due': 'రావలసినది', 'common.overdue': 'ఆలస్యం', 'common.sent': 'పంపబడింది',

  'home.greeting': 'నమస్తే', 'home.toVisit': 'వెళ్ళాలి',
  'home.overdue': 'ఆలస్యం', 'home.toSend': 'పంపాలి',
  'home.addEntry': 'కొత్త నమోదు',
  'home.addEntrySub': 'ఫారం నింపండి · స్కాన్ చేయండి · కొత్తది చేయండి',
  'home.scanForm': 'ఫారం స్కాన్', 'home.askAssistant': 'సహాయకుడిని అడగండి',
  'home.reminders': 'గుర్తు చేయి', 'home.visitToday': 'ఈ రోజు సందర్శనలు',
  'home.urgentFirst': 'ముఖ్యమైనవి ముందు.',
  'home.thisMonth': 'ఈ నెల', 'home.allSent': 'అన్నీ పంపబడ్డాయి',
  'home.waiting': 'సిగ్నల్ కోసం ఎదురుచూపు', 'home.unclaimed': 'క్లెయిమ్ చేయనివి',
  'home.govPortal': 'ప్రభుత్వ పోర్టల్',
  'home.govPortalSub': 'రుజువులు, క్లెయిమ్‌లు పంపండి',
  'home.counter': 'నకిలీ లెక్క', 'home.counterSub': '87 → 11 లెక్క',
  'home.settingsMore': 'సెట్టింగ్‌లు, ఇతరాలు', 'home.open': 'తెరువు',

  'add.title': 'కొత్త నమోదు', 'add.sub': 'మూడు మార్గాలు',
  'add.existing': 'ఉన్న ఫారం నింపండి', 'add.existingSub': 'రోజువారీ సందర్శన',
  'add.scan': 'కాగితపు ఫారం స్కాన్ చేయండి', 'add.scanSub': 'కెమెరా లేదా PDF',
  'add.new': 'కొత్త ఫారం తయారు చేయండి', 'add.newSub': 'ఇంకా లేని కార్యక్రమం',

  'assist.title': 'సహాయకుడు', 'assist.sub': 'మీ పని, పథకాలు, ఇంకా ఏదైనా',
  'assist.empty': 'నేను ఎలా సహాయపడగలను?',
  'assist.emptyBody': 'మీ {families} కుటుంబాలు, {people} మంది రికార్డు నేను చదవగలను — ఈరోజు ఎవరి దగ్గరకు వెళ్లాలి, ఎవరి పేరైనా, మీ సంపాదన, లేదా ఏ ప్రశ్న అయినా అడగండి.',
  'assist.try': 'ఇలా అడిగి చూడండి', 'assist.placeholder': 'ఏదైనా అడగండి, లేదా పేరు…',
  'assist.readFrom': 'దీని నుంచి చదివాను', 'assist.listening': 'వింటున్నాను…',
  'assist.guard': 'రాయండి, లేదా మాట్లాడుతూ సంభాషించండి. వైద్య సలహా ఇవ్వదు, రికార్డును మార్చదు.',
  'assist.liveHint': 'మామూలుగా మాట్లాడండి. బదులు చెప్పి మళ్ళీ వింటుంది. ముగించడానికి “ఆపు” అనండి.',
  'assist.offlineBody': 'సిగ్నల్ లేదు — ఇప్పుడు జవాబులు ఈ ఫోన్‌లోని మీ రికార్డుల నుంచే వస్తున్నాయి. మిగతావన్నీ పని చేస్తాయి.',
  'assist.generalNote': 'ఇది సాధారణ సమాచారం, మీ రికార్డు నుంచి కాదు. స్థానిక విషయాలు ANMని అడిగి నిర్ధారించుకోండి.',
  'assist.verifyNote': 'పథక నియమాలు రాష్ట్రాన్ని బట్టి మారతాయి — పోర్టల్‌లో సరిచూసుకోండి.',
  'assist.onDevice': 'ఫోన్‌లో',
  'assist.canDo1': 'ఈరోజు ఎవరి దగ్గరకు', 'assist.canDo2': 'మీ సంపాదన',
  'assist.canDo3': 'పథకానికి కాగితాలు', 'assist.canDo4': 'రాయడానికి బదులు మాట్లాడండి',
  'assist.thinking': 'ఆలోచిస్తున్నాను',

  'profile.title': 'ప్రొఫైల్', 'profile.thisMonth': 'ఈ నెల',
  'profile.visits': 'సందర్శనలు', 'profile.households': 'కుటుంబాలు',
  'profile.records': 'రికార్డులు', 'profile.earned': 'సంపాదన',
  'profile.saved': 'రాత ఆదా', 'profile.verification': 'ధృవీకరణ',
  'profile.whereYouWork': 'మీ పని ప్రాంతం', 'profile.reportTo': 'మీరు ఎవరికి నివేదిస్తారు',
  'profile.payment': 'చెల్లింపు వివరాలు', 'profile.training': 'శిక్షణ',
  'profile.documents': 'మీ పత్రాలు', 'profile.call': 'కాల్',

  'settings.title': 'సెట్టింగ్‌లు', 'settings.display': 'ప్రదర్శన',
  'settings.biggerText': 'పెద్ద అక్షరాలు', 'settings.biggerTextSub': 'ఎండలో చదవడం సులభం',
  'settings.readAloudSub': 'ప్రతి ప్రశ్నపై వినే బటన్',
  'settings.voice': 'వాయిస్', 'settings.data': 'డేటా, సింక్',
  'settings.pretendOffline': 'ఆఫ్‌లైన్‌గా చూపించు',
  'settings.pretendOfflineSub': 'ఆఫ్‌లైన్ పని చూపించడానికి',
  'settings.privacy': 'గోప్యత', 'settings.otherPortals': 'ఇతర వీక్షణలు',
  'settings.about': 'యాప్ గురించి', 'settings.reset': 'డెమో డేటా రీసెట్',
  'settings.langNote': 'సమీక్షించిన అనువాదాలు మాత్రమే ఇస్తాము. ఆరోగ్య యాప్‌లో యంత్ర అనువాదం ఉండకూడదు.',
  'settings.comingSoon': 'స్థానిక భాషా సమీక్ష పెండింగ్',
}

const DICT = { en: EN, hi: HI, te: TE }

export function t(key, lang) {
  const d = DICT[lang] || DICT.en
  return d[key] ?? DICT.en[key] ?? key
}

/** Returns a translate function bound to the current language. */
export function useT() {
  const lang = useStore(s => s.lang)
  const fn = key => t(key, lang)
  fn.lang = lang
  fn.isHi = lang === 'hi'
  return fn
}

export const dateLocale = lang => LOCALE[lang] || 'en-IN'

export const speechLocale = lang => LOCALE[lang] || 'en-IN'
