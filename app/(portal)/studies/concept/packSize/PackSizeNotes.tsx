import { packSizePromptPreview } from '@/lib/concept/packSize'

export default function PackSizeNotes({
  loadError,
  packSize,
}: {
  loadError: boolean
  packSize: string
}) {
  return (
    <>
      <p id="pack_size_hint" className="cb-field-note">
        {loadError
          ? 'Could not load category pack sizes — type a custom pack size below, or re-pick the category.'
          : 'Fills the price question.'}
      </p>
      <p
        id="pack_size_preview"
        className="cb-field-note"
        style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--ink-50)' }}
      >
        {packSizePromptPreview(packSize)}
      </p>
    </>
  )
}
