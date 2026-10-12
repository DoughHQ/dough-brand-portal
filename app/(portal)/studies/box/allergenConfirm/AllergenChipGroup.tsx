import type { CSSProperties } from 'react'
import {
  ALLERGEN_CODES,
  ALLERGEN_LABELS,
  type AllergenCode,
} from '@/lib/box/allergens'

const chip: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.2,
  padding: '6px 10px',
  borderRadius: 'var(--cb-radius-pill)',
  border: '1px solid',
  cursor: 'pointer',
}

export default function AllergenChipGroup({
  title,
  selected,
  onToggle,
}: {
  title: string
  selected: Set<string>
  onToggle: (code: AllergenCode) => void
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-50)', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ALLERGEN_CODES.map((code) => {
          const on = selected.has(code)
          return (
            <button
              key={`${title}-${code}`}
              type="button"
              onClick={() => onToggle(code)}
              aria-pressed={on}
              style={{
                ...chip,
                background: on ? 'var(--sage-soft)' : 'var(--paper)',
                borderColor: on ? 'var(--sage)' : 'var(--ink-10)',
                color: on ? 'var(--ink-80)' : 'var(--ink-50)',
                fontWeight: on ? 600 : 500,
              }}
            >
              {ALLERGEN_LABELS[code]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
