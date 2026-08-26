import Link from 'next/link'
import {
  catalogHealthRows,
  type CatalogHealth,
} from '@/lib/brandHome/catalogHealth'
import {
  BRAND_VERIFICATION_UNAVAILABLE_DETAIL,
  BRAND_VERIFICATION_UNAVAILABLE_TITLE,
  showBrandVerificationComingSoon,
} from '@/lib/brandHome/brandVerificationUi'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" fill="var(--sage-soft)" />
      <path
        d="M5 8.2 7 10.2 11.2 5.8"
        fill="none"
        stroke="var(--sage)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M8 2.4 14.2 13.2H1.8L8 2.4Z"
        fill="var(--amber-soft)"
        stroke="var(--amber)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M8 6.2v3.2" stroke="var(--amber)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.2" r="0.7" fill="var(--amber)" />
    </svg>
  )
}

export default function CatalogHealthCard({
  health,
  domainVerified,
}: {
  health: CatalogHealth
  domainVerified: boolean
}) {
  const rows = catalogHealthRows(health)
  const showVerifyNote = showBrandVerificationComingSoon(domainVerified)

  return (
    <section aria-labelledby="catalog-health-heading">
      <div className="bh-section-head">
        <h2 id="catalog-health-heading" className="bh-h">
          Catalog health
        </h2>
        <Link href="/products" className="bh-link">
          View products →
        </Link>
      </div>
      <div className="bh-panel bh-health">
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((row, i) => (
            <li key={row.key}>
              <Link
                href="/products"
                className="catalog-health-row"
                aria-label={`${row.label} ${row.have.toLocaleString()} of ${row.total.toLocaleString()} — view products`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minHeight: 42,
                  padding: '0 2px',
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid rgba(36, 61, 44, 0.08)',
                  opacity: row.complete ? 0.78 : 1,
                  textDecoration: 'none',
                  color: 'inherit',
                  borderRadius: 4,
                  transition: 'background 160ms var(--motion-ease)',
                }}
              >
                {row.complete ? <CheckIcon /> : <WarnIcon />}
                <span
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    color: row.complete ? 'var(--ink-50)' : 'var(--ink)',
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 72,
                    textAlign: 'right',
                    color: row.complete ? 'var(--ink-50)' : 'var(--ink)',
                  }}
                >
                  {row.have.toLocaleString()} / {row.total.toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {showVerifyNote ? (
          <div
            style={{
              margin: '10px 0 0',
              paddingTop: 12,
              borderTop: '1px solid rgba(36, 61, 44, 0.08)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--ink-50)',
                lineHeight: 1.5,
              }}
            >
              {BRAND_VERIFICATION_UNAVAILABLE_TITLE}
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--ink-30)',
                lineHeight: 1.45,
              }}
            >
              {BRAND_VERIFICATION_UNAVAILABLE_DETAIL}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
