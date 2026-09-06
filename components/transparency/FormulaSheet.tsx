'use client'

import { useMemo, useState } from 'react'
import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import { rowPresence, type RowPresence } from '@/lib/transparency/proofChapters'
import {
  displayAllCapsPhrase,
  splitIngredientStatement,
} from '@/app/(portal)/products/[productId]/tabs/compositionPresentation'

export type FormulaLocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

type Props = {
  ingredientStatement: string | null
  pctField: ProofSubMetricRow | null
  breakoutField: ProofSubMetricRow | null
  pctRows: FormulaLocalRow[]
  breakoutRows: FormulaLocalRow[]
  canEdit: boolean
  savingKey: string | null
  errors: Record<string, string>
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onSave: (field: ProofSubMetricRow, row: FormulaLocalRow) => void
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onAddCustomIngredient: (name: string) => void
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function findRow(rows: FormulaLocalRow[], subject: string): FormulaLocalRow | undefined {
  const n = norm(subject)
  return rows.find((r) => norm(r.draft.subjectLabel ?? '') === n)
}

function pillClass(p: RowPresence): string {
  switch (p) {
    case 'published':
      return 'tx-pill tx-pill--public'
    case 'private':
      return 'tx-pill tx-pill--private'
    case 'declined':
      return 'tx-pill tx-pill--declined'
    default:
      return 'tx-pill tx-pill--idle'
  }
}

function presenceCopy(p: RowPresence): string {
  switch (p) {
    case 'published':
      return 'Published'
    case 'private':
      return 'Private'
    case 'declined':
      return 'Not reporting'
    default:
      return '—'
  }
}

type IngredientLine = {
  name: string
  display: string
  fromLabel: boolean
}

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
                    <span className={pillClass(pctPresence)}>{presenceCopy(pctPresence)}</span>
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

function AmountBlock({
  field,
  subject,
  row,
  canEdit,
  saving,
  error,
  onEnsureRow,
  onChange,
  onSave,
}: {
  field: ProofSubMetricRow
  subject: string
  row: FormulaLocalRow | undefined
  canEdit: boolean
  saving: boolean
  error: string | null
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onSave: (field: ProofSubMetricRow, row: FormulaLocalRow) => void
}) {
  const patch = (partial: Partial<DisclosureDraft>) => {
    let key = row?.key
    let base = row?.draft
    if (!key || !base) {
      key = onEnsureRow(field, subject)
      base = blankDraft(field, {
        subjectKind: 'ingredient',
        subjectLabel: subject,
        status: 'disclosed',
      })
    }
    onChange(field.sub_metric_code, key, {
      ...base,
      subjectKind: 'ingredient',
      subjectLabel: subject,
      ...partial,
    })
  }

  return (
    <div className="tx-formula__block">
      <p className="tx-formula__block-title">How much?</p>
      <p className="tx-formula__block-hint">
        Percentage of <strong>{subject}</strong> in the formula. Optional — only disclose what
        you want shoppers to see.
      </p>
      <div className="tx-inline" style={{ marginBottom: 12, maxWidth: 220 }}>
        <input
          type="number"
          step="any"
          min={0}
          max={100}
          className="tx-control"
          disabled={!canEdit}
          placeholder="0"
          value={row?.draft.valueNum ?? ''}
          onChange={(e) => {
            const v = e.target.value === '' ? null : Number(e.target.value)
            patch({ status: 'disclosed', valueNum: v, valueUnit: null })
          }}
        />
        <span className="tx-unit">%</span>
      </div>
      {row ? (
        <>
          <label className="tx-publish" style={{ marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={row.draft.published}
              disabled={!canEdit}
              onChange={(e) => patch({ published: e.target.checked })}
            />
            <span>
              <span className="tx-publish__label">Show amount to shoppers</span>
            </span>
          </label>
          <div className="tx-field">
            <div className="tx-label">As of</div>
            <input
              type="date"
              className="tx-control tx-control--date"
              disabled={!canEdit}
              value={row.draft.asofDate}
              onChange={(e) => patch({ asofDate: e.target.value })}
            />
          </div>
          {canEdit ? (
            <button
              type="button"
              className="tx-btn tx-btn--primary"
              disabled={saving || row.draft.valueNum == null}
              onClick={() => onSave(field, row)}
            >
              {saving ? 'Saving…' : 'Save amount'}
            </button>
          ) : null}
          {error ? <p className="tx-error">{error}</p> : null}
        </>
      ) : (
        <p className="tx-formula__block-hint">Type a percentage to create a disclosure.</p>
      )}
    </div>
  )
}

function BreakoutBlock({
  field,
  subject,
  row,
  canEdit,
  saving,
  error,
  onEnsureRow,
  onChange,
  onSave,
}: {
  field: ProofSubMetricRow
  subject: string
  row: FormulaLocalRow | undefined
  canEdit: boolean
  saving: boolean
  error: string | null
  onEnsureRow: (field: ProofSubMetricRow, subjectLabel: string) => string
  onChange: (subMetricCode: string, key: string, draft: DisclosureDraft) => void
  onSave: (field: ProofSubMetricRow, row: FormulaLocalRow) => void
}) {
  const patch = (partial: Partial<DisclosureDraft>) => {
    let key = row?.key
    let base = row?.draft
    if (!key || !base) {
      key = onEnsureRow(field, subject)
      base = blankDraft(field, {
        subjectKind: 'ingredient',
        subjectLabel: subject,
        status: 'disclosed',
      })
    }
    onChange(field.sub_metric_code, key, {
      ...base,
      subjectKind: 'ingredient',
      subjectLabel: subject,
      ...partial,
    })
  }

  return (
    <div className="tx-formula__block">
      <p className="tx-formula__block-title">What’s inside?</p>
      <p className="tx-formula__block-hint">
        Break out <strong>{subject}</strong> when it’s a blend the label doesn’t fully explain.
      </p>
      <textarea
        className="tx-control tx-formula__textarea"
        rows={3}
        disabled={!canEdit}
        placeholder="e.g. orange oil, vanilla extract"
        value={row?.draft.valueText ?? ''}
        onChange={(e) =>
          patch({ status: 'disclosed', valueText: e.target.value || null })
        }
      />
      {row ? (
        <>
          <label className="tx-publish" style={{ margin: '12px 0' }}>
            <input
              type="checkbox"
              checked={row.draft.published}
              disabled={!canEdit}
              onChange={(e) => patch({ published: e.target.checked })}
            />
            <span>
              <span className="tx-publish__label">Show breakout to shoppers</span>
            </span>
          </label>
          <div className="tx-field">
            <div className="tx-label">As of</div>
            <input
              type="date"
              className="tx-control tx-control--date"
              disabled={!canEdit}
              value={row.draft.asofDate}
              onChange={(e) => patch({ asofDate: e.target.value })}
            />
          </div>
          {canEdit ? (
            <button
              type="button"
              className="tx-btn tx-btn--primary"
              disabled={saving || !row.draft.valueText?.trim()}
              onClick={() => onSave(field, row)}
            >
              {saving ? 'Saving…' : 'Save breakout'}
            </button>
          ) : null}
          {error ? <p className="tx-error">{error}</p> : null}
        </>
      ) : null}
    </div>
  )
}
