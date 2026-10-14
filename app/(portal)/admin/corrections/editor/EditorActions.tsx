export function EditorActions({
  applyDisabled,
  applyLabel,
  busy,
  onCancel,
  onSubmit,
  cleanPayload,
  skuVariantId,
}: {
  applyDisabled: boolean
  applyLabel: string
  busy: boolean
  onCancel: () => void
  onSubmit: (value: Record<string, unknown>, skuVariantId: number | null) => void
  cleanPayload: () => Record<string, unknown>
  skuVariantId: number | null
}) {
  return (
    <div className="corr-editor-actions">
      <button
        type="button"
        className="corr-btn corr-btn-primary"
        disabled={applyDisabled}
        onClick={() => onSubmit(cleanPayload(), skuVariantId)}
      >
        {applyLabel}
      </button>
      <button
        type="button"
        className="corr-btn corr-btn-ghost"
        disabled={busy}
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  )
}
