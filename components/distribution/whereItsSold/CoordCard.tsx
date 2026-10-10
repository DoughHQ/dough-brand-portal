import {
  actionsForState,
  claimLabel,
  claimLabelLong,
  confirmLabel,
  formatCalendarDate,
  shortVariantLabel,
} from '@/lib/distribution/actions'
import { coordFromRow, serializeCoord } from '@/lib/distribution/coords'
import {
  hasSiblingDoughSeed,
  packConflict,
  reportsForCoord,
  type AvailabilityReport,
  type DistributionRow,
} from '@/lib/distribution/grouping'
import EvidenceStack from './EvidenceStack'
import type { CardHandlers } from './types'

type CoordCardProps = CardHandlers & {
  row: DistributionRow
  allRows: DistributionRow[]
  reports: AvailabilityReport[]
  productTitle?: string | null
  canEdit: boolean
  busy: string | null
  focused: boolean
  compact?: boolean
}

export default function CoordCard({
  row,
  allRows,
  reports,
  productTitle,
  canEdit,
  busy,
  focused,
  compact,
  onConfirm,
  onCorrect,
  onDispute,
  onClaim,
  onRedeclare,
  onWithdraw,
  onDelist,
}: CoordCardProps) {
  const coord = coordFromRow(row)
  const key = serializeCoord(coord)
  const pending = reportsForCoord(reports, row)
  const actions = actionsForState(row.brand_status, row.awaiting_review)
  const conflicts = packConflict(pending)
  const contradicts = pending.some((report) => report.contradicts_delisting)
  const weak =
    row.awaiting_review > 0 &&
    row.shopper_reports <= 1 &&
    (row.dough_seeded || hasSiblingDoughSeed(allRows, row))
  const variantShort = shortVariantLabel(row.variant_label, productTitle)
  const isDefaultAllPacks =
    variantShort === 'All pack sizes' && row.sku_variant_id == null
  const showVariant = !isDefaultAllPacks

  return (
    <div
      id={`coord-${key}`}
      className={`wis-coord${focused ? ' wis-coord--flash' : ''}${compact ? ' wis-coord--compact' : ''}`}
    >
      <div className="wis-coord-top">
        <span className="wis-banner-inline">
          {row.retailer_name}
          {row.parent_name ? (
            <span className="wis-group-parent"> · {row.parent_name}</span>
          ) : null}
        </span>
        <span className="wis-chip wis-chip--scope">{row.scope_label}</span>
        {showVariant ? (
          <span className="wis-variant" title={row.variant_label}>
            {variantShort}
          </span>
        ) : null}
      </div>

      <EvidenceStack
        row={row}
        reportDates={pending.map((report) => report.report_date)}
        weakCorroboration={weak}
      />

      {row.covered_by_national ? (
        <p className="wis-warn">
          Covered by a nationwide claim at this banner
          {variantShort ? ` for ${variantShort}` : ''}.
        </p>
      ) : null}

      {contradicts && row.brand_delisted_on ? (
        <p className="wis-warn">
          You marked this delisted on{' '}
          {formatCalendarDate(row.brand_delisted_on)}. Confirming will list it
          as carried again.
        </p>
      ) : contradicts ? (
        <p className="wis-warn">
          Confirming will list it as carried again (contradicts your delisting).
        </p>
      ) : null}

      {conflicts ? (
        <p className="wis-warn">
          Pending sightings name different pack sizes. Correct or Dispute each
          path — Confirm is blocked until they agree.
        </p>
      ) : null}

      {canEdit ? (
        <div className="wis-actions">
          {actions.includes('confirm') ? (
            <button
              type="button"
              className="wis-btn wis-btn--primary"
              disabled={busy != null || conflicts}
              title={confirmLabel(contradicts, row.brand_delisted_on)}
              onClick={() => onConfirm(row, pending)}
            >
              Confirm
            </button>
          ) : null}
          {actions.includes('correct') ? (
            <button
              type="button"
              className="wis-btn"
              disabled={busy != null}
              onClick={() => onCorrect(row)}
            >
              Correct
            </button>
          ) : null}
          {actions.includes('dispute') ? (
            <button
              type="button"
              className="wis-btn"
              disabled={busy != null}
              onClick={() => onDispute(row)}
            >
              Dispute
            </button>
          ) : null}
          {actions.includes('claim') ? (
            <button
              type="button"
              className="wis-btn"
              disabled={busy != null}
              title={claimLabelLong()}
              onClick={() => onClaim(row)}
            >
              {claimLabel()}
            </button>
          ) : null}
          {actions.includes('redeclare') ? (
            <button
              type="button"
              className="wis-btn"
              disabled={busy != null}
              onClick={() => onRedeclare(row)}
            >
              Re-declare
            </button>
          ) : null}
          {actions.includes('withdraw') && row.declaration_id != null ? (
            <button
              type="button"
              className="wis-btn wis-btn--quiet"
              disabled={busy != null}
              onClick={() => onWithdraw(row)}
            >
              Withdraw
            </button>
          ) : null}
          {actions.includes('delist') && row.declaration_id != null ? (
            <button
              type="button"
              className="wis-btn wis-btn--danger"
              disabled={busy != null}
              onClick={() => onDelist(row)}
            >
              Mark delisted
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
