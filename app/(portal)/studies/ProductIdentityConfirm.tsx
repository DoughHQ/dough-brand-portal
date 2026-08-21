'use client'

type Props = {
  name: string
  brand: string
  category: string | null
  upc: string
  help: string
  onConfirm: () => void
  onChange: () => void
}

export default function ProductIdentityConfirm({
  name,
  brand,
  category,
  upc,
  help,
  onConfirm,
  onChange,
}: Props) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.45 }}>
        {brand}
        {category ? ` · ${category}` : ''}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--ink-80)',
          marginTop: 4,
          letterSpacing: '0.02em',
        }}
      >
        UPC {upc}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--ink-50)' }}>
        {help}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <button
          type="button"
          className="cb-btn cb-btn-secondary"
          onClick={onConfirm}
          aria-label={`Confirm ${name}`}
        >
          Confirm
        </button>
        <button type="button" className="cb-quiet-action" onClick={onChange}>
          Not this one
        </button>
      </div>
    </div>
  )
}
