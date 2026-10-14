export function OtherField({
  draft,
  setField,
}: {
  draft: Record<string, unknown>
  setField: (key: string, value: unknown) => void
}) {
  return (
    <label className="corr-editor-label">
      Correction text
      <textarea
        className="corr-editor-input corr-editor-textarea"
        value={String(draft.note ?? draft.value ?? '')}
        onChange={(e) => setField('note', e.target.value)}
        rows={3}
      />
    </label>
  )
}
