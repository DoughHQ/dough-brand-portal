'use client'

import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import { BrandFields } from './editor/BrandFields'
import { CategoryFields } from './editor/CategoryFields'
import { EditorActions } from './editor/EditorActions'
import { EditorKicker } from './editor/EditorKicker'
import { ImageField } from './editor/ImageField'
import { IngredientsFields } from './editor/IngredientsFields'
import { NameField } from './editor/NameField'
import { NutritionFields } from './editor/NutritionFields'
import { OtherField } from './editor/OtherField'
import { PriceFields } from './editor/PriceFields'
import { useCaseEditor } from './editor/useCaseEditor'
import { VariantPicker } from './editor/VariantPicker'

interface Props {
  row: CorrectionReviewRow
  busy: boolean
  onCancel: () => void
  onSubmit: (value: Record<string, unknown>, skuVariantId: number | null) => void
}

export default function CaseEditor({ row, busy, onCancel, onSubmit }: Props) {
  const {
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
  } = useCaseEditor({ row, busy })

  return (
    <div className="corr-editor">
      <EditorKicker ct={ct} />
      <VariantPicker
        noVariants={noVariants}
        needVariant={needVariant}
        skuVariantId={skuVariantId}
        setSkuVariantId={setSkuVariantId}
        variants={row.variants}
      />

      {ct === 'nutrition_facts' && (
        <NutritionFields draft={draft} setField={setField} hint={hint} />
      )}

      {ct === 'ingredients' && <IngredientsFields draft={draft} setField={setField} />}

      {ct === 'name' && <NameField draft={draft} setField={setField} />}

      {ct === 'brand' && (
        <BrandFields
          draft={draft}
          setDraft={setDraft}
          brandQuery={brandQuery}
          setBrandQuery={setBrandQuery}
          brandHits={brandHits}
        />
      )}

      {ct === 'category' && (
        <CategoryFields
          draft={draft}
          setDraft={setDraft}
          taxQuery={taxQuery}
          setTaxQuery={setTaxQuery}
          taxHits={taxHits}
          taxLoading={taxLoading}
          suggestedHit={suggestedHit}
        />
      )}

      {ct === 'price' && <PriceFields draft={draft} setField={setField} />}

      {ct === 'product_image' && <ImageField draft={draft} setField={setField} />}

      {(ct === 'other' || ct === 'allergens') && (
        <OtherField draft={draft} setField={setField} />
      )}

      <EditorActions
        applyDisabled={applyDisabled}
        applyLabel={applyLabel}
        busy={busy}
        onCancel={onCancel}
        onSubmit={onSubmit}
        cleanPayload={cleanPayload}
        skuVariantId={skuVariantId}
      />
    </div>
  )
}
