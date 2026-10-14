export function IngredientsFields({
  draft,
  setField,
}: {
  draft: Record<string, unknown>
  setField: (key: string, value: unknown) => void
}) {
  return (
    <>
      <label className="corr-editor-label">
        Ingredients (verbatim)
        <textarea
          className="corr-editor-input corr-editor-textarea"
          value={String(draft.ingredients_text_raw ?? draft.ingredients_raw ?? '')}
          onChange={(e) => setField('ingredients_text_raw', e.target.value)}
          rows={5}
        />
      </label>
      <label className="corr-editor-label">
        Contains
        <input
          className="corr-editor-input"
          value={String(draft.allergens_contains_text_raw ?? '')}
          onChange={(e) => setField('allergens_contains_text_raw', e.target.value)}
        />
      </label>
      <label className="corr-editor-label">
        May contain
        <input
          className="corr-editor-input"
          value={String(draft.allergens_may_contain_text_raw ?? '')}
          onChange={(e) => setField('allergens_may_contain_text_raw', e.target.value)}
        />
      </label>
    </>
  )
}
