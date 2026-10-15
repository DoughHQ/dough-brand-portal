export function ImpersonateHeader() {
  return (
    <header style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
          marginBottom: 8,
        }}
      >
        Platform ops
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 32,
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 10px',
          letterSpacing: '-0.02em',
        }}
      >
        Impersonate a brand
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: 0, lineHeight: 1.55, maxWidth: 520 }}>
        Search any brand and open their portal Home. Uses the same session claim path as Products —
        the “VIEWING AS” banner will show until you exit.
      </p>
    </header>
  )
}
