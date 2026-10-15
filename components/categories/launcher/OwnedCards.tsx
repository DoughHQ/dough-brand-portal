import Link from 'next/link'
import { type CategoryLauncherRow } from '@/lib/categoryLauncher'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'
import { PRODUCT_NAME } from '@/lib/brand'
import { MetricCells, StatusChip } from './launcherParts'

export function OwnedEmpty() {
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--mist)',
        borderRadius: 13,
        padding: '32px 28px 28px',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 24,
          fontWeight: 400,
          color: 'var(--heading)',
          margin: '0 0 10px',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
        }}
      >
        You haven’t unlocked any category dashboards yet
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--ink-50)',
          lineHeight: 1.55,
          margin: 0,
          maxWidth: 520,
        }}
      >
        {`Below are the categories where your products already compete on ${PRODUCT_NAME}. Unlock a dashboard
        when you’re ready for the full Overview — standings stay honest until then.`}
      </p>
    </div>
  )
}

export function OwnedCard({ row }: { row: CategoryLauncherRow }) {
  const href = brandCategoryOverviewHref(row.l2_id)
  return (
    <div className="cat-feature">
      <div className="cat-feature-art">
        {row.banner_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.banner_image_url} alt="" />
        ) : (
          <div className="cat-feature-art-fallback" aria-hidden>
            {(row.icon_name || row.l2_name).slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="cat-feature-body">
        <div className="cat-feature-top">
          <div>
            {row.l1_name ? <div className="cat-kicker">{row.l1_name}</div> : null}
            <h3 className="cat-feature-name">{row.l2_name}</h3>
          </div>
          <StatusChip status="live" />
        </div>
        <MetricCells row={row} size="lg" />
        <div className="cat-feature-actions">
          <Link href={href} className="portal-btn portal-btn-cta cat-primary-cta">
            Open overview →
          </Link>
        </div>
      </div>
    </div>
  )
}
