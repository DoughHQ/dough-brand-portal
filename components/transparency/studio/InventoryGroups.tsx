'use client'

import { presencePillClass } from '@/lib/transparency/presencePresentation'
import { summarizeInventoryRow } from '@/lib/transparency/proofChapters'
import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import DisclosureRowEditor from './DisclosureRowEditor'
import type {
  InventoryGroup,
  LocalRow,
  RowsByMetric,
  UpdateRow,
} from './types'

function subjectNoun(kind: string): string {
  if (kind === 'ingredient') return 'ingredient'
  if (kind === 'component') return 'packaging component'
  if (kind === 'facility') return 'facility'
  if (kind === 'date_type') return 'date type'
  return 'subject'
}

type Props = {
  groups: InventoryGroup[]
  chapterGroupCount: number
  forceGroupLabel?: boolean
  rowsByMetric: RowsByMetric
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  openKey: string | null
  onOpenKeyChange: (key: string | null) => void
  onChange: UpdateRow
  onSave: (field: ProofSubMetricRow, row: LocalRow) => void
  onAddSubjectRow: (field: ProofSubMetricRow) => string
}

export default function InventoryGroups({
  groups,
  chapterGroupCount,
  forceGroupLabel,
  rowsByMetric,
  canEdit,
  savingKey,
  errors,
  openKey,
  onOpenKeyChange,
  onChange,
  onSave,
  onAddSubjectRow,
}: Props) {
  return groups.map((group) => (
    <div key={group.metricCode} className="tx-group">
      {forceGroupLabel || chapterGroupCount > 1 ? (
        <p className="tx-group__label">{group.label}</p>
      ) : null}
      <div className="tx-inventory">
        {group.fields.flatMap((field) => {
          const rows = rowsByMetric[field.sub_metric_code] ?? []
          return rows.map((row) => {
            const summary = summarizeInventoryRow(field, row.draft)
            const open = openKey === row.key
            return (
              <div key={row.key} className={`tx-row${open ? ' tx-row--open' : ''}`}>
                <button
                  type="button"
                  className="tx-row__hit"
                  onClick={() => onOpenKeyChange(open ? null : row.key)}
                  aria-expanded={open}
                >
                  <span className="tx-row__main">
                    <p className="tx-row__title">{summary.title}</p>
                    {summary.detail ? (
                      <p className="tx-row__detail">{summary.detail}</p>
                    ) : summary.presence === 'not_started' ? (
                      <p className="tx-row__detail">Tap to disclose</p>
                    ) : null}
                  </span>
                  <span className="tx-row__meta">
                    <span className={presencePillClass(summary.presence)}>
                      {summary.presenceLabel}
                    </span>
                    {summary.whisper || summary.asOf ? (
                      <span className="tx-row__whisper">
                        {[summary.whisper, summary.asOf ? `as of ${summary.asOf}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    ) : null}
                    <span className="tx-row__chev" aria-hidden>
                      ›
                    </span>
                  </span>
                </button>
                {open ? (
                  <div className="tx-row__editor">
                    <DisclosureRowEditor
                      field={field}
                      draft={row.draft}
                      canEdit={canEdit}
                      saving={savingKey === row.key}
                      error={errors[row.key] ?? null}
                      onChange={(draft) =>
                        onChange(field.sub_metric_code, row.key, draft)
                      }
                      onSave={() => onSave(field, row)}
                    />
                  </div>
                ) : null}
              </div>
            )
          })
        })}
      </div>
      {canEdit &&
      group.fields.some((field) => field.subject_kind_default !== 'whole_product')
        ? group.fields
            .filter((field) => field.subject_kind_default !== 'whole_product')
            .map((field) => (
              <button
                key={`add-${field.sub_metric_code}`}
                type="button"
                className="tx-add"
                onClick={() => onOpenKeyChange(onAddSubjectRow(field))}
              >
                Add another {subjectNoun(field.subject_kind_default)}
                {group.fields.length > 1 ? ` · ${field.label}` : ''}
              </button>
            ))
        : null}
    </div>
  ))
}
