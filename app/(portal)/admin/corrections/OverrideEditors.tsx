'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import type { CorrectionReviewRow, TaxonomySearchHit } from '@/lib/corrections.shared'
import { assignSearchSeed, preferredTaxonomyHit } from '@/lib/correctionsCase'
import { searchBrandsAction, searchTaxonomyAction } from './actions'

const NUTRITION_FIELDS: Array<{ key: string; label: string; step?: string }> = [
  { key: 'serving_size_value', label: 'Serving size' },
  { key: 'serving_size_uom', label: 'UOM' },
  { key: 'servings_per_container', label: 'Servings/container' },
  { key: 'calories', label: 'Calories' },
  { key: 'total_fat_g', label: 'Total fat (g)' },
  { key: 'saturated_fat_g', label: 'Sat fat (g)' },
  { key: 'trans_fat_g', label: 'Trans fat (g)' },
  { key: 'cholesterol_mg', label: 'Cholesterol (mg)' },
  { key: 'sodium_mg', label: 'Sodium (mg)' },
  { key: 'total_carbs_g', label: 'Carbs (g)' },
  { key: 'dietary_fiber_g', label: 'Fiber (g)' },
  { key: 'total_sugars_g', label: 'Sugars (g)' },
  { key: 'added_sugars_g', label: 'Added sugars (g)' },
  { key: 'protein_g', label: 'Protein (g)' },
  { key: 'vitamin_d_mcg', label: 'Vitamin D (mcg)' },
  { key: 'calcium_mg', label: 'Calcium (mg)' },
  { key: 'iron_mg', label: 'Iron (mg)' },
  { key: 'potassium_mg', label: 'Potassium (mg)' },
  { key: 'vitamin_a_mcg', label: 'Vitamin A (mcg)' },
  { key: 'vitamin_c_mg', label: 'Vitamin C (mg)' },
]

function seedValue(row: CorrectionReviewRow): Record<string, unknown> {
  const ct = (row.correction_type ?? '').toLowerCase()
  if (ct === 'nutrition_facts' || ct === 'ingredients') {
    return { ...(row.extracted_value ?? {}) }
  }
  if (ct === 'category') {
    const id = row.proposed_taxonomy_node_id ?? row.proposed_value?.taxonomy_node_id
    return {
      taxonomy_node_id: id ?? null,
      _label: row.proposed_category_label ?? '',
      _path: row.proposed_category_path ?? '',
    }
  }
  if (ct === 'name') {
    return { name: row.proposed_value?.name ?? row.proposed_value?.product_name_display ?? '' }
  }
  if (ct === 'brand') {
    return {
      brand_name: row.proposed_value?.brand_name ?? row.proposed_value?.brand ?? '',
      brand_id: row.proposed_value?.brand_id ?? null,
    }
  }
  if (ct === 'price') {
    return {
      price_amount: row.proposed_price_amount ?? row.proposed_value?.price_amount ?? '',
      price_store: row.proposed_price_store ?? row.proposed_value?.store ?? '',
      price_unit: row.proposed_price_unit ?? row.proposed_value?.unit ?? '',
    }
  }
  if (ct === 'product_image') {
    return {
      image_url: row.proposed_value?.image_url ?? row.evidence_image_url ?? '',
    }
  }
  if (ct === 'other') {
    return { note: row.other_category_description ?? row.proposed_value?.note ?? '' }
  }
  return { ...(row.proposed_value ?? {}) }
}

function plausibilityHint(draft: Record<string, unknown>): string | null {
  const basis = String(draft.basis_type ?? '')
  const uom = String(draft.serving_size_uom ?? '').toLowerCase()
  if (!['g', 'grm', 'gm', 'gram', 'grams'].includes(uom)) return null
  const fat = Number(draft.total_fat_g ?? 0)
  const carbs = Number(draft.total_carbs_g ?? 0)
  const protein = Number(draft.protein_g ?? 0)
  const macro = fat + carbs + protein
  const den =
    basis === 'per_100g' || basis === 'per_100ml'
      ? 100
      : basis === 'per_serving'
        ? Number(draft.serving_size_value)
        : NaN
  if (!Number.isFinite(den) || den <= 0) return null
  if (macro > den * 1.05) {
    return `These values sum to ${macro.toFixed(1)} g but the ${basis === 'per_serving' ? 'serving' : 'basis'} is ${den} g. Are these per-100g?`
  }
  return null
}

interface Props {
  row: CorrectionReviewRow
  busy: boolean
  onCancel: () => void
  onSubmit: (value: Record<string, unknown>, skuVariantId: number | null) => void
}

const MIN_TAX_QUERY = 2

export default function OverrideEditors({ row, busy, onCancel, onSubmit }: Props) {
  const ct = (row.correction_type ?? 'other').toLowerCase()
  const [draft, setDraft] = useState<Record<string, unknown>>(() => seedValue(row))
  const [skuVariantId, setSkuVariantId] = useState<number | null>(
    row.variants.length === 1 ? row.variants[0].sku_variant_id : null
  )
  const [taxQuery, setTaxQuery] = useState(() => assignSearchSeed(row))
  const [taxHits, setTaxHits] = useState<TaxonomySearchHit[]>([])
  const [taxLoading, setTaxLoading] = useState(false)
  const [brandQuery, setBrandQuery] = useState('')
  const [brandHits, setBrandHits] = useState<Array<{ brand_id: number; brand_name: string }>>([])

  useEffect(() => {
    setDraft(seedValue(row))
    setSkuVariantId(row.variants.length === 1 ? row.variants[0].sku_variant_id : null)
    setTaxQuery(assignSearchSeed(row))
    setTaxHits([])
    // Reset when the case changes or an extraction draft arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- row identity is id + extracted_at
  }, [row.id, row.extracted_at])

  useEffect(() => {
    if (ct !== 'category') return
    const q = taxQuery.trim()
    if (q.length < MIN_TAX_QUERY) {
      setTaxHits([])
      setTaxLoading(false)
      return
    }
    setTaxLoading(true)
    let cancelled = false
    const t = window.setTimeout(() => {
      void searchTaxonomyAction(q).then((hits) => {
        if (cancelled) return
        setTaxHits(hits)
        setTaxLoading(false)
      })
    }, 200)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [taxQuery, ct])

  useEffect(() => {
    if (ct !== 'brand') return
    const t = window.setTimeout(() => {
      void searchBrandsAction(brandQuery).then(setBrandHits)
    }, 200)
    return () => window.clearTimeout(t)
  }, [brandQuery, ct])

  const setField = (key: string, value: unknown) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const needVariant = (ct === 'nutrition_facts' || ct === 'ingredients') && row.variant_count > 1
  const noVariants = (ct === 'nutrition_facts' || ct === 'ingredients') && row.variant_count === 0
  const hint = ct === 'nutrition_facts' ? plausibilityHint(draft) : null
  const categoryMissing = ct === 'category' && draft.taxonomy_node_id == null
  const applyDisabled =
    busy || noVariants || (needVariant && skuVariantId == null) || Boolean(hint) || categoryMissing
  const suggestedHit = ct === 'category' ? preferredTaxonomyHit(taxHits, taxQuery) : null
  const applyLabel =
    busy
      ? 'Applying…'
      : ct === 'category' && draft._label
        ? `File in ${String(draft._label)}`
        : ct === 'category'
          ? 'File in this category'
          : 'Apply these values'

  const cleanPayload = (): Record<string, unknown> => {
    if (ct === 'category') {
      return { taxonomy_node_id: draft.taxonomy_node_id }
    }
    if (ct === 'brand') {
      return draft.brand_id
        ? { brand_id: draft.brand_id }
        : { brand_name: draft.brand_name }
    }
    if (ct === 'name') return { name: String(draft.name ?? '').trim() }
    if (ct === 'ingredients') {
      return {
        ingredients_text_raw: draft.ingredients_text_raw ?? draft.ingredients_raw ?? '',
        allergens_contains_text_raw: draft.allergens_contains_text_raw ?? null,
        allergens_may_contain_text_raw: draft.allergens_may_contain_text_raw ?? null,
      }
    }
    if (ct === 'nutrition_facts') {
      const out: Record<string, unknown> = { basis_type: draft.basis_type ?? 'per_serving' }
      for (const f of NUTRITION_FIELDS) {
        const v = draft[f.key]
        if (v === '' || v == null) out[f.key] = null
        else if (f.key === 'serving_size_uom') out[f.key] = v
        else out[f.key] = typeof v === 'number' ? v : Number(v)
      }
      return out
    }
    if (ct === 'price') {
      return {
        price_amount: Number(draft.price_amount),
        price_store: draft.price_store || null,
        price_unit: draft.price_unit || null,
      }
    }
    if (ct === 'product_image') return { image_url: draft.image_url }
    if (ct === 'other') return { note: String(draft.note ?? '').slice(0, 500) }
    return draft
  }

  return (
    <div style={{
      padding: '16px 20px 20px',
      borderTop: '1px solid var(--ink-10)',
      background: 'rgba(45,106,79,0.03)',
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-30)',
        marginBottom: 12,
      }}>
        {ct === 'category'
          ? 'Pick the Dough category'
          : ct === 'nutrition_facts' || ct === 'ingredients'
            ? 'Review the draft, then apply'
            : 'Enter the correct value'}
      </div>

      {noVariants && (
        <div style={warnStyle}>This product has no SKU variants — nutrition/ingredients cannot be applied.</div>
      )}

      {needVariant && (
        <label style={labelStyle}>
          Variant
          <select
            value={skuVariantId ?? ''}
            onChange={(e) => setSkuVariantId(e.target.value ? Number(e.target.value) : null)}
            style={inputStyle}
          >
            <option value="">Select variant…</option>
            {row.variants.map((v) => (
              <option key={v.sku_variant_id} value={v.sku_variant_id}>{v.label}</option>
            ))}
          </select>
        </label>
      )}

      {ct === 'nutrition_facts' && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-50)', marginBottom: 8 }}>
              Basis <span style={{ color: '#B91C1C' }}>*</span> — required. Confirm against the photo.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['per_serving', 'per_100g', 'per_100ml'] as const).map((b) => {
                const selected = draft.basis_type === b
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setField('basis_type', b)}
                    style={{
                      ...chipStyle,
                      border: selected ? '1px solid var(--sage)' : '1px solid var(--ink-10)',
                      background: selected ? 'rgba(45,106,79,0.12)' : 'white',
                      color: selected ? 'var(--sage)' : 'var(--ink-50)',
                    }}
                  >
                    {b === 'per_serving' ? 'Per serving' : b === 'per_100g' ? 'Per 100g' : 'Per 100ml'}
                  </button>
                )
              })}
            </div>
          </div>
          {hint && <div style={warnStyle}>{hint}</div>}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10,
          }}>
            {NUTRITION_FIELDS.map((f) => (
              <label key={f.key} style={labelStyle}>
                {f.label}
                <input
                  value={draft[f.key] == null ? '' : String(draft[f.key])}
                  onChange={(e) => setField(f.key, e.target.value)}
                  style={inputStyle}
                />
              </label>
            ))}
          </div>
        </>
      )}

      {ct === 'ingredients' && (
        <>
          <label style={labelStyle}>
            Ingredients (verbatim)
            <textarea
              value={String(draft.ingredients_text_raw ?? draft.ingredients_raw ?? '')}
              onChange={(e) => setField('ingredients_text_raw', e.target.value)}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </label>
          <label style={labelStyle}>
            Contains
            <input
              value={String(draft.allergens_contains_text_raw ?? '')}
              onChange={(e) => setField('allergens_contains_text_raw', e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            May contain
            <input
              value={String(draft.allergens_may_contain_text_raw ?? '')}
              onChange={(e) => setField('allergens_may_contain_text_raw', e.target.value)}
              style={inputStyle}
            />
          </label>
        </>
      )}

      {ct === 'name' && (
        <label style={labelStyle}>
          Product name
          <input
            value={String(draft.name ?? '')}
            onChange={(e) => setField('name', e.target.value)}
            style={inputStyle}
          />
        </label>
      )}

      {ct === 'brand' && (
        <>
          <label style={labelStyle}>
            Search existing brands
            <input
              value={brandQuery}
              onChange={(e) => setBrandQuery(e.target.value)}
              placeholder="Type to search — brands are never auto-created"
              style={inputStyle}
            />
          </label>
          {draft.brand_id != null && (
            <div style={{ fontSize: 13, color: 'var(--sage)', marginBottom: 8 }}>
              Selected: {String(draft.brand_name)} (#{String(draft.brand_id)})
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {brandHits.map((b) => (
              <button
                key={b.brand_id}
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, brand_id: b.brand_id, brand_name: b.brand_name }))
                  setBrandQuery(b.brand_name)
                }}
                style={hitStyle}
              >
                {b.brand_name}
              </button>
            ))}
          </div>
        </>
      )}

      {ct === 'category' && (
        <>
          <label style={labelStyle}>
            Search categories
            <input
              value={taxQuery}
              onChange={(e) => setTaxQuery(e.target.value)}
              placeholder="Search by name or path…"
              style={inputStyle}
              autoFocus
            />
          </label>
          {draft.taxonomy_node_id != null && (
            <div style={{ fontSize: 13, color: 'var(--sage)', marginBottom: 8, fontWeight: 600 }}>
              Filing in {String(draft._label || draft.taxonomy_node_id)}
              {draft._path ? (
                <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2, fontWeight: 400 }}>
                  {String(draft._path).replace(/>/g, ' · ')}
                </div>
              ) : null}
            </div>
          )}
          {ct === 'category' && draft.taxonomy_node_id == null ? (
            <div style={{ fontSize: 12, color: 'var(--ink-30)', marginBottom: 8 }}>
              Pick a result. Nothing is filed until you do.
            </div>
          ) : null}
          {taxQuery.trim().length > 0 && taxQuery.trim().length < MIN_TAX_QUERY ? (
            <div style={{ fontSize: 12, color: 'var(--ink-30)', marginBottom: 8 }}>
              Type at least 2 characters.
            </div>
          ) : null}
          {taxLoading ? (
            <div style={{ fontSize: 12, color: 'var(--ink-30)', marginBottom: 8 }}>Searching…</div>
          ) : null}
          {!taxLoading && taxQuery.trim().length >= MIN_TAX_QUERY && taxHits.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--ink-30)', marginBottom: 8 }}>
              No matching categories.
            </div>
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, maxHeight: 220, overflow: 'auto' }}>
            {taxHits.map((n) => {
              const selected = Number(draft.taxonomy_node_id) === n.taxonomy_node_id
              const suggested = suggestedHit?.taxonomy_node_id === n.taxonomy_node_id
              return (
                <button
                  key={n.taxonomy_node_id}
                  type="button"
                  onClick={() => {
                    setDraft({
                      taxonomy_node_id: n.taxonomy_node_id,
                      _label: n.node_name_display,
                      _path: n.path_names_csv,
                    })
                  }}
                  style={{
                    ...hitStyle,
                    border: selected ? '1px solid var(--sage)' : '1px solid var(--ink-10)',
                    background: selected ? 'rgba(45,106,79,0.08)' : 'white',
                  }}
                >
                  <div>
                    {n.node_name_display}
                    {suggested && !selected ? (
                      <span style={{
                        marginLeft: 8,
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-30)',
                      }}>
                        Suggested
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>
                    {(n.path_names_csv ?? '').replace(/>/g, ' · ')}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {ct === 'price' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <label style={labelStyle}>
            Amount
            <input value={String(draft.price_amount ?? '')} onChange={(e) => setField('price_amount', e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Store
            <input value={String(draft.price_store ?? '')} onChange={(e) => setField('price_store', e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Unit
            <input value={String(draft.price_unit ?? '')} onChange={(e) => setField('price_unit', e.target.value)} style={inputStyle} />
          </label>
        </div>
      )}

      {ct === 'product_image' && (
        <label style={labelStyle}>
          Image URL
          <input
            value={String(draft.image_url ?? '')}
            onChange={(e) => setField('image_url', e.target.value)}
            style={inputStyle}
          />
        </label>
      )}

      {(ct === 'other' || ct === 'allergens') && (
        <label style={labelStyle}>
          Correction text
          <textarea
            value={String(draft.note ?? draft.value ?? '')}
            onChange={(e) => setField('note', e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          type="button"
          disabled={applyDisabled}
          onClick={() => onSubmit(cleanPayload(), skuVariantId)}
          style={{
            flex: 1,
            padding: '11px 16px',
            borderRadius: 'var(--r-sm)',
            border: 'none',
            background: applyDisabled ? 'var(--ink-10)' : 'var(--sage)',
            color: applyDisabled ? 'var(--ink-30)' : 'white',
            fontSize: 13,
            fontWeight: 500,
            cursor: applyDisabled ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {applyLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          style={{
            padding: '11px 16px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--ink-10)',
            background: 'transparent',
            color: 'var(--ink-50)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 12,
  color: 'var(--ink-50)',
  marginBottom: 10,
}

const inputStyle: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--ink-10)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  color: 'var(--ink)',
  background: 'white',
}

const chipStyle: CSSProperties = {
  fontSize: 12,
  padding: '6px 12px',
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
}

const hitStyle: CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--ink-10)',
  background: 'white',
  cursor: 'pointer',
  fontSize: 13,
  color: 'var(--ink)',
  fontFamily: 'var(--font-sans)',
}

const warnStyle: CSSProperties = {
  padding: '10px 12px',
  marginBottom: 12,
  borderRadius: 8,
  background: 'rgba(192,120,24,0.1)',
  border: '1px solid rgba(192,120,24,0.25)',
  fontSize: 13,
  color: 'var(--amber)',
  lineHeight: 1.45,
}
