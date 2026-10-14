import Link from 'next/link'

export function ApplicationQueueHeader({
  pendingCount,
  total,
  refreshing,
  refresh,
}: {
  pendingCount: number
  total: number
  refreshing: boolean
  refresh: () => void
}) {
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
        Brand applications
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, maxWidth: 640, margin: 0 }}>
        Requests to join Runoff. Pending first. <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Approve &amp; invite</strong>{' '}
        creates the brand if it&apos;s new and emails a 7-day invite.{' '}
        <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Reject</strong> sends a short reply
        unless you untick it.
      </p>
      <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/admin/ownership-corrections"
          style={{ fontSize: 12, color: 'var(--sage)', textDecoration: 'none', fontWeight: 500 }}
        >
          ← Ownership corrections
        </Link>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          style={{
            fontSize: 12,
            color: 'var(--ink-50)',
            background: 'none',
            border: 'none',
            cursor: refreshing ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
        {total > 0 ? (
          <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>
            {pendingCount} pending · {total} total
          </span>
        ) : null}
      </div>
    </div>
  )
}
