import type { BrandApplication } from '@/lib/brandApplications'
import { PRODUCT_NAME } from '@/lib/brand'
import { formatWhen } from './applicationCardFormat'
import { MetaLine } from './MetaLine'

export function ApplicationCardMeta({
  row,
  brandLabel,
  productCount,
  linkedInHref,
  websiteHref,
}: {
  row: BrandApplication
  brandLabel: string
  productCount: string
  linkedInHref: string | null
  websiteHref: string | null
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: '8px 24px',
        marginBottom: 16,
      }}
    >
      <MetaLine label="Brand">
        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{brandLabel}</span>
        {row.selected_brand_id != null ? (
          <span style={{ color: 'var(--ink-30)' }}> · #{row.selected_brand_id}</span>
        ) : null}
        {row.selected_brand_name &&
        row.brand_name_typed &&
        row.selected_brand_name !== row.brand_name_typed ? (
          <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
            Typed as “{row.brand_name_typed}”
          </div>
        ) : null}
      </MetaLine>
      <MetaLine label={`Products on ${PRODUCT_NAME}`}>
        <span style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
          {productCount}
        </span>
      </MetaLine>
      <MetaLine label="LinkedIn">
        {linkedInHref ? (
          <a
            href={linkedInHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--sage)' }}
          >
            {row.linkedin_url}
          </a>
        ) : row.linkedin_url ? (
          <span style={{ color: 'var(--ink-50)' }}>{row.linkedin_url}</span>
        ) : (
          <span>—</span>
        )}
      </MetaLine>
      <MetaLine label="Website">
        {websiteHref ? (
          <a
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--sage)' }}
          >
            {row.brand_website}
          </a>
        ) : row.brand_website ? (
          <span style={{ color: 'var(--ink-50)' }}>{row.brand_website}</span>
        ) : (
          <span>—</span>
        )}
      </MetaLine>
      <MetaLine label="Call booked">
        {row.booking_scheduled_at ? (
          <span style={{ color: 'var(--ink)' }}>{formatWhen(row.booking_scheduled_at)}</span>
        ) : (
          <span>Not booked</span>
        )}
      </MetaLine>
    </div>
  )
}
