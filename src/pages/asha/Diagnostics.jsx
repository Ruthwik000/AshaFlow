import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AI, hasProxy, keyShape, explain } from '../../ai/config'
import { testGemini, testGrok } from '../../ai/providers'
import Icon from '../../components/Icon'
import { TopBar, Card, Section, Btn, Pill, Notice, List, Row } from '../../components/ui'

const PROVIDERS = [
  { id: 'gemini', label: 'Gemini', envKey: 'VITE_GEMINI_API_KEY', run: testGemini,
    key: () => AI.gemini.key, model: () => AI.gemini.model, vision: () => AI.gemini.vision,
    does: 'Chat first · Primary OCR vision' },
  { id: 'grok', label: AI.grok.label, envKey: 'VITE_GROK_API_KEY', run: testGrok,
    key: () => AI.grok.key, model: () => AI.grok.model, vision: () => AI.grok.vision,
    does: AI.grok.service === 'groq' ? 'Ultra-fast chat (~500 tps) · Text & Reasoning' : 'Chat fallback · OCR first' },
]

export default function Diagnostics() {
  const nav = useNavigate()
  const [results, setResults] = useState({})
  const [busy, setBusy] = useState(false)

  const runAll = async () => {
    setBusy(true); setResults({})
    for (const p of PROVIDERS) {
      if (!p.key() && !hasProxy()) {
        setResults(r => ({ ...r, [p.id]: { state: 'missing' } }))
        continue
      }
      setResults(r => ({ ...r, [p.id]: { state: 'running' } }))
      try {
        const out = await p.run()
        setResults(r => ({ ...r, [p.id]: { state: 'ok', ...out } }))
      } catch (e) {
        setResults(r => ({ ...r, [p.id]: { state: 'fail', ...explain(p.label, e) } }))
      }
    }
    setBusy(false)
  }

  return (
    <>
      <TopBar title="Check the keys" sub="What is actually reaching the providers"
        back onBack={() => nav('/asha/more')} />

      <main className="flex-1 px-4 py-4 space-y-4 pb-8">

        {hasProxy() && (
          <Notice tone="info" title="Using your backend">
            Requests go to <code>{AI.proxy}</code>. The keys live there, not in this page.
          </Notice>
        )}

        <Btn full onClick={runAll} disabled={busy}>
          {busy ? 'Checking…' : 'Test the connections'}
        </Btn>

        {AI.grok.key && (
          <Notice tone={AI.grok.service ? 'brand' : 'due'} title={`Key read as ${AI.grok.label}`}>
            The prefix <code>{AI.grok.key.slice(0, 4)}</code> says this is a{' '}
            {AI.grok.service === 'groq' ? 'Groq key, so calls go to ' : 'an xAI key, so calls go to '}
            <code>{AI.grok.base}</code>. xAI keys begin <code>xai-</code> and Groq keys begin{' '}
            <code>gsk_</code>; each service refuses the other's key with what looks like a
            "bad key" error.
            {AI.grok.ignoredModel && (
              <> The chat model <code>{AI.grok.ignoredModel}</code> in .env belongs to the other
              service and is ignored.</>
            )}
            {AI.grok.ignoredVision && (
              <> The vision model <code>{AI.grok.ignoredVision}</code> in .env belongs to the other
              service and is ignored.</>
            )}
            <div className="mt-2 text-[12px]">
              Model names are not hardcoded: the app asks this key what it can use and picks from
              that, so a retired name costs one wasted request and never a broken screen. Run the
              test above to see what it settled on.
            </div>
          </Notice>
        )}

        {PROVIDERS.map(p => {
          const k = keyShape(p.key())
          const r = results[p.id]
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[16px] leading-tight">{p.label}</div>
                  <div className="text-[12.5px] text-ink-3 mt-0.5">{p.does}</div>
                </div>
                {r?.state === 'ok' && <Pill level="done">Working</Pill>}
                {r?.state === 'fail' && <Pill level="late">Failed</Pill>}
                {r?.state === 'missing' && <Pill level="due">No key</Pill>}
                {r?.state === 'running' && <Pill level="info">Checking…</Pill>}
              </div>

              <div className="mt-3 pt-3 border-t border-line-2 space-y-1.5 text-[12.5px]">
                <div className="flex justify-between gap-3">
                  <span className="text-ink-2">Key in the page</span>
                  <span className={`font-semibold num ${k.present ? 'text-brand' : 'text-late'}`}>
                    {k.present ? `${k.prefix}…${k.suffix} · ${k.length} chars` : 'not found'}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-2">Chat model</span>
                  <span className="font-semibold num text-right">
                    {r?.willUseChat || <span className="text-ink-3">asked at the first call</span>}
                  </span>
                </div>
                {p.id === 'grok' && AI.grok.service === 'groq' ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-2">Vision model</span>
                    <span className="text-brand font-medium text-right">Handled by Gemini</span>
                  </div>
                ) : (
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-2">Vision model</span>
                    <span className="font-semibold num text-right">
                      {r?.willUseVision || <span className="text-ink-3">asked at the first call</span>}
                    </span>
                  </div>
                )}
                {k.hasSpace && (
                  <div className="text-late font-semibold">
                    The key contains a space — check for a line break in .env.
                  </div>
                )}
              </div>

              {r?.state === 'ok' && (
                <div className="mt-3 pt-3 border-t border-line-2">
                  <div className="text-[12px] text-ink-3 mb-1.5">
                    {r.models?.length} model{r.models?.length === 1 ? '' : 's'} available to this key
                  </div>
                  {r.hasConfigured === false && (
                    <p className="text-[12.5px] text-due font-semibold mb-2">
                      The key works, but nothing in this list looks like a chat model. Pick one below
                      and pin it in .env.
                    </p>
                  )}
                  {r.hasVision === false && p.id !== 'grok' && (
                    <p className="text-[12.5px] text-due font-semibold mb-2">
                      Nothing in this list reads images, so OCR will fall through to the other
                      reader. Pin one below with <code>VITE_GEMINI_VISION_MODEL</code>.
                    </p>
                  )}
                  {p.id === 'grok' && AI.grok.service === 'groq' && (
                    <p className="text-[12px] text-ink-3 mb-2">
                      Groq is specialized for ultra-fast text inference (~500 tps). Paper register OCR is automatically routed to Gemini Vision.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {(r.models || []).slice(0, 14).map(m => (
                      <span key={m} className="sink text-[11px] px-2 py-1 rounded-lg text-ink-2 num">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {r?.state === 'fail' && (
                <div className="mt-3 rounded-xl bg-late-soft border border-late/25 p-3.5">
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-late">
                    <Icon name="alert" size={15} /> {r.title}
                  </div>
                  <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed whitespace-pre-line">{r.fix}</p>
                </div>
              )}

              {r?.state === 'missing' && (
                <div className="mt-3 rounded-xl bg-due-soft border border-due/25 p-3.5">
                  <p className="text-[13px] text-ink-2 leading-relaxed">
                    Add <code>{p.envKey}=…</code> to <code>.env</code> in the project root, then
                    restart the dev server.
                  </p>
                </div>
              )}
            </Card>
          )
        })}

        <Section title="If a key is refused">
          <List>
            {[
              ['Restart the dev server', 'Vite reads .env only at startup. A key added while it was running is not in the page. This is the usual cause.'],
              ['Check where the file is', '.env must sit next to package.json, not in src/. Not .env.txt.'],
              ['Check the line', 'VITE_GROK_API_KEY=… — no quotes, no spaces around the =, nothing after it.'],
              ['Check which service it is', `An xAI key begins xai- (console.x.ai); a Groq key begins gsk_ (console.groq.com). Different companies — each refuses the other's key. This build read yours as ${AI.grok.service || 'none'} and calls ${AI.grok.base}.`],
            ].map(([t, d], i) => (
              <Row key={t} icon={<span className="text-brand font-bold text-[13px] num">{i + 1}</span>}
                title={t} sub={d} />
            ))}
          </List>
        </Section>

        <Notice tone="info" title="Nothing here stops the app working">
          With no keys at all, chat still answers from her record and scanning walks a worked sample.
          The models are an enhancement, never a dependency.
        </Notice>
      </main>
    </>
  )
}
