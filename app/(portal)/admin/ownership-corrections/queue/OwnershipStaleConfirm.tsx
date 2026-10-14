import type { Dispatch, SetStateAction } from 'react'
import type { PendingOwnershipCorrection } from '@/lib/ownershipCorrections'

export function OwnershipStaleConfirm({
  row,
  busy,
  confirmingStale,
  setStaleConfirmId,
  decide,
}: {
  row: PendingOwnershipCorrection
  busy: boolean
  confirmingStale: boolean
  setStaleConfirmId: Dispatch<SetStateAction<string | null>>
  decide: (
    row: PendingOwnershipCorrection,
    decision: 'accept' | 'reject',
    overrideStale: boolean,
  ) => void
}) {
  if (!confirmingStale) return null

  return (
    <div
      style={{
        marginBottom: 12,
        padding: '12px 14px',
        borderRadius: 8,
        background: 'var(--surface-1, #f5f3ee)',
        border: '1px solid var(--ink-10)',
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 10, lineHeight: 1.45 }}>
        The parent changed since submission — apply this correction anyway?
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => void decide(row, 'accept', true)}
          style={{
            padding: '8px 14px',
            background: 'var(--sage)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Applying…' : 'Yes, apply anyway'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setStaleConfirmId(null)}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            color: 'var(--ink-50)',
            border: '1px solid var(--ink-10)',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
