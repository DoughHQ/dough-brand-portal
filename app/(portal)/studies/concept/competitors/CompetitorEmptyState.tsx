import type { AddAvailability } from '@/lib/concept/fieldSize'
import ShelfGlyph from './ShelfGlyph'

export default function CompetitorEmptyState({
  disabled,
  addAvailability,
  onOpenAdd,
}: {
  disabled?: boolean
  addAvailability: AddAvailability
  onOpenAdd: () => void
}) {
  return (
    <div
      style={{
        border: 'var(--cb-border-dashed)',
        borderRadius: 'var(--r-lg)',
        background: 'var(--cb-surface-muted)',
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      <ShelfGlyph />
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink-80)',
          marginBottom: 8,
        }}
      >
        Add competitors
      </div>
      <p
        style={{
          margin: '0 auto 16px',
          maxWidth: 280,
          fontSize: 13,
          color: 'var(--ink-50)',
          lineHeight: 1.45,
        }}
      >
        Search Dough&rsquo;s product database for the products shoppers would see as
        alternatives.
      </p>
      <button
        type="button"
        className="cb-btn-outline"
        onClick={onOpenAdd}
        disabled={disabled || !addAvailability.allowed}
      >
        + Add competitor
      </button>
    </div>
  )
}
