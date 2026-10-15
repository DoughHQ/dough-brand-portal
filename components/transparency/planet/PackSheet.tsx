import { useState } from 'react'
import { type ProofSubMetricRow } from '@/lib/transparency/disclosures'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import { composePackLine } from '@/lib/transparency/storyLines'
import { findSubject, norm, type PlanetLocalRow, type Props } from './planetModel'
import { PackEditor } from './PackEditor'

export function PackSheet({
  fields,
  subjects,
  rowsByCode,
  canEdit,
  savingKey,
  errors,
  showSeed,
  onChange,
  onEnsureRow,
  onSaveRow,
  onSeed,
}: {
  fields: {
    material: ProofSubMetricRow | null
    disposal: ProofSubMetricRow | null
    recycled: ProofSubMetricRow | null
    reuse: ProofSubMetricRow | null
  }
  subjects: string[]
  rowsByCode: Record<string, PlanetLocalRow[]>
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  showSeed: boolean
  onChange: Props['onChange']
  onEnsureRow: Props['onEnsureRow']
  onSaveRow: Props['onSaveRow']
  onSeed: () => void
}) {
  const [openName, setOpenName] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [customName, setCustomName] = useState('')

  return (
    <div className="tx-ops__sub">
      {showSeed && canEdit ? (
        <button type="button" className="tx-add" onClick={onSeed} style={{ marginBottom: 10 }}>
          Seed Bottle, Cap, Sleeve
        </button>
      ) : null}

      <div className="tx-formula__sheet">
        <div className="tx-ops__sheet-head" aria-hidden>
          <span>Component</span>
          <span>Story</span>
          <span>Status</span>
        </div>
        {subjects.length === 0 ? (
          <div className="tx-formula__empty">
            No packaging components yet. Seed defaults or add one.
          </div>
        ) : (
          subjects.map((name) => {
            const material = fields.material
              ? findSubject(rowsByCode['packaging_primary_material'] ?? [], name)
              : undefined
            const disposal = fields.disposal
              ? findSubject(rowsByCode['packaging_disposal_route'] ?? [], name)
              : undefined
            const recycled = fields.recycled
              ? findSubject(rowsByCode['packaging_recycled_content_pct'] ?? [], name)
              : undefined
            const reuse = fields.reuse
              ? findSubject(rowsByCode['packaging_reuse_model'] ?? [], name)
              : undefined
            const open = openName === name
            const line = composePackLine({
              component: name,
              material: material?.draft.valueText,
              disposal: disposal?.draft.valueText,
              recycledPct: recycled?.draft.valueNum,
              reuse: reuse?.draft.valueText,
            })
            const presence = rowPresence(
              material?.draft ?? disposal?.draft ?? recycled?.draft ?? null,
            )
            return (
              <div
                key={norm(name)}
                className={`tx-formula__row${open ? ' tx-formula__row--open' : ''}`}
              >
                <button
                  type="button"
                  className="tx-ops__sheet-hit"
                  onClick={() => setOpenName(open ? null : name)}
                  aria-expanded={open}
                >
                  <span className="tx-formula__name-text">{name}</span>
                  <span className="tx-origin__place">{line.includes('·') ? line : '—'}</span>
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
                    <PackEditor
                      subject={name}
                      fields={fields}
                      rows={{ material, disposal, recycled, reuse }}
                      canEdit={canEdit}
                      savingKey={savingKey}
                      errors={errors}
                      onChange={onChange}
                      onEnsureRow={onEnsureRow}
                      onSaveRow={onSaveRow}
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
                placeholder="e.g. Tray"
                autoFocus
                onChange={(e) => setCustomName(e.target.value)}
              />
              <button
                type="button"
                className="tx-btn tx-btn--primary"
                onClick={() => {
                  const name = customName.trim()
                  if (!name || !fields.material) return
                  onEnsureRow(fields.material, name)
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
              Add packaging component
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
