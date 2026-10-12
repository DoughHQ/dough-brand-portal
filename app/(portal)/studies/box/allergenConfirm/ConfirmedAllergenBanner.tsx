import { summaryLine } from './allergenSummary'

export default function ConfirmedAllergenBanner({
  contains,
  mayContain,
  onEdit,
}: {
  contains: Set<string>
  mayContain: Set<string>
  onEdit: () => void
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 12px',
          borderRadius: 8,
          background: 'var(--sage-soft)',
          border: '1px solid var(--ink-10)',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--ink-70)', lineHeight: 1.4, minWidth: 0 }}>
          <span style={{ fontWeight: 600 }}>Allergens confirmed</span>
          <span style={{ color: 'var(--ink-50)' }}> · {summaryLine(contains, mayContain)}</span>
        </div>
        <button type="button" className="cb-quiet-action" onClick={onEdit}>
          Edit
        </button>
      </div>
    </div>
  )
}
