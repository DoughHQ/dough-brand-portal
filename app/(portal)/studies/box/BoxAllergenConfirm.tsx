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

export default function BoxAllergenConfirm({ row, onChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmed = isAllergenConfirmed(row)
  const contains = new Set(row.allergensContains ?? [])
  const mayContain = new Set(row.allergensMayContain ?? [])

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
  }

  function edit() {
    onChange({ ...row, allergensConfirmed: false })
  }

  if (row.product_id == null || !row.upc?.trim()) return null

  const status = row.allergensCatalogStatus
  const statusLabel =
    status === 'confident'
      ? 'Catalog match — still confirm against the label'
      : status === 'unknown' || status === 'incomplete' || status === 'varies_by_variant'
        ? `Catalog ${status.replace(/_/g, ' ')} — confirm from the package`
        : 'Confirm from the package label'

  return (
    <div style={{ marginTop: 14, maxWidth: 520 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-70)', marginBottom: 6 }}>
        Allergens on the package
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-50)', margin: '0 0 10px', lineHeight: 1.45 }}>
        {statusLabel}. Empty lists mean declared none.
      </p>
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--ink-40)', margin: 0 }}>Loading catalog allergens…</p>
      ) : null}
      {error ? (
        <p style={{ fontSize: 12, color: 'var(--danger, #b42318)', margin: '0 0 8px' }}>{error}</p>
      ) : null}

      {confirmed ? (
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
          <div style={{ fontSize: 13, color: 'var(--ink-70)', lineHeight: 1.4 }}>
            Confirmed
            {contains.size === 0 && mayContain.size === 0
              ? ' · none declared'
              : null}
            {contains.size > 0
              ? ` · contains ${[...contains].map((c) => ALLERGEN_LABELS[c as AllergenCode] ?? c).join(', ')}`
              : null}
            {mayContain.size > 0
              ? ` · may contain ${[...mayContain].map((c) => ALLERGEN_LABELS[c as AllergenCode] ?? c).join(', ')}`
              : null}
          </div>
          <button type="button" className="cb-quiet-action" onClick={edit}>
            Edit
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
            {ALLERGEN_CODES.map((code) => (
              <div
                key={code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  color: 'var(--ink-70)',
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>{ALLERGEN_LABELS[code]}</span>
                <label style={chipLabel}>
                  <input
                    type="checkbox"
                    checked={contains.has(code)}
                    onChange={() => toggle(code, 'contains')}
                  />
                  Contains
                </label>
                <label style={chipLabel}>
                  <input
                    type="checkbox"
                    checked={mayContain.has(code)}
                    onChange={() => toggle(code, 'may')}
                  />
                  May contain
                </label>
              </div>
            ))}
          </div>
          <button type="button" className="cb-btn cb-btn-secondary" onClick={confirm}>
            Confirm allergens from label
          </button>
        </>
      )}
    </div>
  )
}

const chipLabel: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  color: 'var(--ink-50)',
  whiteSpace: 'nowrap',
}
