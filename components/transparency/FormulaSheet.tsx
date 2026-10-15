'use client'

import { useMemo, useState } from 'react'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import {
  displayAllCapsPhrase,
  splitIngredientStatement,
} from '@/app/(portal)/products/[productId]/tabs/compositionPresentation'
import { findRow, type IngredientLine, norm, type Props } from './formula/formulaModel'
import { AmountBlock } from './formula/AmountBlock'
import { BreakoutBlock } from './formula/BreakoutBlock'

export type { FormulaLocalRow } from './formula/formulaModel'

export default function FormulaSheet({
  ingredientStatement,
  pctField,
  breakoutField,
  pctRows,
  breakoutRows,
  canEdit,
  savingKey,
  errors,
  onChange,
  onSave,
  onEnsureRow,
  onAddCustomIngredient,
}: Props) {
  const [openName, setOpenName] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const labelNames = useMemo(() => {
    if (!ingredientStatement?.trim()) return [] as string[]
    return splitIngredientStatement(ingredientStatement).map((p) => displayAllCapsPhrase(p))
  }, [ingredientStatement])

  const lines = useMemo(() => {
    const seen = new Set<string>()
    const out: IngredientLine[] = []

    for (const name of labelNames) {
      const n = norm(name)
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push({ name, display: name, fromLabel: true })
    }

    for (const row of [...pctRows, ...breakoutRows]) {
      const label = row.draft.subjectLabel?.trim()
      if (!label) continue
      const n = norm(label)
      if (!n || seen.has(n)) continue
      if (row.draft.disclosureId == null && !row.draft.valueText && row.draft.valueNum == null) {
        // ephemeral ensure rows still count so UI can bind
        seen.add(n)
        out.push({ name: label, display: label, fromLabel: false })
        continue
      }
      seen.add(n)
      out.push({ name: label, display: label, fromLabel: false })
    }

    return out
  }, [labelNames, pctRows, breakoutRows])

  const submitCustom = () => {
    const name = customName.trim()
    if (!name) return
    onAddCustomIngredient(name)
    setCustomName('')
    setShowAdd(false)
    setOpenName(name)
  }

  if (!pctField && !breakoutField) {
    return <div className="tx-empty">No formula fields in the registry.</div>
  }

  return (
    <div className="tx-formula">
      <div className="tx-formula__banner">
        {ingredientStatement?.trim() ? (
          <p className="tx-formula__banner-text">
            Seeded from this SKU’s ingredient statement. Tell shoppers how much of each
            ingredient you choose to disclose — or what’s inside a compound.
          </p>
        ) : (
          <p className="tx-formula__banner-text">
            No ingredient statement on this SKU yet. Add one under{' '}
            <strong>Ingredients &amp; nutrition</strong>, or name an ingredient below
            (e.g. Aspartame) to disclose it.
          </p>
        )}
      </div>

      <div className="tx-formula__sheet">
        <div className="tx-formula__head" aria-hidden>
          <span>Ingredient</span>
          <span>Amount</span>
          <span>Status</span>
        </div>

        {lines.length === 0 ? (
          <div className="tx-formula__empty">Nothing to enrich yet. Add an ingredient to start.</div>
        ) : (
          lines.map((line) => {
            const pct = pctField ? findRow(pctRows, line.name) : undefined
            const brk = breakoutField ? findRow(breakoutRows, line.name) : undefined
            const open = openName === line.name
            const pctPresence = pct ? rowPresence(pct.draft) : 'not_started'
            const hasBreakout = Boolean(brk?.draft.valueText?.trim())
            const pctDisplay =
              pct?.draft.status === 'disclosed' && pct.draft.valueNum != null
                ? `${pct.draft.valueNum}%`
                : '—'

            return (
              <div
                key={norm(line.name)}
                className={`tx-formula__row${open ? ' tx-formula__row--open' : ''}`}
              >
                <button
                  type="button"
                  className="tx-formula__hit"
                  onClick={() => setOpenName(open ? null : line.name)}
                  aria-expanded={open}
                >
                  <span className="tx-formula__name">
                    <span className="tx-formula__name-text">{line.display}</span>
                    {!line.fromLabel ? (
                      <span className="tx-formula__tag">Not on label</span>
                    ) : null}
                    {hasBreakout ? (
                      <span className="tx-formula__tag tx-formula__tag--soft">Breakout</span>
                    ) : null}
                  </span>
                  <span className="tx-formula__amount">{pctDisplay}</span>
                  <span className="tx-formula__status">
                    <span className={presencePillClass(pctPresence)}>
                      {presenceLabel(pctPresence)}
                    </span>
                    <span className="tx-row__chev" aria-hidden>
                      ›
                    </span>
                  </span>
                </button>

                {open && pctField ? (
                  <div className="tx-formula__editor">
                    <AmountBlock
                      field={pctField}
                      subject={line.name}
                      row={pct}
                      canEdit={canEdit}
                      saving={pct != null && savingKey === pct.key}
                      error={pct ? errors[pct.key] ?? null : null}
                      onEnsureRow={onEnsureRow}
                      onChange={onChange}
                      onSave={onSave}
                    />
                    {breakoutField ? (
                      <BreakoutBlock
                        field={breakoutField}
                        subject={line.name}
                        row={brk}
                        canEdit={canEdit}
                        saving={brk != null && savingKey === brk.key}
                        error={brk ? errors[brk.key] ?? null : null}
                        onEnsureRow={onEnsureRow}
                        onChange={onChange}
                        onSave={onSave}
                      />
                    ) : null}
                  </div>
                ) : open && breakoutField ? (
                  <div className="tx-formula__editor">
                    <BreakoutBlock
                      field={breakoutField}
                      subject={line.name}
                      row={brk}
                      canEdit={canEdit}
                      saving={brk != null && savingKey === brk.key}
                      error={brk ? errors[brk.key] ?? null : null}
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
                placeholder="e.g. Aspartame"
                autoFocus
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submitCustom()
                  }
                }}
              />
              <button type="button" className="tx-btn tx-btn--primary" onClick={submitCustom}>
                Add
              </button>
              <button
                type="button"
                className="tx-btn"
                onClick={() => {
                  setShowAdd(false)
                  setCustomName('')
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="tx-add" onClick={() => setShowAdd(true)}>
              Ingredient not on the label
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
