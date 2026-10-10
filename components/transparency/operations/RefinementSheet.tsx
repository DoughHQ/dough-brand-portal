import { useState } from 'react'
import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { formatProofCode } from '@/lib/transparency/displayMap'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import SubjectEnumEditor from '@/components/transparency/operations/SubjectEnumEditor'
import type {
  LabelLine,
  OperationsEditorHandlers,
  OpsLocalRow,
} from '@/components/transparency/operations/types'

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function findSubjectRow(rows: OpsLocalRow[], subject: string): OpsLocalRow | undefined {
  const n = norm(subject)
  return rows.find((r) => norm(r.draft.subjectLabel ?? '') === n)
}

type Props = {
  field: ProofSubMetricRow
  lines: LabelLine[]
  rows: OpsLocalRow[]
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  onChange: OperationsEditorHandlers['onChange']
  onEnsureRow: OperationsEditorHandlers['onEnsureRow']
  onSave: OperationsEditorHandlers['onSaveRow']
}

export default function RefinementSheet({
  field,
  lines,
  rows,
  canEdit,
  savingKey,
  errors,
  onChange,
  onEnsureRow,
  onSave,
}: Props) {
  const [openName, setOpenName] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [customName, setCustomName] = useState('')

  return (
    <div className="tx-ops__sub">
      <p className="tx-ops__sub-title">Oil &amp; fat refinement</p>
      <p className="tx-ops__sub-lede">
        Codex states for named oils and fats. Seeded from oil-like ingredients on the label.
      </p>
      <div className="tx-formula__sheet">
        <div className="tx-ops__sheet-head" aria-hidden>
          <span>Ingredient</span>
          <span>State</span>
          <span>Status</span>
        </div>
        {lines.length === 0 ? (
          <div className="tx-formula__empty">
            No oils or fats detected on the label. Add one to disclose refinement.
          </div>
        ) : (
          lines.map((line) => {
            const row = findSubjectRow(rows, line.name)
            const open = openName === line.name
            const presence = row ? rowPresence(row.draft) : 'not_started'
            const state = row?.draft.valueText ? formatProofCode(row.draft.valueText) : '—'
            return (
              <div
                key={norm(line.name)}
                className={`tx-formula__row${open ? ' tx-formula__row--open' : ''}`}
              >
                <button
                  type="button"
                  className="tx-ops__sheet-hit"
                  onClick={() => setOpenName(open ? null : line.name)}
                  aria-expanded={open}
                >
                  <span className="tx-formula__name">
                    <span className="tx-formula__name-text">{line.display}</span>
                    {!line.fromLabel ? (
                      <span className="tx-formula__tag">Not on label</span>
                    ) : null}
                  </span>
                  <span className="tx-origin__place">{state}</span>
                  <span className="tx-formula__status">
                    <span className={presencePillClass(presence)}>
                      {presenceLabel(presence)}
                    </span>
                    <span className="tx-row__chev" aria-hidden>
                      ›
                    </span>
                  </span>
                </button>
                {open ? (
                  <div className="tx-formula__editor">
                    <SubjectEnumEditor
                      field={field}
                      subject={line.name}
                      row={row}
                      canEdit={canEdit}
                      saving={row != null && savingKey === row.key}
                      error={row ? errors[row.key] ?? null : null}
                      onEnsureRow={onEnsureRow}
                      onChange={onChange}
                      onSave={onSave}
                    />
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </div>
      {canEdit ? (
        <div className="tx-formula__add">
          {showAdd ? (
            <div className="tx-formula__add-form">
              <input
                className="tx-control"
                value={customName}
                placeholder="e.g. Olive oil"
                autoFocus
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const name = customName.trim()
                    if (!name) return
                    onEnsureRow(field, name)
                    setCustomName('')
                    setShowAdd(false)
                    setOpenName(name)
                  }
                }}
              />
              <button
                type="button"
                className="tx-btn tx-btn--primary"
                onClick={() => {
                  const name = customName.trim()
                  if (!name) return
                  onEnsureRow(field, name)
                  setCustomName('')
                  setShowAdd(false)
                  setOpenName(name)
                }}
              >
                Add
              </button>
              <button type="button" className="tx-btn" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="tx-add" onClick={() => setShowAdd(true)}>
              Oil or fat not on the label
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
