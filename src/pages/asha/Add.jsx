import { useNavigate } from 'react-router-dom'
import programmes from '../../data/programmes'
import { TopBar, Card, Section, Notice } from '../../components/ui'
import Icon from '../../components/Icon'

const WAYS = [
  { id: 'scheme', mark: 'layers', to: '/asha/forms',
    title: 'Fill a scheme form', sub: 'Published by the block office',
    body: 'PMMVY, JSY, Anganwadi registration and more. Pick the person and the form fills itself from her record — only what is genuinely new is asked.',
    tag: 'New' },
  { id: 'existing', mark: 'clipboard', to: '/asha/families?pick=1',
    title: 'Fill an existing form', sub: 'The usual visit',
    body: 'Pick the household. The app works out the fewest questions that satisfy every programme at once.',
    tag: null },
  { id: 'scan', mark: 'scan', to: '/asha/scan',
    title: 'Scan a paper form', sub: 'Camera or PDF',
    body: 'Photograph a filled register page or form. The text is read, matched to the canonical record and shown for you to confirm.',
    tag: 'OCR' },
  { id: 'new', mark: 'edit', to: '/asha/new-schema',
    title: 'Build a new form', sub: 'A programme we do not have yet',
    body: 'Upload the government PDF and let it be read into a schema, or add the fields by hand.',
    tag: 'Agent' },
]

export default function Add() {
  const nav = useNavigate()
  return (
    <>
      <TopBar title="Add an entry" sub="Three ways in" back onBack={() => nav('/asha')} />
      <main className="flex-1 px-4 py-4 space-y-3.5 pb-8">
        {WAYS.map(w => (
          <button key={w.id} onClick={() => nav(w.to)} className="press raise w-full text-left rounded-3xl p-5">
            <div className="flex items-start gap-3.5">
              <span className="raise-sm w-12 h-12 shrink-0 rounded-2xl grid place-items-center text-brand text-[20px]">
                <Icon name={w.mark} size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-[17px] leading-tight tracking-[-0.01em]">{w.title}</div>
                  {w.tag && (
                    <span className="text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded
                                     bg-agent-soft text-agent">{w.tag}</span>
                  )}
                </div>
                <div className="text-[12px] text-ink-3 mt-0.5">{w.sub}</div>
                <div className="text-[13px] text-ink-2 mt-2 leading-relaxed">{w.body}</div>
              </div>
              <span className="text-ink-3 text-[20px] leading-none mt-2">›</span>
            </div>
          </button>
        ))}

        <Section title="Programmes this app can fill" className="pt-2">
          <div className="raise rounded-2xl p-4">
            <div className="flex flex-wrap gap-2">
              {programmes.map(p => (
                <span key={p.code} className="raise-sm text-[12px] font-semibold px-2.5 py-1.5 rounded-lg text-ink-2">
                  {p.shortName} <span className="text-ink-3 num">· {p.fields.length}</span>
                </span>
              ))}
            </div>
            <p className="text-[12px] text-ink-3 mt-3.5 leading-relaxed">
              {programmes.reduce((n, p) => n + p.fields.length, 0)} field entries in total. Each programme
              is one file — adding a sixth needs no new app.
            </p>
          </div>
        </Section>
      </main>
    </>
  )
}
