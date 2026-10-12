import type { ConceptStudyDraft } from '@/lib/concept/types'
import { inputBase, labelSm } from '../conceptStyles'

export default function StudyNameField({
  draft,
  onChange,
  showErrors,
  titleError,
}: {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  showErrors?: boolean
  titleError?: string | null
}) {
  return (
    <div className="cb-setup-name">
      <label style={labelSm} htmlFor="concept-study-name">
        Name this study
      </label>
      <input
        id="concept-study-name"
        className="cb-input"
        value={draft.title}
        onChange={(e) => onChange({ ...draft, title: e.target.value })}
        placeholder="e.g. Midnight Cocoa packaging"
        style={inputBase}
      />
      <p className="cb-field-note">Respondents see this name.</p>
      {showErrors && titleError ? (
        <p role="alert" style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--cb-error)' }}>
          {titleError}
        </p>
      ) : null}
    </div>
  )
}
