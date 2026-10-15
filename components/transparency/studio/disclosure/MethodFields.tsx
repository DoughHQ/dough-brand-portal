import type { Props } from './disclosureProps'
import { Label, OptionSelect } from './fields'

export function MethodFields({
  field,
  draft,
  canEdit,
  onChange,
}: Pick<Props, 'field' | 'draft' | 'canEdit' | 'onChange'>) {
  return (
    (field.requires_method ||
      field.requires_boundary ||
      field.requires_data_quality) && (
      <div className="tx-field">
        <div className="tx-grid">
          {field.requires_method ? (
            <div>
              <Label>Method</Label>
              <OptionSelect
                value={draft.methodCode ?? ''}
                disabled={!canEdit}
                options={field.allowed_methods ?? []}
                onChange={(v) => onChange({ ...draft, methodCode: v || null })}
              />
            </div>
          ) : null}
          {field.requires_boundary ? (
            <div>
              <Label>Boundary</Label>
              <OptionSelect
                value={draft.boundaryCode ?? ''}
                disabled={!canEdit}
                options={field.allowed_boundaries ?? []}
                onChange={(v) => onChange({ ...draft, boundaryCode: v || null })}
              />
            </div>
          ) : null}
          {field.requires_data_quality ? (
            <div>
              <Label>Data quality</Label>
              <OptionSelect
                value={draft.dataQuality ?? ''}
                disabled={!canEdit}
                options={field.allowed_data_qualities ?? []}
                onChange={(v) => onChange({ ...draft, dataQuality: v || null })}
              />
            </div>
          ) : null}
        </div>
      </div>
    )
  )
}
