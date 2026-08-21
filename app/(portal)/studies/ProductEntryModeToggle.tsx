'use client'

import type { ProductEntryMode } from '@/lib/productEntryMode'

type Props = {
  mode: ProductEntryMode
  onChange: (mode: ProductEntryMode) => void
}

export default function ProductEntryModeToggle({ mode, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Search by name or barcode"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-sm)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {(['name', 'barcode'] as const).map((value) => {
        const active = mode === value
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(value)}
            style={{
              border: 'none',
              background: active ? 'var(--ink-80)' : 'var(--white)',
              color: active ? 'var(--white)' : 'var(--ink-50)',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.02em',
              height: 32,
              padding: '0 12px',
              cursor: 'pointer',
            }}
          >
            {value === 'name' ? 'Name' : 'Barcode'}
          </button>
        )
      })}
    </div>
  )
}
