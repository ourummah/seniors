'use client'
import { useState } from 'react'
import { QUESTIONS } from '@/lib/questions.ts'
import { STATES, STATE_NAMES, type Answers } from '@/lib/types.ts'
import { saveAnswers } from '../actions.ts'

// One question per screen. All inputs stay in the form so the final submit sends everything.
export function QuestionForm({ initial }: { initial: Answers | null }) {
  const [step, setStep] = useState(0)
  const last = QUESTIONS.length - 1
  const chosen = new Set([...(initial?.cards ?? []), ...(initial?.tags ?? [])])

  return (
    <form action={saveAnswers} className="card">
      <div className="progress" aria-hidden="true"><span style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} /></div>
      <p className="help">Question {step + 1} of {QUESTIONS.length}</p>
      {QUESTIONS.map((q, i) => (
        <fieldset key={q.id} hidden={i !== step} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend><h2>{q.title}</h2></legend>
          {q.help && <p className="help">{q.help}</p>}
          {q.kind === 'state' &&
            STATES.map((s) => (
              <label className="choice" key={s}>
                <input type="radio" name="state" value={s} defaultChecked={initial?.state === s} />
                <span><strong>{STATE_NAMES[s]}</strong></span>
              </label>
            ))}
          {q.kind === 'number' && (
            <input type="number" name={q.field} min={q.min} max={q.max} defaultValue={initial?.age ?? ''} aria-label={q.title} />
          )}
          {q.kind === 'text' && (
            <input type="text" inputMode="numeric" name={q.field} pattern={q.pattern} maxLength={4} defaultValue={initial?.postcode ?? ''} aria-label={q.title} />
          )}
          {(q.kind === 'multi' || q.kind === 'single') &&
            q.options.map((o) => (
              <label className="choice" key={o.value}>
                <input type={q.kind === 'multi' ? 'checkbox' : 'radio'} name={q.kind === 'multi' ? q.field : `${q.field}__${q.id}`} value={o.value} defaultChecked={chosen.has(o.value)} />
                <span><strong>{o.label}</strong>{o.hint && <span className="help">{o.hint}</span>}</span>
              </label>
            ))}
        </fieldset>
      ))}
      <div className="row" style={{ marginTop: 18 }}>
        {step > 0 && <button type="button" className="btn btn-line" onClick={() => setStep(step - 1)}>Back</button>}
        {step < last && <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>Next</button>}
        {step === last && <button type="submit" className="btn btn-gold">Show my benefits</button>}
      </div>
    </form>
  )
}
