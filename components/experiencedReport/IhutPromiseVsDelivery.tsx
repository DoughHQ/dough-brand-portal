'use client'

import type { IhutCoreReport } from '@/lib/experiencedReport/ihutCoreTypes'

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v)
  return null
}

/** Promise vs delivery map — pack strength against taste strength. */
export function IhutPromiseVsDelivery({ report }: { report: IhutCoreReport }) {
  const map = report.promise_vs_delivery.map
  return (
    <section className="report-section" style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontFamily: 'var(--font-serif, Georgia, serif)',
          fontSize: 22,
          margin: '0 0 6px',
          color: 'var(--ink-90)',
        }}
      >
        Promise vs delivery
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--ink-55)',
          margin: '0 0 16px',
          maxWidth: 560,
          lineHeight: 1.45,
        }}
      >
        {report.promise_vs_delivery.note}
        {report.taste_only ? ' This box ran taste-only.' : null}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 520 }}>
        {map.map((row) => {
          const shelf = num(row.shelf_strength)
          const taste = num(row.taste_strength)
          return (
            <div
              key={row.ref}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 12,
                alignItems: 'center',
                padding: '10px 12px',
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-md, 8px)',
                background: row.is_yours ? 'var(--sage-soft, #eef6f1)' : 'var(--white)',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink-85)',
                  }}
                >
                  {row.name}
                  {row.is_yours ? ' · Yours' : ''}
                </div>
              </div>
              <Metric label="Shelf" value={shelf} />
              <Metric label="Taste" value={taste} />
            </div>
          )
        })}
      </div>
      {report.liking.length > 0 ? (
        <div style={{ marginTop: 18 }}>
          <h3
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ink-50)',
              margin: '0 0 8px',
            }}
          >
            Liking
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {report.liking.map((row) => (
              <li
                key={`like-${row.ref}`}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  color: 'var(--ink-70)',
                  marginBottom: 4,
                }}
              >
                {row.name}:{' '}
                {row.top_two_share != null
                  ? `${Math.round(row.top_two_share * 100)}% top-two`
                  : '—'}{' '}
                <span style={{ color: 'var(--ink-40)' }}>(n={row.n})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div style={{ textAlign: 'right', minWidth: 64 }}>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-40)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink-80)',
        }}
      >
        {value == null ? '—' : value.toFixed(2)}
      </div>
    </div>
  )
}
