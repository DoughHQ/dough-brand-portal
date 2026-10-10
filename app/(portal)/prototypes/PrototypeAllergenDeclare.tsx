'use client'

import { useState } from 'react'
import {
  ALLERGEN_CODES,
  ALLERGEN_LABELS,
  allergenSummary,
  type AllergenCode,
} from '@/lib/prototypes/allergens'

type Props = {
  contains: string[]
  mayContain: string[]
  declared: boolean
  disabled?: boolean
  onChange: (next: { contains: string[]; mayContain: string[]; declared: boolean }) => void
}

function ChipGroup({
  title,
  selected,
  other,
  onToggle,
  disabled,
}: {
  title: string
  selected: Set<string>
  other: Set<string>
  onToggle: (code: AllergenCode) => void
  disabled?: boolean
}) {
  return (
    <div className="proto-allergen-group">
      <div className="proto-field-label">{title}</div>
      <div className="proto-chips">
        {ALLERGEN_CODES.map((code) => {
          const on = selected.has(code)
          const blocked = other.has(code)
          return (
            <button
              key={code}
              type="button"
              className={`proto-chip${on ? ' proto-chip-on' : ''}`}
              disabled={disabled || blocked}
              aria-pressed={on}
              onClick={() => onToggle(code)}
            >
              {ALLERGEN_LABELS[code]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function PrototypeAllergenDeclare({
  contains,
  mayContain,
  declared,
  disabled,
  onChange,
}: Props) {
  const [editing, setEditing] = useState(!declared)
  const containsSet = new Set(contains)
  const maySet = new Set(mayContain)

  function toggle(code: AllergenCode, list: 'contains' | 'may') {
    const nextContains = new Set(contains)
    const nextMay = new Set(mayContain)
    if (list === 'contains') {
      if (nextContains.has(code)) nextContains.delete(code)
      else {
        nextContains.add(code)
        nextMay.delete(code)
      }
    } else {
      if (nextMay.has(code)) nextMay.delete(code)
      else {
        nextMay.add(code)
        nextContains.delete(code)
      }
    }
    onChange({
      contains: [...nextContains],
      mayContain: [...nextMay],
      declared: false,
    })
  }

  if (declared && !editing) {
    return (
      <div className="proto-allergen-confirmed">
        <div>
          <div className="proto-allergen-confirmed-label">Allergens declared</div>
          <div className="proto-allergen-confirmed-summary">
            {allergenSummary(contains, mayContain)}
          </div>
        </div>
        {!disabled ? (
          <button
            type="button"
            className="proto-quiet-btn"
            onClick={() => {
              setEditing(true)
              onChange({ contains, mayContain, declared: false })
            }}
          >
            Edit
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="proto-allergen-editor">
      <p className="proto-help-tight">
        Declare from the formula or label. Empty means none. Wheat also covers gluten.
      </p>
      <ChipGroup
        title="Contains"
        selected={containsSet}
        other={maySet}
        disabled={disabled}
        onToggle={(code) => toggle(code, 'contains')}
      />
      <ChipGroup
        title="May contain"
        selected={maySet}
        other={containsSet}
        disabled={disabled}
        onToggle={(code) => toggle(code, 'may')}
      />
      <div className="proto-allergen-actions">
        <button
          type="button"
          className="proto-primary-btn"
          disabled={disabled}
          onClick={() => {
            setEditing(false)
            onChange({ contains, mayContain, declared: true })
          }}
        >
          Confirm allergens
        </button>
        {declared ? (
          <button type="button" className="proto-quiet-btn" disabled={disabled} onClick={() => setEditing(false)}>
            Hide
          </button>
        ) : null}
      </div>
    </div>
  )
}
