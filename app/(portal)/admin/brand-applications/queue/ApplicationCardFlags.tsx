import type { BrandApplication } from '@/lib/brandApplications'
import { formatProductsShort } from './applicationCardFormat'
import { DecisionBadge } from './DecisionBadge'

export function ApplicationCardFlags({
  row,
  netNew,
}: {
  row: BrandApplication
  netNew: boolean
}) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {netNew ? <DecisionBadge tone="sage">Net-new brand</DecisionBadge> : null}
        {row.already_claimed ? (
          <DecisionBadge tone="amber">Already claimed</DecisionBadge>
        ) : null}
        {row.flagged_not_mine_count > 0 ? (
          <DecisionBadge tone="amber">
            Flagged {row.flagged_not_mine_count} product
            {row.flagged_not_mine_count === 1 ? '' : 's'} as not theirs
          </DecisionBadge>
        ) : null}
        {netNew
          ? row.catalog_candidates.map((c) => (
              <DecisionBadge key={c.brand_id} tone="ink">
                Possible catalog match: {c.brand_name} ({formatProductsShort(c.product_count)})
              </DecisionBadge>
            ))
          : null}
      </div>

      {row.already_claimed ? (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'var(--amber-pale, rgba(192,120,24,0.12))',
            border: '1px solid rgba(192,120,24,0.25)',
            fontSize: 13,
            color: 'var(--amber, #a66a14)',
            lineHeight: 1.5,
          }}
        >
          A colleague already has portal access for this brand. Treat this as a
          second-employee request, not a first claim.
        </div>
      ) : null}

      {netNew ? (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'var(--sage-soft)',
            border: '1px solid rgba(62,107,74,0.18)',
            fontSize: 13,
            color: 'var(--heading)',
            lineHeight: 1.5,
          }}
        >
          They didn’t match an existing brand. Confirm the name on the call before
          minting anything.
        </div>
      ) : null}
    </>
  )
}
