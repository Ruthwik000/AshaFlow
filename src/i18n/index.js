import { useStore } from '../store/useStore'

/* A health app cannot ship machine-translated clinical wording. English and
   Hindi are complete and reviewed here; the rest are listed as pending a
   native-speaker review rather than shipped half-done. */
export const LANGS = [
  { code: 'en', label: 'English',  native: 'English',  ready: true },
  { code: 'hi', label: 'Hindi',    native: 'हिन्दी',    ready: true },
  { code: 'mr', label: 'Marathi',  native: 'मराठी',     ready: false },
  { code: 'bn', label: 'Bengali',  native: 'বাংলা',     ready: false },
  { code: 'ta', label: 'Tamil',    native: 'தமிழ்',     ready: false },
  { code: 'te', label: 'Telugu',   native: 'తెలుగు',    ready: false },
]

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

  'assist.title': 'Assistant', 'assist.sub': 'Schemes, forms and your work',
  'assist.empty': 'How can I help?',
  'assist.emptyBody': 'Ask about any scheme, attach a government form and I will read it, or have me turn a form into a capture screen.',
  'assist.try': 'Try asking', 'assist.placeholder': 'Ask about a scheme…',
  'assist.readFrom': 'Read from', 'assist.listening': 'Listening…',
  'assist.guard': 'Scheme and process questions only. Never medical advice, and it never changes a record.',
  'assist.canDo1': 'Explain a scheme', 'assist.canDo2': 'Read a PDF',
  'assist.canDo3': 'Build a form', 'assist.canDo4': 'Speak or type',
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

  'assist.title': 'सहायक', 'assist.sub': 'योजनाएँ, फ़ॉर्म और आपका काम',
  'assist.empty': 'मैं कैसे मदद करूँ?',
  'assist.emptyBody': 'किसी भी योजना के बारे में पूछें, कोई सरकारी फ़ॉर्म भेजें — मैं उसे पढ़ लूँगा, या उसी से भरने की स्क्रीन बना दूँगा।',
  'assist.try': 'ये पूछकर देखें', 'assist.placeholder': 'योजना के बारे में पूछें…',
  'assist.readFrom': 'इससे पढ़ा', 'assist.listening': 'सुन रहा हूँ…',
  'assist.guard': 'केवल योजना और प्रक्रिया के सवाल। चिकित्सा सलाह कभी नहीं, और रिकॉर्ड कभी नहीं बदलता।',
  'assist.canDo1': 'योजना समझाएँ', 'assist.canDo2': 'PDF पढ़ें',
  'assist.canDo3': 'फ़ॉर्म बनाएँ', 'assist.canDo4': 'बोलें या लिखें',
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

const DICT = { en: EN, hi: HI }

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

export const dateLocale = lang => ({ hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN' }[lang] || 'en-IN')

export const speechLocale = lang => ({ hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN' }[lang] || 'en-IN')
