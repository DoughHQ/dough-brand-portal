import ContentsAddActions from './ContentsAddActions'
import type { ComposerIntent } from './types'

export default function ContentsEmptyState({
  onOpen,
}: {
  onOpen: (intent: ComposerIntent) => void
}) {
  return (
    <div
      style={{
        border: 'var(--cb-border-dashed)',
        borderRadius: 'var(--r-lg)',
        background: 'var(--cb-surface-muted)',
        padding: '28px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink-80)',
          marginBottom: 8,
        }}
      >
        What goes in the box?
      </div>
      <p
        style={{
          margin: '0 auto 18px',
          maxWidth: 360,
          fontSize: 13,
          color: 'var(--ink-50)',
          lineHeight: 1.45,
        }}
      >
        Start with your product or a ready prototype, then add the catalog
        competitors shoppers would compare it against.
      </p>
      <ContentsAddActions
        onOpen={onOpen}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
        }}
      />
    </div>
  )
}
