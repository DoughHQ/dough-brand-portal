import type { DisclosureDraft, ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import type { OpsLocalRow } from '@/components/transparency/operations/types'

export function KeptStoryFields({
  canEdit,
  storageField,
  shelfField,
  handlingField,
  storageRow,
  shelfRow,
  handlingRow,
  patchWhole,
}: {
  canEdit: boolean
  storageField?: ProofSubMetricRow
  shelfField?: ProofSubMetricRow
  handlingField?: ProofSubMetricRow
  storageRow?: OpsLocalRow
  shelfRow?: OpsLocalRow
  handlingRow?: OpsLocalRow
  patchWhole: (
    field: ProofSubMetricRow,
    row: OpsLocalRow | undefined,
    partial: Partial<DisclosureDraft>,
  ) => void
}) {
  return (
    <>
      {storageField && storageRow ? (
        <div className="tx-field">
          <div className="tx-label">Storage</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={storageRow.draft.valueText ?? ''}
            onChange={(e) =>
              patchWhole(storageField, storageRow, {
                valueText: e.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {(storageField.allowed_values ?? []).map((code) => (
              <option key={code} value={code}>
                {formatProofCode(code)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {shelfField && shelfRow ? (
        <div className="tx-field">
          <div className="tx-label">On-pack date means</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={shelfRow.draft.valueText ?? ''}
            onChange={(e) =>
              patchWhole(shelfField, shelfRow, {
                valueText: e.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {(shelfField.allowed_values ?? []).map((code) => (
              <option key={code} value={code}>
                {formatProofCode(code)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {handlingField && handlingRow ? (
        <div className="tx-field">
          <div className="tx-label">After opening</div>
          <input
            className="tx-control"
            disabled={!canEdit}
            placeholder="e.g. Refrigerate and use within 7 days"
            value={handlingRow.draft.valueText ?? ''}
            onChange={(e) =>
              patchWhole(handlingField, handlingRow, {
                valueText: e.target.value || null,
              })
            }
          />
        </div>
      ) : null}
    </>
  )
}
