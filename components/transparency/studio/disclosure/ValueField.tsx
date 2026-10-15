import { formatUnitSuffix } from '@/lib/transparency/displayMap'
import type { Props } from './disclosureProps'
import { isIsoCountryField } from './disclosureOptions'
import { Label, OptionSelect } from './fields'

export function ValueField({
  field,
  draft,
  canEdit,
  onChange,
}: Pick<Props, 'field' | 'draft' | 'canEdit' | 'onChange'>) {
  return (
    <div className="tx-field">
      <Label>Value</Label>
      {field.value_kind === 'enum' && isIsoCountryField(field) ? (
        <input
          value={draft.valueText ?? ''}
          disabled={!canEdit}
          maxLength={2}
          placeholder="US"
          onChange={(e) =>
            onChange({
              ...draft,
              valueText: e.target.value.toUpperCase().replace(/[^A-Z]/g, ''),
            })
          }
          className="tx-control tx-control--narrow"
        />
      ) : field.value_kind === 'enum' ? (
        <OptionSelect
          value={draft.valueText ?? ''}
          disabled={!canEdit}
          options={field.allowed_values ?? []}
          onChange={(v) =>
            onChange({
              ...draft,
              valueText: v || null,
              otherText: v === 'other' ? draft.otherText : null,
            })
          }
        />
      ) : field.value_kind === 'numeric' ? (
        <div className="tx-inline">
          <input
            type="number"
            step="any"
            value={draft.valueNum ?? ''}
            disabled={!canEdit}
            onChange={(e) =>
              onChange({
                ...draft,
                valueNum: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            className="tx-control"
          />
          {field.unit_source === 'row' ? (
            <OptionSelect
              value={draft.valueUnit ?? ''}
              disabled={!canEdit}
              options={field.allowed_units ?? []}
              placeholder="Unit"
              onChange={(v) => onChange({ ...draft, valueUnit: v || null })}
            />
          ) : field.unit ? (
            <span className="tx-unit">{formatUnitSuffix(field.unit)}</span>
          ) : null}
        </div>
      ) : field.value_kind === 'date' ? (
        <input
          type="date"
          value={draft.valueDate ?? ''}
          disabled={!canEdit}
          onChange={(e) => onChange({ ...draft, valueDate: e.target.value || null })}
          className="tx-control tx-control--date"
        />
      ) : field.value_kind === 'url' ? (
        <input
          type="url"
          value={draft.valueText ?? ''}
          disabled={!canEdit}
          placeholder="https://"
          onChange={(e) => onChange({ ...draft, valueText: e.target.value || null })}
          className="tx-control"
        />
      ) : (
        <input
          type="text"
          value={draft.valueText ?? ''}
          disabled={!canEdit}
          onChange={(e) => onChange({ ...draft, valueText: e.target.value || null })}
          className="tx-control"
        />
      )}
    </div>
  )
}
