import { seedPeekNames, type DistributionRow } from '@/lib/distribution/grouping'
import ModalFrame from './ModalFrame'

export default function ClaimAllModal({
  seeds,
  busy,
  onClose,
  onConfirm,
}: {
  seeds: DistributionRow[]
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const national = seeds.filter(
    (seed) => seed.scope_level === 'national',
  ).length
  const peek = seedPeekNames(seeds, 5)
  return (
    <ModalFrame
      title={`Claim all ${seeds.length} places?`}
      description={
        <>
          {peek.names.join(', ')}
          {peek.remaining > 0 ? ` and ${peek.remaining} more` : ''}.
          {national > 0
            ? ` ${national} of these are nationwide — shoppers anywhere will see those banners.`
            : ''}
        </>
      }
      busy={busy}
      onClose={onClose}
    >
        <div className="wis-modal-actions">
          <button
            type="button"
            className="wis-btn wis-btn--quiet"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="wis-btn wis-btn--primary"
            onClick={onConfirm}
            disabled={busy}
          >
            Claim all
          </button>
        </div>
    </ModalFrame>
  )
}
