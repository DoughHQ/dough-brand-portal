import type { DisclosureDraft, ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import type { OpsLocalRow } from '@/components/transparency/operations/types'

export function MadeStoryFields({
  canEdit,
  methodField,
  paramField,
  methodRow,
  paramRow,
  patchWhole,
}: {
  canEdit: boolean
  methodField?: ProofSubMetricRow
  paramField?: ProofSubMetricRow
  methodRow?: OpsLocalRow
  paramRow?: OpsLocalRow
  patchWhole: (
    field: ProofSubMetricRow,
    row: OpsLocalRow | undefined,
    partial: Partial<DisclosureDraft>,
  ) => void
}) {
  return (
    <>
      {methodField && methodRow ? (
        <div className="tx-field">
          <div className="tx-label">Process method</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={methodRow.draft.valueText ?? ''}
            onChange={(e) =>
              patchWhole(methodField, methodRow, {
                valueText: e.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {(methodField.allowed_values ?? []).map((code) => (
              <option key={code} value={code}>
                {formatProofCode(code)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {paramField && paramRow ? (
        <div className="tx-field">
          <div className="tx-label">Parameter (optional)</div>
          <input
            className="tx-control"
            disabled={!canEdit}
            placeholder="e.g. 48-hour ferment, 180°C / 12 min"
            value={paramRow.draft.valueText ?? ''}
            onChange={(e) =>
              patchWhole(paramField, paramRow, {
                valueText: e.target.value || null,
              })
            }
          />
        </div>
      ) : null}
    </>
  )
}
