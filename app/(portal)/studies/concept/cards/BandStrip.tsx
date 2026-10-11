export function BandStrip({ bands }: { bands: string[] }) {
  if (bands.length === 0) {
    return (
      <div
        style={{
          marginTop: 14,
          padding: '16px 12px',
          borderRadius: 'var(--r-sm)',
          background: 'var(--surface-1)',
          color: 'var(--ink-30)',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        Enter a price to preview answer bands
      </div>
    )
  }
  return (
    <div
      style={{
        marginTop: 14,
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 2,
      }}
    >
      {bands.map((b) => (
        <div
          key={b}
          style={{
            flex: '1 1 0',
            minWidth: 72,
            padding: '10px 8px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--ink-10)',
            background: 'var(--surface-1)',
            fontSize: 12,
            fontWeight: 500,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {b}
        </div>
      ))}
    </div>
  )
}
