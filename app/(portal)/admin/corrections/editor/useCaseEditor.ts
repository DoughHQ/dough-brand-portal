'use client'

import { useEffect, useState } from 'react'
import type { CorrectionReviewRow, TaxonomySearchHit } from '@/lib/corrections.shared'
import { assignSearchSeed, preferredTaxonomyHit } from '@/lib/correctionsCase'
import { searchBrandsAction, searchTaxonomyAction } from '../actions'
import { MIN_TAX_QUERY } from './CategoryFields'
import { NUTRITION_FIELDS } from './NutritionFields'

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

export function useCaseEditor({
  row,
  busy,
}: {
  row: CorrectionReviewRow
  busy: boolean
}) {
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

  return {
    ct,
    draft,
    setDraft,
    setField,
    skuVariantId,
    setSkuVariantId,
    taxQuery,
    setTaxQuery,
    taxHits,
    taxLoading,
    brandQuery,
    setBrandQuery,
    brandHits,
    noVariants,
    needVariant,
    hint,
    suggestedHit,
    applyDisabled,
    applyLabel,
    cleanPayload,
  }
}
