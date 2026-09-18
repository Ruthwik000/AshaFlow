/* The language list and locales, kept separate from the dictionaries so the
   store can import it without a circular dependency. */
export const LANGS = [
  { code: 'en', label: 'English',   native: 'English',   ready: true },
  { code: 'hi', label: 'Hindi',     native: 'हिन्दी',     ready: true },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు',     ready: true },
  { code: 'mr', label: 'Marathi',   native: 'मराठी',      ready: false },
  { code: 'bn', label: 'Bengali',   native: 'বাংলা',      ready: false },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்',      ready: false },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ',      ready: false },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം',    ready: false },
  { code: 'gu', label: 'Gujarati',  native: 'ગુજરાતી',    ready: false },
  { code: 'pa', label: 'Punjabi',   native: 'ਪੰਜਾਬੀ',     ready: false },
  { code: 'or', label: 'Odia',      native: 'ଓଡ଼ିଆ',      ready: false },
  { code: 'as', label: 'Assamese',  native: 'অসমীয়া',    ready: false },
  { code: 'ur', label: 'Urdu',      native: 'اردو',      ready: false },
]

export const READY = LANGS.filter(l => l.ready).map(l => l.code)

export const LOCALE = {
  en: 'en-IN', hi: 'hi-IN', te: 'te-IN', mr: 'mr-IN', bn: 'bn-IN', ta: 'ta-IN',
  kn: 'kn-IN', ml: 'ml-IN', gu: 'gu-IN', pa: 'pa-IN', or: 'or-IN', as: 'as-IN', ur: 'ur-IN',
}
