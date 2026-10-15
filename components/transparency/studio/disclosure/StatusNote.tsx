import type { Props } from './disclosureProps'
import { Label } from './fields'

export function StatusNote({
  draft,
  canEdit,
  onChange,
}: Pick<Props, 'draft' | 'canEdit' | 'onChange'>) {
  return (
    <div className="tx-status-note">
      <div className="tx-field" style={{ marginBottom: 10 }}>
        <Label>As of</Label>
        <input
          type="date"
          value={draft.asofDate}
          disabled={!canEdit}
          onChange={(e) => onChange({ ...draft, asofDate: e.target.value })}
          className="tx-control tx-control--date"
        />
      </div>
      Non-disclosed rows carry no value — only the status, subject, and date. That is a
      deliberate answer, not a blank.
    </div>
  )
}
