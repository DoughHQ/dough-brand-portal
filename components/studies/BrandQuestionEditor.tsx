'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import {
  BRAND_QUESTION_STARTERS,
  brandQuestionAnswerSource,
  brandQuestionKind,
  withBrandQuestionAnswerSource,
  withBrandQuestionKind,
  withBrandQuestionOptions,
  type BrandQuestionDraft,
  type FieldAnswerSeat,
} from '@/lib/concept/singleTest'
import { resolveStimuliPreviewUrl } from '@/lib/concept/stimuliStorage'
import { createClient } from '@/lib/supabase'
import { DragHandle } from '@/app/(portal)/studies/concept/fieldIcons'
import { inputBase, labelSm } from '@/app/(portal)/studies/concept/conceptStyles'

type Props = {
  question: BrandQuestionDraft
  fieldSeats: FieldAnswerSeat[]
  fieldOptions: string[]
  onChange: (q: BrandQuestionDraft) => void
  onRemove: () => void
  /** Suggested prompt chips. Defaults to concept packaging starters. */
  starters?: readonly string[]
  promptPlaceholder?: string
  fieldEmptyMessage?: string
  lede?: string
}

/**
 * Shared 0–2 brand-question editor for concept and IHUT builders.
 * Pick one / pick several, write-your-own or choose-from-field.
 */
export default function BrandQuestionEditor({
  question,
  fieldSeats,
  fieldOptions,
  onChange,
  onRemove,
  starters = BRAND_QUESTION_STARTERS,
  promptPlaceholder = 'Ask something shoppers can answer about the designs',
  fieldEmptyMessage = 'Add designs and competitors in Field first.',
  lede = 'Add a question specific to your study.',
}: Props) {
  const several = brandQuestionKind(question) === 'pick_several'
  const fromField = brandQuestionAnswerSource(question) === 'field'
  const filled = question.options.map((o) => o.trim()).filter(Boolean)
  const duplicate =
    !fromField &&
    filled.length >= 2 &&
    new Set(filled.map((o) => o.toLowerCase())).size < filled.length
  const promptLen = question.prompt.trim().length
  const promptHint =
    promptLen > 0 && promptLen < 8
      ? 'Use at least 8 characters.'
      : promptLen > 140
        ? 'Keep it under 140 characters.'
        : null
  const [dragFrom, setDragFrom] = useState<number | null>(null)

  function setOptions(options: string[]) {
    onChange(withBrandQuestionOptions(question, options))
  }

  function reorderOption(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return
    const next = [...question.options]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item!)
    setOptions(next)
  }

  function setAnswerSource(source: 'custom' | 'field') {
    onChange(withBrandQuestionAnswerSource(question, source, fieldOptions))
  }

  return (
    <div className="cb-bq">
      <p className="cb-bq-lede">{lede}</p>

      <div className="cb-bq-block">
        <label style={labelSm} htmlFor={`bq-prompt-${question.localId}`}>
          Question
        </label>
        <input
          id={`bq-prompt-${question.localId}`}
          className="cb-input"
          value={question.prompt}
          placeholder={promptPlaceholder}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          style={{ ...inputBase, marginTop: 8 } as CSSProperties}
        />
        {starters.length > 0 ? (
          <div className="cb-bq-starters" aria-label="Suggested prompts">
            <span className="cb-bq-starters-label">Suggested prompts</span>
            {starters.map((starter) => {
              const active = question.prompt.trim() === starter
              return (
                <button
                  key={starter}
                  type="button"
                  className={`cb-bq-starter${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => onChange({ ...question, prompt: starter })}
                >
                  {starter}
                </button>
              )
            })}
          </div>
        ) : null}
        {promptHint ? (
          <p role="alert" className="cb-bq-hint is-error">
            {promptHint}
          </p>
        ) : null}
      </div>

      <div className="cb-bq-block">
        <div style={{ ...labelSm, marginBottom: 8 }}>Answer options</div>
        <div
          className="cb-bq-source"
          role="group"
          aria-label="Where answer options come from"
        >
          <button
            type="button"
            className={!fromField ? 'cb-bq-source-btn is-on' : 'cb-bq-source-btn'}
            aria-pressed={!fromField}
            onClick={() => setAnswerSource('custom')}
          >
            Write your own
          </button>
          <button
            type="button"
            className={fromField ? 'cb-bq-source-btn is-on' : 'cb-bq-source-btn'}
            aria-pressed={fromField}
            onClick={() => setAnswerSource('field')}
          >
            Choose from field
          </button>
        </div>

        {fromField ? (
          fieldSeats.length === 0 ? (
            <p className="cb-bq-field-empty" role="status">
              {fieldEmptyMessage}
            </p>
          ) : (
            <>
              <ul className="cb-bq-field-options" aria-label="Field as answers">
                {fieldSeats.map((seat) => (
                  <li key={seat.label} className="cb-bq-field-option">
                    <FieldOptionPhoto imageRef={seat.imageRef} src={seat.imageSrc} />
                    <span
                      className={`cb-bq-option-mark${several ? ' is-multi' : ''}`}
                      aria-hidden="true"
                    />
                    <span className="cb-bq-field-option-label">{seat.label}</span>
                  </li>
                ))}
              </ul>
              {fieldSeats.length < 2 ? (
                <p role="alert" className="cb-bq-hint is-error">
                  Need at least two items in the field.
                </p>
              ) : (
                <p className="cb-bq-hint">
                  Updates automatically when you change the field.
                </p>
              )}
            </>
          )
        ) : (
          <>
            <div className="cb-bq-options">
              {question.options.map((opt, i) => (
                <div
                  className="cb-bq-option"
                  key={i}
                  draggable={question.options.length > 1}
                  onDragStart={() => setDragFrom(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragFrom != null) reorderOption(dragFrom, i)
                    setDragFrom(null)
                  }}
                  onDragEnd={() => setDragFrom(null)}
                >
                  <span className="cb-bq-option-handle" aria-hidden="true">
                    <DragHandle />
                  </span>
                  <span
                    className={`cb-bq-option-mark${several ? ' is-multi' : ''}`}
                    aria-hidden="true"
                  />
                  <input
                    className="cb-input"
                    value={opt}
                    placeholder={`Answer ${i + 1}`}
                    aria-label={`Answer ${i + 1}`}
                    onChange={(e) => {
                      const options = [...question.options]
                      options[i] = e.target.value
                      setOptions(options)
                    }}
                    style={inputBase}
                  />
                  {question.options.length > 2 ? (
                    <button
                      type="button"
                      className="cb-quiet-action"
                      aria-label={`Remove answer ${i + 1}`}
                      onClick={() => setOptions(question.options.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {duplicate ? (
              <p role="alert" className="cb-bq-hint is-error">
                Each answer needs to be different.
              </p>
            ) : null}
            {question.options.length < 8 ? (
              <button
                type="button"
                className="cb-bq-add-option"
                onClick={() => setOptions([...question.options, ''])}
              >
                + Add option
              </button>
            ) : null}
          </>
        )}
      </div>

      <div className="cb-bq-footer">
        <div className="cb-bq-kind" role="group" aria-label="How shoppers answer">
          <button
            type="button"
            className={!several ? 'cb-bq-kind-btn is-on' : 'cb-bq-kind-btn'}
            aria-pressed={!several}
            onClick={() => onChange(withBrandQuestionKind(question, 'pick_one'))}
          >
            Single select
          </button>
          <button
            type="button"
            className={several ? 'cb-bq-kind-btn is-on' : 'cb-bq-kind-btn'}
            aria-pressed={several}
            onClick={() => onChange(withBrandQuestionKind(question, 'pick_several'))}
          >
            Multiple select
          </button>
        </div>
        <p className="cb-bq-screen" role="status">
          Respondents will see 1 screen.
        </p>
        <button type="button" className="cb-quiet-action cb-bq-remove" onClick={onRemove}>
          Remove question
        </button>
      </div>
    </div>
  )
}

function FieldOptionPhoto({
  imageRef,
  src,
}: {
  imageRef?: string | null
  src?: string | null
}) {
  const [url, setUrl] = useState<string | null>(src ?? null)
  useEffect(() => {
    if (src) {
      setUrl(src)
      return
    }
    if (!imageRef) {
      setUrl(null)
      return
    }
    let cancelled = false
    const supabase = createClient()
    void resolveStimuliPreviewUrl(supabase, imageRef).then((next) => {
      if (!cancelled) setUrl(next)
    })
    return () => {
      cancelled = true
    }
  }, [imageRef, src])
  return (
    <span className="cb-bq-field-photo">
      {url ? <img src={url} alt="" /> : null}
    </span>
  )
}
