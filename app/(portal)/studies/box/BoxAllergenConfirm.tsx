'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase'
import type { BoxFieldRow } from '@/lib/box/types'
import {
  ALLERGEN_CODES,
  ALLERGEN_LABELS,
  isAllergenConfirmed,
  parseAllergenPrefill,
  type AllergenCode,
} from '@/lib/box/allergens'

type Props = {
  row: BoxFieldRow
  onChange: (next: BoxFieldRow) => void
}

function labelList(codes: Iterable<string>): string {
  return [...codes]
    .map((c) => ALLERGEN_LABELS[c as AllergenCode] ?? c)
    .join(', ')
}

function summaryLine(contains: Set<string>, mayContain: Set<string>): string {
  if (contains.size === 0 && mayContain.size === 0) return 'None declared'
  const parts: string[] = []
  if (contains.size > 0) parts.push(`Contains ${labelList(contains)}`)
  if (mayContain.size > 0) parts.push(`May contain ${labelList(mayContain)}`)
  return parts.join(' · ')
}

export default function BoxAllergenConfirm({ row, onChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const confirmed = isAllergenConfirmed(row)
  const contains = new Set(row.allergensContains ?? [])
  const mayContain = new Set(row.allergensMayContain ?? [])
  const status = row.allergensCatalogStatus
  const needsLabelCheck =
    status === 'unknown' ||
    status === 'incomplete' ||
    status === 'varies_by_variant' ||
    status == null
  const showPicker = !confirmed && (editing || needsLabelCheck)

  useEffect(() => {
    if (row.product_id == null || !row.upc?.trim()) return
    if (confirmed) return
    if (row.allergensContains != null && row.allergensMayContain != null) return

    let cancelled = false
    setLoading(true)
    setError(null)
    const supabase = createClient()
    void supabase
      .rpc('get_product_allergen_prefill' as never, {
        p_product_id: row.product_id,
        p_upc: row.upc.trim(),
      } as never)
      .then(({ data, error: rpcError }) => {
        if (cancelled) return
        if (rpcError) {
          setError(rpcError.message)
          setLoading(false)
          return
        }
        const prefill = parseAllergenPrefill(data)
        if (!prefill) {
          setLoading(false)
          return
        }
        onChange({
          ...row,
          allergensContains: prefill.contains,
          allergensMayContain: prefill.may_contain,
          allergensCatalogStatus: prefill.status,
          allergensConfirmed: false,
        })
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // Prefill once per product+upc when lists are still null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.product_id, row.upc])

  function toggle(code: AllergenCode, list: 'contains' | 'may') {
    const nextContains = new Set(row.allergensContains ?? [])
    const nextMay = new Set(row.allergensMayContain ?? [])
    if (list === 'contains') {
      if (nextContains.has(code)) nextContains.delete(code)
      else {
        nextContains.add(code)
        nextMay.delete(code)
      }
    } else {
      if (nextMay.has(code)) nextMay.delete(code)
      else {
        nextMay.add(code)
        nextContains.delete(code)
      }
    }
    onChange({
      ...row,
      allergensContains: [...nextContains],
      allergensMayContain: [...nextMay],
      allergensConfirmed: false,
    })
  }

  function confirm() {
    onChange({
      ...row,
      allergensContains: row.allergensContains ?? [],
      allergensMayContain: row.allergensMayContain ?? [],
      allergensConfirmed: true,
    })
    setEditing(false)
  }

  function startEdit() {
    onChange({ ...row, allergensConfirmed: false })
    setEditing(true)
  }

  if (row.product_id == null || !row.upc?.trim()) return null

  const help =
    status === 'confident'
      ? 'Catalog match — confirm it matches the package.'
      : needsLabelCheck
        ? 'Check the package label. Catalog data is incomplete or varies.'
        : 'Confirm from the package label.'

  if (confirmed) {
    return (
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'var(--sage-soft)',
            border: '1px solid var(--ink-10)',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--ink-70)', lineHeight: 1.4, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>Allergens confirmed</span>
            <span style={{ color: 'var(--ink-50)' }}> · {summaryLine(contains, mayContain)}</span>
          </div>
          <button type="button" className="cb-quiet-action" onClick={startEdit}>
            Edit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-70)', marginBottom: 4 }}>
        Allergens on the package
      </div>
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--ink-40)', margin: 0 }}>Loading catalog allergens…</p>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--ink-80)', lineHeight: 1.4 }}>
            {summaryLine(contains, mayContain)}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--ink-50)' }}>
            {help}
          </p>
        </>
      )}
      {error ? (
        <p style={{ fontSize: 12, color: 'var(--danger, #b42318)', margin: '6px 0 0' }}>{error}</p>
      ) : null}

      {showPicker ? (
        <div style={{ marginTop: 12 }}>
          <ChipGroup
            title="Contains"
            selected={contains}
            onToggle={(code) => toggle(code, 'contains')}
          />
          <ChipGroup
            title="May contain"
            selected={mayContain}
            onToggle={(code) => toggle(code, 'may')}
          />
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <button
          type="button"
          className="cb-btn cb-btn-secondary"
          onClick={confirm}
          disabled={loading}
        >
          Confirm
        </button>
        {!showPicker ? (
          <button type="button" className="cb-quiet-action" onClick={() => setEditing(true)}>
            Edit list
          </button>
        ) : editing ? (
          <button
            type="button"
            className="cb-quiet-action"
            onClick={() => setEditing(false)}
            disabled={needsLabelCheck}
          >
            Hide list
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ChipGroup({
  title,
  selected,
  onToggle,
}: {
  title: string
  selected: Set<string>
  onToggle: (code: AllergenCode) => void
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-50)', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ALLERGEN_CODES.map((code) => {
          const on = selected.has(code)
          return (
            <button
              key={`${title}-${code}`}
              type="button"
              onClick={() => onToggle(code)}
              aria-pressed={on}
              style={{
                ...chip,
                background: on ? 'var(--sage-soft)' : 'var(--white)',
                borderColor: on ? 'var(--sage)' : 'var(--ink-10)',
                color: on ? 'var(--ink-80)' : 'var(--ink-50)',
                fontWeight: on ? 600 : 500,
              }}
            >
              {ALLERGEN_LABELS[code]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const chip: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.2,
  padding: '6px 10px',
  borderRadius: 'var(--cb-radius-pill)',
  border: '1px solid',
  cursor: 'pointer',
}
