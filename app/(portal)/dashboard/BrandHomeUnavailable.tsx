import Link from 'next/link'

export type BrandHomeUnavailableProps = {
  reason: 'rpc_failed' | 'parse_failed' | 'no_effective_brand' | 'unknown'
  detail?: string | null
}

/** Honest failure UI — never masquerade as a login bounce. */
export default function BrandHomeUnavailable({ reason, detail }: BrandHomeUnavailableProps) {
  const title =
    reason === 'no_effective_brand'
      ? 'No brand session'
      : 'Brand Home is temporarily unavailable'

  const body =
    reason === 'no_effective_brand'
      ? 'Sign in with a brand account, or ask an admin to impersonate a brand.'
      : 'We could not load your brand command center. This is a data error, not a login problem.'

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '80px auto',
        padding: '0 24px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28,
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 12px',
        }}
      >
        {title}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.5, margin: '0 0 20px' }}>
        {body}
      </p>
      {detail ? (
        <pre
          style={{
            fontSize: 11,
            color: 'var(--ink-30)',
            background: 'var(--surface-1)',
            padding: 12,
            borderRadius: 8,
            overflow: 'auto',
            marginBottom: 20,
          }}
        >
          {detail}
        </pre>
      ) : null}
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--sage)', fontWeight: 500 }}>
          Retry
        </Link>
        <Link href="/products" style={{ fontSize: 13, color: 'var(--ink-50)' }}>
          Open products
        </Link>
      </div>
    </div>
  )
}
