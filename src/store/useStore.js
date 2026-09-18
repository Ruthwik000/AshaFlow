import { create } from 'zustand'
import { ASHA } from '../data/seed'

const read = (k, d) => {
  try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) } catch { return d }
}
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode */ } }

export const useStore = create((set, get) => ({
  asha: ASHA,
  loggedIn: read('af.loggedIn', false),
  role: read('af.role', 'asha'),
  lang: ['en', 'hi'].includes(read('af.lang', 'en')) ? read('af.lang', 'en') : 'en',
  womanMode: ['pregnant', 'mother'].includes(read('af.womanMode', 'pregnant'))
    ? read('af.womanMode', 'pregnant') : 'pregnant',
  // which scheme forms the officer has published to the field
  publishedForms: read('af.publishedForms', ['PMMVY-1A', 'JSY-CLAIM', 'ICDS-REG', 'BIRTH-REG']),
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  demoOffline: read('af.demoOffline', false),
  bigText: read('af.bigText', false),
  speak: read('af.speak', true),

  // the encounter currently being captured
  draft: null,

  login: (role = 'asha') => { write('af.loggedIn', true); write('af.role', role); set({ loggedIn: true, role }) },
  logout: () => { write('af.loggedIn', false); set({ loggedIn: false }) },
  setOnline: v => set({ online: v }),
  toggleDemoOffline: () => { const v = !get().demoOffline; write('af.demoOffline', v); set({ demoOffline: v }) },
  toggleBigText: () => { const v = !get().bigText; write('af.bigText', v); set({ bigText: v }) },
  toggleSpeak: () => { const v = !get().speak; write('af.speak', v); set({ speak: v }) },
  setLang: l => { write('af.lang', l); set({ lang: l }) },
  setWomanMode: m => { write('af.womanMode', m); set({ womanMode: m }) },
  toggleForm: code => {
    const cur = get().publishedForms
    const next = cur.includes(code) ? cur.filter(c => c !== code) : [...cur, code]
    write('af.publishedForms', next); set({ publishedForms: next })
  },

  startDraft: d => set({ draft: { facts: {}, answeredOrder: [], ...d } }),
  answer: (paths, meta) => set(s => {
    if (!s.draft) return s
    const facts = { ...s.draft.facts, ...paths }
    const order = s.draft.answeredOrder.filter(o => o.key !== meta.key).concat([meta])
    return { draft: { ...s.draft, facts, answeredOrder: order } }
  }),
  unanswer: key => set(s => {
    if (!s.draft) return s
    const meta = s.draft.answeredOrder.find(o => o.key === key)
    const facts = { ...s.draft.facts }
    ;(meta?.paths || [key]).forEach(p => { delete facts[p] })
    return { draft: { ...s.draft, facts, answeredOrder: s.draft.answeredOrder.filter(o => o.key !== key) } }
  }),
  clearDraft: () => set({ draft: null }),

  isOffline: () => get().demoOffline || !get().online,
}))

export function say(text) {
  try {
    if (!useStore.getState().speak) return
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const l = useStore.getState().lang
    u.lang = { hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN' }[l] || 'en-IN'
    u.rate = 0.92
    window.speechSynthesis.speak(u)
  } catch { /* speech is a nicety, never a dependency */ }
}
