export function ImageField({
  draft,
  setField,
}: {
  draft: Record<string, unknown>
  setField: (key: string, value: unknown) => void
}) {
  return (
    <label className="corr-editor-label">
      Image URL
      <input
        className="corr-editor-input"
        value={String(draft.image_url ?? '')}
        onChange={(e) => setField('image_url', e.target.value)}
      />
    </label>
  )
}
