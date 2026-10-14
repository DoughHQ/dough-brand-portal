import { formatUtcStamp } from '@/lib/portal-ui/format'
import type { PendingOwnershipCorrection } from '@/lib/ownershipCorrections'

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  return formatUtcStamp(iso)
}

export function OwnershipCorrectionHeading({ row }: { row: PendingOwnershipCorrection }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 10,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          {row.brand_name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
          Brand #{row.brand_id}
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-50)', textAlign: 'right' }}>
        Submitted {formatWhen(row.submitted_at)}
        {row.submitted_by_portal_user_id ? (
          <div style={{ marginTop: 2, fontSize: 11, color: 'var(--ink-30)' }}>
            by {row.submitted_by_portal_user_id.slice(0, 8)}…
          </div>
        ) : null}
      </div>
    </div>
  )
}
