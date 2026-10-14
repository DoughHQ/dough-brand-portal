export function PriceFields({
  draft,
  setField,
}: {
  draft: Record<string, unknown>
  setField: (key: string, value: unknown) => void
}) {
  return (
    <div className="corr-editor-price">
      <label className="corr-editor-label">
        Amount
        <input
          className="corr-editor-input"
          value={String(draft.price_amount ?? '')}
          onChange={(e) => setField('price_amount', e.target.value)}
        />
      </label>
      <label className="corr-editor-label">
        Store
        <input
          className="corr-editor-input"
          value={String(draft.price_store ?? '')}
          onChange={(e) => setField('price_store', e.target.value)}
        />
      </label>
      <label className="corr-editor-label">
        Unit
        <input
          className="corr-editor-input"
          value={String(draft.price_unit ?? '')}
          onChange={(e) => setField('price_unit', e.target.value)}
        />
      </label>
    </div>
  )
}
