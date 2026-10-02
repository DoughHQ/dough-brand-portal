'use client'

import { useEffect, useRef, useState } from 'react'
import {
  fieldingDaysMessage,
  fieldingEndDateLabel,
} from '@/lib/studies/fieldingWindow'
import { inputBase, labelSm } from './conceptStyles'

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
      <div style={labelSm} id="field_length_label">
        How long it runs
      </div>
      <div className="cb-end-choice" role="group" aria-labelledby="field_length_label">
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
        <label className={`cb-end-days${message ? ' is-invalid' : ''}`} htmlFor="field_expires_at_days">
          <input
            id="field_expires_at_days"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            className="cb-input"
            aria-invalid={message ? true : undefined}
            aria-describedby="field_length_note"
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
                setText(String(Number(text)))
                onChange(Number(text))
              }
            }}
            onChange={(e) => {
              // Digits only — type freely, no spinner. Empty is fine while editing.
              const raw = e.target.value.replace(/\D/g, '')
              setText(raw)
              if (raw !== '' && Number(raw) > 0) onChange(Number(raw))
            }}
            style={{ ...inputBase, paddingRight: 72 }}
          />
          <span aria-hidden="true">days</span>
        </label>
      ) : null}
      <p
        id="field_length_note"
        className={`cb-end-note${message ? ' is-error' : ''}`}
        role={message ? 'alert' : undefined}
      >
        {days == null
          ? 'No end date. It runs until the responses are in, and it goes live when this is paid.'
          : message
            ? 'Enter at least 7 days.'
            : `Ends ${fieldingEndDateLabel(days)} if paid today.`}
      </p>
    </div>
  )
}
