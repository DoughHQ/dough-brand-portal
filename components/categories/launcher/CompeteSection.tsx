import Link from 'next/link'
import type { CategoryLauncherRow } from '@/lib/categoryLauncher'
import { CompeteCard } from './CompeteCard'
import { SectionHead } from './launcherParts'

export function CompeteSection({ hasProducts }: { hasProducts: CategoryLauncherRow[] }) {
  return (
    <section className="cat-section">
      <SectionHead
        title="Where you compete"
        sub="These categories are building signal. Dashboards will unlock as battles accumulate."
      />
      {hasProducts.length === 0 ? (
        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--mist)',
            borderRadius: 13,
            padding: '28px 24px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              fontWeight: 400,
              margin: '0 0 8px',
              color: 'var(--heading)',
            }}
          >
            No competing categories yet
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, margin: '0 0 16px' }}>
            Categories appear once your products are in the catalog.
          </p>
          <Link href="/products" style={{ fontSize: 13, fontWeight: 500, color: 'var(--sage)', textDecoration: 'none' }}>
            Go to Products →
          </Link>
        </div>
      ) : (
        <div className="cat-tile-grid">
          {hasProducts.map((row) => (
            <CompeteCard key={row.l2_id} row={row} />
          ))}
        </div>
      )}
    </section>
  )
}
