import Link from 'next/link'

export function AdminBoxesHeader() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 24,
        marginBottom: 28,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            fontWeight: 400,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          Sampling boxes
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.45 }}>
          Open claim windows, track shipping, and close out box studies.
        </p>
      </div>
      <Link
        href="/studies/box/new"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--sage)',
          color: 'var(--on-fill)',
          border: 'none',
          borderRadius: 'var(--r-sm)',
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span aria-hidden style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>
          +
        </span>
        New box
      </Link>
    </header>
  )
}
