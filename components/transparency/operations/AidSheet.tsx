import { useState } from 'react'
import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import SubjectTextEditor from '@/components/transparency/operations/SubjectTextEditor'
import type {
  OperationsEditorHandlers,
  OpsLocalRow,
} from '@/components/transparency/operations/types'

type Props = {
  field: ProofSubMetricRow
  rows: OpsLocalRow[]
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  onChange: OperationsEditorHandlers['onChange']
  onEnsureRow: OperationsEditorHandlers['onEnsureRow']
  onSave: OperationsEditorHandlers['onSaveRow']
}

export default function AidSheet({
  field,
  rows,
  canEdit,
  savingKey,
  errors,
  onChange,
  onEnsureRow,
  onSave,
}: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [customName, setCustomName] = useState('')

  const started = rows.filter((r) => (r.draft.subjectLabel ?? '').trim())

  return (
    <div className="tx-ops__sub">
      <p className="tx-ops__sub-title">Processing aids</p>
      <p className="tx-ops__sub-lede">
        Aids used in making that aren’t required on the ingredient list.
      </p>
      {started.length === 0 ? (
        <div className="tx-ops__card">
          <p className="tx-ops__card-hint" style={{ marginBottom: 12 }}>
            None disclosed yet.
          </p>
        </div>
      ) : (
        <div className="tx-formula__sheet">
          {started.map((row) => {
            const open = openKey === row.key
            const presence = rowPresence(row.draft)
            return (
              <div
                key={row.key}
                className={`tx-formula__row${open ? ' tx-formula__row--open' : ''}`}
              >
                <button
                  type="button"
                  className="tx-ops__flavor-hit"
                  onClick={() => setOpenKey(open ? null : row.key)}
                  aria-expanded={open}
                >
                  <span className="tx-formula__name-text">
                    {row.draft.subjectLabel || 'Processing aid'}
                  </span>
                  <span className={presencePillClass(presence)}>
                    {presenceLabel(presence)}
                  </span>
                </button>
                {open ? (
                  <div className="tx-formula__editor">
                    <SubjectTextEditor
                      field={field}
                      subject={row.draft.subjectLabel ?? ''}
                      row={row}
                      canEdit={canEdit}
                      saving={savingKey === row.key}
                      error={errors[row.key] ?? null}
                      placeholder="What the aid is / how it’s used"
                      onEnsureRow={onEnsureRow}
                      onChange={onChange}
                      onSave={onSave}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
      {canEdit ? (
        <div className="tx-formula__add">
          {showAdd ? (
            <div className="tx-formula__add-form">
              <input
                className="tx-control"
                value={customName}
                placeholder="e.g. Silicon dioxide"
                autoFocus
                onChange={(e) => setCustomName(e.target.value)}
              />
              <button
                type="button"
                className="tx-btn tx-btn--primary"
                onClick={() => {
                  const name = customName.trim()
                  if (!name) return
                  const key = onEnsureRow(field, name)
                  setCustomName('')
                  setShowAdd(false)
                  setOpenKey(key)
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
              Add a processing aid
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
