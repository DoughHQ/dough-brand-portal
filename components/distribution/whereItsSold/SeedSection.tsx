import {
  coordFromRow,
  serializeCoord,
  type DistributionCoord,
} from '@/lib/distribution/coords'
import type {
  AvailabilityReport,
  DistributionRow,
  DistributionSection,
} from '@/lib/distribution/grouping'
import CoordCard from './CoordCard'
import type { CardHandlers } from './types'
import { PRODUCT_NAME } from '@/lib/brand'

type SeedSectionProps = CardHandlers & {
  section: DistributionSection
  peek: { names: string[]; remaining: number }
  open: boolean
  onToggle: () => void
  claimable: DistributionRow[]
  canEdit: boolean
  busy: string | null
  allRows: DistributionRow[]
  reports: AvailabilityReport[]
  productTitle?: string | null
  focusCoord: DistributionCoord | null
  onClaimAll: () => void
}

export default function SeedSection({
  section,
  peek,
  open,
  onToggle,
  claimable,
  canEdit,
  busy,
  allRows,
  reports,
  productTitle,
  focusCoord,
  onClaimAll,
  ...handlers
}: SeedSectionProps) {
  const count = section.rows.length
  const peekText =
    peek.names.length === 0
      ? null
      : peek.remaining > 0
        ? `${peek.names.join(', ')} and ${peek.remaining} more`
        : peek.names.join(', ')

  return (
    <section
      className={`wis-bucket wis-bucket--dough_seeds${open ? ' is-open' : ''}`}
      aria-labelledby="wis-dough_seeds"
    >
      <div className="wis-seed-header">
        <button
          type="button"
          className="wis-seed-expand"
          id="wis-dough_seeds"
          aria-expanded={open}
          onClick={onToggle}
        >
          <span className="wis-seed-chevron" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d={
                  open
                    ? 'M4.5 7.5L9 12L13.5 7.5'
                    : 'M7.5 4.5L12 9L7.5 13.5'
                }
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="wis-seed-expand__copy">
            <span className="wis-bucket-title">
              {PRODUCT_NAME} found this at {count} more retailer
              {count === 1 ? '' : 's'}
            </span>
            {!open && peekText ? (
              <span className="wis-seed-peek">{peekText}</span>
            ) : null}
            <span className="wis-seed-expand__hint">
              {open ? 'Hide list' : 'Review each retailer'}
            </span>
          </span>
        </button>
        {canEdit && claimable.length > 0 ? (
          <button
            type="button"
            className="wis-btn wis-btn--quiet wis-claim-all"
            disabled={busy != null}
            onClick={onClaimAll}
          >
            Claim all ({claimable.length})
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="wis-bucket-body">
          {section.rows.map((row) => {
            const key = serializeCoord(coordFromRow(row))
            const focused =
              focusCoord != null && serializeCoord(focusCoord) === key
            return (
              <CoordCard
                key={key}
                row={row}
                allRows={allRows}
                reports={reports}
                productTitle={productTitle}
                canEdit={canEdit}
                busy={busy}
                focused={focused}
                compact
                {...handlers}
              />
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
