type Props = {
  brand: string
  category: string | null
  upc: string
  help: string
}

export default function ProductIdentityDetails({ brand, category, upc, help }: Props) {
  return (
    <>
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
    </>
  )
}
