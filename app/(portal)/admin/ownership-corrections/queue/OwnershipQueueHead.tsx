import Link from 'next/link'

export function OwnershipQueueHead({ refresh }: { refresh: () => void }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--ink-30)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Ops
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28,
          fontWeight: 400,
          color: 'var(--ink)',
          marginBottom: 8,
        }}
      >
        Brand ownership corrections
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, maxWidth: 640, margin: 0 }}>
        Review brand-submitted parent corrections. Accepting updates the brand’s recorded parent;
        the displayed parent for brands does not change until you accept.
      </p>
      <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
        <Link
          href="/admin/corrections"
          style={{ fontSize: 12, color: 'var(--sage)', textDecoration: 'none', fontWeight: 500 }}
        >
          ← Product corrections
        </Link>
        <button
          type="button"
          onClick={() => void refresh()}
          style={{
            fontSize: 12,
            color: 'var(--ink-50)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
