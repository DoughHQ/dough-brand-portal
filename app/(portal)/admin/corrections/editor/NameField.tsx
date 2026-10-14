export function NameField({
  draft,
  setField,
}: {
  draft: Record<string, unknown>
  setField: (key: string, value: unknown) => void
}) {
  return (
    <label className="corr-editor-label">
      Product name
      <input
        className="corr-editor-input"
        value={String(draft.name ?? '')}
        onChange={(e) => setField('name', e.target.value)}
      />
    </label>
  )
}
