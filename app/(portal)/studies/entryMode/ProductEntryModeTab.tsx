import type { ProductEntryMode } from '@/lib/productEntryMode'

type Props = {
  value: ProductEntryMode
  active: boolean
  onChange: (mode: ProductEntryMode) => void
}

export default function ProductEntryModeTab({ value, active, onChange }: Props) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onChange(value)}
      style={{
        border: 'none',
        background: active ? 'var(--ink-80)' : 'var(--paper)',
        color: active ? 'var(--on-fill)' : 'var(--ink-50)',
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
}
