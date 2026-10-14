import type { PendingOwnershipCorrection } from '@/lib/ownershipCorrections'

export function OwnershipDecisionActions({
  row,
  busy,
  confirmingStale,
  onAcceptClick,
  decide,
}: {
  row: PendingOwnershipCorrection
  busy: boolean
  confirmingStale: boolean
  onAcceptClick: (row: PendingOwnershipCorrection) => void
  decide: (
    row: PendingOwnershipCorrection,
    decision: 'accept' | 'reject',
    overrideStale: boolean,
  ) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        disabled={busy || confirmingStale}
        onClick={() => onAcceptClick(row)}
        style={{
          padding: '8px 14px',
          background: 'var(--sage)',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: busy || confirmingStale ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)',
          opacity: busy || confirmingStale ? 0.55 : 1,
        }}
      >
        {busy ? 'Working…' : 'Accept'}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void decide(row, 'reject', false)}
        style={{
          padding: '8px 14px',
          background: 'transparent',
          color: 'var(--ink)',
          border: '1px solid var(--ink-10)',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 500,
          cursor: busy ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)',
          opacity: busy ? 0.55 : 1,
        }}
      >
        Reject
      </button>
    </div>
  )
}
