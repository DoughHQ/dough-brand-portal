'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FIELDING_DAYS_MIN,
  fieldingDaysMessage,
  fieldingEndPreview,
} from '@/lib/studies/fieldingWindow'

const OPEN_LENGTH = 14

export default function FieldingLengthField({
  days,
  onChange,
}: {
  days: number | null
  onChange: (days: number | null) => void
}) {
  const limited = days != null
  const message = fieldingDaysMessage(days)
  const [text, setText] = useState(days == null ? String(OPEN_LENGTH) : String(days))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current && days != null) setText(String(days))
  }, [days])

  return (
    <div className="cb-end" id="field_expires_at">
      <div className="cb-end-choice" role="group" aria-label="Study length">
        <button
          type="button"
          className={days == null ? 'cb-end-option is-on' : 'cb-end-option'}
          aria-pressed={days == null}
          onClick={() => onChange(null)}
        >
          No end date
        </button>
        <button
          type="button"
          className={limited ? 'cb-end-option is-on' : 'cb-end-option'}
          aria-pressed={limited}
          onClick={() => {
            if (days == null) onChange(OPEN_LENGTH)
          }}
        >
          Runs for
        </button>
      </div>
      {limited ? (
        <label className="cb-end-days" htmlFor="field_expires_at_days">
          <input
            id="field_expires_at_days"
            type="number"
            min={FIELDING_DAYS_MIN}
            inputMode="numeric"
            className="cb-input"
            value={text}
            onFocus={() => {
              focused.current = true
            }}
            onBlur={() => {
              focused.current = false
              if (!/^\d+$/.test(text) || Number(text) <= 0) {
                const fallback = days != null && days > 0 ? days : OPEN_LENGTH
                setText(String(fallback))
                onChange(fallback)
              } else {
                setText(String(days))
              }
            }}
            onChange={(e) => {
              const raw = e.target.value.trim()
              setText(raw)
              if (/^\d+$/.test(raw) && Number(raw) > 0) onChange(Number(raw))
            }}
          />
          <span>days</span>
        </label>
      ) : null}
      <p className="cb-end-note">
        {days == null
          ? 'No end date. It runs until the responses are in, and it goes live when this is paid.'
          : (message ?? fieldingEndPreview(days))}
      </p>
    </div>
  )
}
