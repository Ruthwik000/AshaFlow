import Icon from './Icon'

const COPY = {
  en: { listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking…',
        tap: 'Tap to talk', end: 'End', hint: 'Just speak. Say "stop" when you are done.' },
  hi: { listening: 'सुन रहा हूँ…', thinking: 'सोच रहा हूँ…', speaking: 'बोल रहा हूँ…',
        tap: 'बोलने के लिए दबाएँ', end: 'बंद करें', hint: 'बस बोलिए। पूरा होने पर "बंद करो" कहें।' },
  te: { listening: 'వింటున్నాను…', thinking: 'ఆలోచిస్తున్నాను…', speaking: 'చెబుతున్నాను…',
        tap: 'మాట్లాడటానికి నొక్కండి', end: 'ఆపు', hint: 'మాట్లాడండి. అయిపోయాక "ఆపు" అనండి.' },
}

/** The voice state, shown so she can tell whose turn it is. */
export default function VoiceBar({ state, partial, lang = 'en', onStop }) {
  const t = COPY[lang] || COPY.en
  if (state === 'idle') return null

  const label = state === 'listening' ? t.listening : state === 'thinking' ? t.thinking : t.speaking
  const tone = state === 'listening' ? 'text-brand' : state === 'speaking' ? 'text-info' : 'text-ink-2'

  return (
    <div className="pb-3 anim-up">
      <div className="raise rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          {state === 'listening' && (
            <span className="flex items-end gap-[3px] h-5 shrink-0">
              {[0, 1, 2, 3, 4].map(i => (
                <span key={i} className="w-[3px] rounded-full bg-brand animate-pulse"
                  style={{ height: [9, 17, 12, 19, 10][i], animationDelay: `${i * 110}ms`,
                           animationDuration: '.9s' }} />
              ))}
            </span>
          )}
          {state === 'thinking' && (
            <span className="flex gap-1 shrink-0">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce"
                  style={{ animationDelay: `${i * 140}ms`, animationDuration: '1s' }} />
              ))}
            </span>
          )}
          {state === 'speaking' && (
            <span className="text-info shrink-0"><Icon name="assist" size={19} /></span>
          )}

          <div className="min-w-0 flex-1">
            <div className={`text-[13px] font-bold ${tone}`}>{label}</div>
            <div className="text-[13.5px] text-ink truncate">
              {partial || <span className="text-ink-3">{t.hint}</span>}
            </div>
          </div>

          <button onClick={onStop}
            className="press btn-danger shrink-0 h-9 px-3.5 rounded-xl text-[12.5px] font-bold text-white">
            {t.end}
          </button>
        </div>
      </div>
    </div>
  )
}
