import { useState } from 'react'
import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import SubjectTextEditor from '@/components/transparency/operations/SubjectTextEditor'
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

export default function FlavorSheet({
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
  const [openName, setOpenName] = useState<string | null>(lines[0]?.name ?? null)
  const [showAdd, setShowAdd] = useState(false)
  const [customName, setCustomName] = useState('')

  return (
    <div className="tx-ops__sub">
      <p className="tx-ops__sub-title">Natural flavor breakout</p>
      <p className="tx-ops__sub-lede">
        When the label says “natural flavors,” say what they actually are — or choose not to.
      </p>
      {lines.length === 0 ? (
        <div className="tx-ops__card">
          <p className="tx-ops__card-hint" style={{ marginBottom: 12 }}>
            No “natural flavors” phrase on this SKU’s ingredient statement.
          </p>
          {canEdit ? (
            showAdd ? (
              <div className="tx-formula__add-form">
                <input
                  className="tx-control"
                  value={customName}
                  placeholder="e.g. Natural flavors"
                  autoFocus
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <button
                  type="button"
                  className="tx-btn tx-btn--primary"
                  onClick={() => {
                    const name = customName.trim() || 'Natural flavors'
                    onEnsureRow(field, name)
                    setCustomName('')
                    setShowAdd(false)
                    setOpenName(name)
                  }}
                >
                  Add
                </button>
              </div>
            ) : (
              <button type="button" className="tx-add" onClick={() => setShowAdd(true)}>
                Disclose a flavor breakout
              </button>
            )
          ) : null}
        </div>
      ) : (
        <div className="tx-formula__sheet">
          {lines.map((line) => {
            const row = findSubjectRow(rows, line.name)
            const open = openName === line.name
            const presence = row ? rowPresence(row.draft) : 'not_started'
            return (
              <div
                key={norm(line.name)}
                className={`tx-formula__row${open ? ' tx-formula__row--open' : ''}`}
              >
                <button
                  type="button"
                  className="tx-ops__flavor-hit"
                  onClick={() => setOpenName(open ? null : line.name)}
                  aria-expanded={open}
                >
                  <span className="tx-formula__name-text">{line.display}</span>
                  <span className={presencePillClass(presence)}>
                    {presenceLabel(presence)}
                  </span>
                </button>
                {open ? (
                  <div className="tx-formula__editor">
                    <SubjectTextEditor
                      field={field}
                      subject={line.name}
                      row={row}
                      canEdit={canEdit}
                      saving={row != null && savingKey === row.key}
                      error={row ? errors[row.key] ?? null : null}
                      placeholder="e.g. orange oil, vanilla extract"
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
    </div>
  )
}
