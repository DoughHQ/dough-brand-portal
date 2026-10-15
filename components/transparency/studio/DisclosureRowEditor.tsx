'use client'

import type { DisclosureStatus } from '@/lib/transparency/disclosures'
import { Label } from './disclosure/fields'
import { STATUS_OPTIONS } from './disclosure/disclosureOptions'
import type { Props } from './disclosure/disclosureProps'
import { MethodFields } from './disclosure/MethodFields'
import { ProvenanceSection } from './disclosure/ProvenanceSection'
import { PublishFooter } from './disclosure/PublishFooter'
import { StatusNote } from './disclosure/StatusNote'
import { SubjectField } from './disclosure/SubjectField'
import { ValueField } from './disclosure/ValueField'

export default function DisclosureRowEditor({
  field,
  draft,
  canEdit,
  saving,
  error,
  onChange,
  onSave,
}: Props) {
  const disclosed = draft.status === 'disclosed'
  const needsSubject = field.subject_kind_default !== 'whole_product'
  const showOther =
    disclosed && field.value_kind === 'enum' && draft.valueText === 'other'

  const setStatus = (raw: string) => {
    const status = raw as DisclosureStatus
    if (status !== 'disclosed') {
      onChange({
        ...draft,
        status,
        valueText: null,
        valueNum: null,
        valueBool: null,
        valueDate: null,
        valueUnit: null,
        methodCode: null,
        boundaryCode: null,
        dataQuality: null,
        otherText: null,
      })
      return
    }
    onChange({ ...draft, status })
  }

  return (
    <div className={`tx-card${draft.published ? ' tx-card--live' : ''}`}>
      <div className="tx-card__top">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="tx-card__title">{field.label}</h3>
          <p className="tx-card__def">{field.definition}</p>
        </div>
      </div>

      <div className="tx-field">
        <Label>Status</Label>
        <select
          value={draft.status}
          disabled={!canEdit}
          onChange={(e) => setStatus(e.target.value)}
          className="tx-control"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {needsSubject ? (
        <SubjectField field={field} draft={draft} canEdit={canEdit} onChange={onChange} />
      ) : null}

      {disclosed ? (
        <>
          <ValueField field={field} draft={draft} canEdit={canEdit} onChange={onChange} />

          {showOther ? (
            <div className="tx-field">
              <Label>Describe “other”</Label>
              <input
                value={draft.otherText ?? ''}
                disabled={!canEdit}
                onChange={(e) => onChange({ ...draft, otherText: e.target.value || null })}
                className="tx-control"
              />
            </div>
          ) : null}

          <MethodFields field={field} draft={draft} canEdit={canEdit} onChange={onChange} />

          <ProvenanceSection field={field} draft={draft} canEdit={canEdit} onChange={onChange} />
        </>
      ) : (
        <StatusNote draft={draft} canEdit={canEdit} onChange={onChange} />
      )}

      <PublishFooter
        draft={draft}
        canEdit={canEdit}
        saving={saving}
        onChange={onChange}
        onSave={onSave}
      />

      {error ? <p className="tx-error">{error}</p> : null}
    </div>
  )
}
