import type { OwnershipCorrectionsPageCursor } from '@/lib/ownershipCorrections'

export function OwnershipQueueLoadMore({
  loadingMore,
  cursor,
  loadMore,
}: {
  loadingMore: boolean
  cursor: OwnershipCorrectionsPageCursor | null
  loadMore: () => void
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
      <button
        type="button"
        disabled={loadingMore || !cursor}
        onClick={() => void loadMore()}
        style={{
          padding: '10px 18px',
          borderRadius: 8,
          border: '1px solid var(--ink-10)',
          background: 'var(--paper)',
          fontSize: 13,
          fontWeight: 500,
          cursor: loadingMore ? 'wait' : 'pointer',
          fontFamily: 'var(--font-sans)',
          opacity: loadingMore ? 0.7 : 1,
        }}
      >
        {loadingMore ? 'Loading…' : 'Load more'}
      </button>
    </div>
  )
}
