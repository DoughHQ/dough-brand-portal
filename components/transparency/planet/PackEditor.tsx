import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { composePackLine } from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import type { PlanetLocalRow, Props } from './planetModel'

export function PackEditor({
  subject,
  fields,
  rows,
  canEdit,
  savingKey,
  errors,
  onChange,
  onEnsureRow,
  onSaveRow,
}: {
  subject: string
  fields: {
    material: ProofSubMetricRow | null
    disposal: ProofSubMetricRow | null
    recycled: ProofSubMetricRow | null
    reuse: ProofSubMetricRow | null
  }
  rows: {
    material?: PlanetLocalRow
    disposal?: PlanetLocalRow
    recycled?: PlanetLocalRow
    reuse?: PlanetLocalRow
  }
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  onChange: Props['onChange']
  onEnsureRow: Props['onEnsureRow']
  onSaveRow: Props['onSaveRow']
}) {
  const patch = (
    field: ProofSubMetricRow,
    row: PlanetLocalRow | undefined,
    partial: Partial<DisclosureDraft>,
  ) => {
    let key = row?.key
    let base = row?.draft
    if (!key || !base) {
      key = onEnsureRow(field, subject)
      base = blankDraft(field, {
        subjectKind: 'component',
        subjectLabel: subject,
        status: 'disclosed',
      })
    }
    onChange(field.sub_metric_code, key, {
      ...base,
      subjectKind: 'component',
      subjectLabel: subject,
      status: 'disclosed',
      ...partial,
    })
  }

  const preview = composePackLine({
    component: subject,
    material: rows.material?.draft.valueText,
    disposal: rows.disposal?.draft.valueText,
    recycledPct: rows.recycled?.draft.valueNum,
    reuse: rows.reuse?.draft.valueText,
  })

  const saveAll = () => {
    const pairs: [ProofSubMetricRow | null, PlanetLocalRow | undefined][] = [
      [fields.material, rows.material],
      [fields.disposal, rows.disposal],
      [fields.recycled, rows.recycled],
      [fields.reuse, rows.reuse],
    ]
    for (const [field, row] of pairs) {
      if (!field || !row) continue
      const has =
        row.draft.valueText?.trim() ||
        row.draft.valueNum != null
      if (has) onSaveRow(field, row)
    }
  }

  return (
    <div className="tx-formula__block">
      <ShopperPreview line={preview.includes('·') ? preview : ''} />
      {fields.material ? (
        <div className="tx-field">
          <div className="tx-label">Material</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={rows.material?.draft.valueText ?? ''}
            onChange={(e) =>
              patch(fields.material!, rows.material, {
                valueText: e.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {(fields.material.allowed_values ?? []).map((c) => (
              <option key={c} value={c}>
                {formatProofCode(c)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {fields.disposal ? (
        <div className="tx-field">
          <div className="tx-label">Disposal</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={rows.disposal?.draft.valueText ?? ''}
            onChange={(e) =>
              patch(fields.disposal!, rows.disposal, {
                valueText: e.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {(fields.disposal.allowed_values ?? []).map((c) => (
              <option key={c} value={c}>
                {formatProofCode(c)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {fields.recycled ? (
        <div className="tx-field">
          <div className="tx-label">Recycled content</div>
          <div className="tx-inline" style={{ maxWidth: 200 }}>
            <input
              type="number"
              step="any"
              min={0}
              max={100}
              className="tx-control"
              disabled={!canEdit}
              value={rows.recycled?.draft.valueNum ?? ''}
              onChange={(e) =>
                patch(fields.recycled!, rows.recycled, {
                  valueNum: e.target.value === '' ? null : Number(e.target.value),
                  valueUnit: 'percent',
                })
              }
            />
            <span className="tx-unit">%</span>
          </div>
        </div>
      ) : null}
      {fields.reuse ? (
        <div className="tx-field">
          <div className="tx-label">Reuse / refill</div>
          <select
            className="tx-control"
            disabled={!canEdit}
            value={rows.reuse?.draft.valueText ?? ''}
            onChange={(e) =>
              patch(fields.reuse!, rows.reuse, {
                valueText: e.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {(fields.reuse.allowed_values ?? []).map((c) => (
              <option key={c} value={c}>
                {formatProofCode(c)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {canEdit ? (
        <button
          type="button"
          className="tx-btn tx-btn--primary"
          disabled={
            savingKey != null &&
            [rows.material, rows.disposal, rows.recycled, rows.reuse].some(
              (r) => r && savingKey === r.key,
            )
          }
          onClick={saveAll}
        >
          Save component
        </button>
      ) : null}
      {[rows.material, rows.disposal, rows.recycled, rows.reuse].map((r) =>
        r && errors[r.key] ? (
          <p key={r.key} className="tx-error">
            {errors[r.key]}
          </p>
        ) : null,
      )}
    </div>
  )
}
