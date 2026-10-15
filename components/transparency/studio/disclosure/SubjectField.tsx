import type { Props } from './disclosureProps'
import { Label } from './fields'

export function SubjectField({
  field,
  draft,
  canEdit,
  onChange,
}: Pick<Props, 'field' | 'draft' | 'canEdit' | 'onChange'>) {
  return (
    <div className="tx-field">
      <Label>
        {field.subject_kind_default === 'ingredient'
          ? 'Ingredient'
          : field.subject_kind_default === 'component'
            ? 'Packaging component'
            : field.subject_kind_default === 'facility'
              ? 'Facility'
              : 'Subject'}
      </Label>
      <input
        value={draft.subjectLabel ?? ''}
        disabled={!canEdit}
        onChange={(e) => onChange({ ...draft, subjectLabel: e.target.value })}
        placeholder={
          field.subject_kind_default === 'ingredient'
            ? 'e.g. cocoa, sugar'
            : field.subject_kind_default === 'component'
              ? 'e.g. bottle, cap, sleeve'
              : 'Name the subject'
        }
        className="tx-control"
      />
    </div>
  )
}
