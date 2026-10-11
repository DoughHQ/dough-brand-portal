'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { intFromInput } from './integer'
import { inputBase, labelSm, subHelp } from './styles'

export function InfoButton({
  title,
  body,
  ariaLabel,
}: {
  title: string
  body: string
  ariaLabel: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const titleId = `${ariaLabel.replace(/\W+/g, '-').toLowerCase()}-title`

  useEffect(() => {
    if (!open) return
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} style={{ position: 'relative', flexShrink: 0, alignSelf: 'center' }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid var(--ink-10)',
          background: open ? 'var(--sage-soft)' : 'var(--paper)',
          color: 'var(--ink-50)',
          cursor: 'pointer',
          fontFamily: 'var(--font-serif)',
          fontSize: 13,
          fontStyle: 'italic',
          fontWeight: 600,
          lineHeight: 1,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        i
      </button>
      {open ? (
        <div
          role="dialog"
          aria-labelledby={titleId}
          style={{
            position: 'absolute',
            zIndex: 20,
            right: 0,
            top: '100%',
            marginTop: 8,
            width: 320,
            maxWidth: 'min(320px, 70vw)',
            background: 'var(--paper)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--cb-shadow-popover)',
            padding: '12px 14px',
          }}
        >
          <div
            id={titleId}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink-80)',
              marginBottom: 6,
            }}
          >
            {title}
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--ink-80)',
            }}
          >
            {body}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function BarInput({
  label,
  hint,
  value,
  onChange,
  disabled,
  info,
}: {
  label: string
  hint: string
  value: number | null
  onChange: (value: number | null) => void
  disabled?: boolean
  info?: { title: string; body: string; ariaLabel: string }
}) {
  const inputId = useId()
  return (
    <div style={{ opacity: disabled ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <label htmlFor={inputId} style={{ ...labelSm, marginBottom: 0 }}>
          {label}
        </label>
        {info ? <InfoButton {...info} /> : null}
      </div>
      <input
        id={inputId}
        className="cb-input"
        inputMode="numeric"
        disabled={disabled}
        value={value ?? ''}
        onChange={(event) => onChange(intFromInput(event.target.value))}
        placeholder="—"
        style={{ ...inputBase, width: 110 }}
      />
      <p style={{ ...subHelp, marginTop: 4, maxWidth: 220 }}>{hint}</p>
    </div>
  )
}
