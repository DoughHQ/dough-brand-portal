export default function ShelfPriceInput({
  value,
  onChange,
}: {
  value: number | null
  onChange: (price: number | null) => void
}) {
  return (
    <label style={{ fontSize: 12, color: 'var(--ink-50)' }}>
      Shelf price{' '}
      <input
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        placeholder="e.g. 3.49"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value.trim()
          if (!raw) {
            onChange(null)
            return
          }
          const n = Number(raw)
          onChange(Number.isFinite(n) && n > 0 ? n : null)
        }}
        style={{
          marginLeft: 6,
          width: 96,
          fontSize: 13,
          padding: '4px 8px',
          border: '1px solid var(--ink-10)',
          borderRadius: 6,
        }}
      />
      <span style={{ display: 'block', marginTop: 4, color: 'var(--ink-40)' }}>
        Required on every packaged seat to enable tested-offer price checks.
      </span>
    </label>
  )
}
