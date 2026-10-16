'use client'

import type { CSSProperties } from 'react'
import { caption } from '@/lib/productMaster/styles'
import { skuLabel } from '@/lib/productMaster/format'
import type { MasterSku } from '@/lib/productMaster/types'
import { SkuIngredients } from './SkuIngredients'
import { SkuMsrpField } from './SkuMsrpField'
import { SkuNutrition } from './SkuNutrition'

const muted: CSSProperties = { ...caption }

export function SkuBlock({
  sku,
  canEdit,
  correctionTypes,
  multiSku,
  showAll,
  onToggleAll,
  editingMsrp,
  msrpDraft,
  onStartMsrp,
  onMsrpDraft,
  onSaveMsrp,
  onCancelMsrp,
  editingIngredients,
  ingredientsDraft,
  onStartIngredients,
  onIngredientsDraft,
  onSaveIngredients,
  onCancelIngredients,
  editingNutritionKey,
  nutritionDraft,
  onStartNutrition,
  onNutritionDraft,
  onSaveNutrition,
  onCancelNutrition,
  saving,
  hideIdentity,
}: {
  sku: MasterSku
  canEdit: boolean
  correctionTypes: Set<string>
  multiSku: boolean
  showAll: boolean
  onToggleAll: () => void
  editingMsrp: boolean
  msrpDraft: string
  onStartMsrp: () => void
  onMsrpDraft: (v: string) => void
  onSaveMsrp: () => void
  onCancelMsrp: () => void
  editingIngredients: boolean
  ingredientsDraft: string
  onStartIngredients: () => void
  onIngredientsDraft: (v: string) => void
  onSaveIngredients: () => void
  onCancelIngredients: () => void
  editingNutritionKey: string | null
  nutritionDraft: string
  onStartNutrition: (key: string, val: string | null) => void
  onNutritionDraft: (v: string) => void
  onSaveNutrition: (key: string) => void
  onCancelNutrition: () => void
  saving: boolean
  hideIdentity?: boolean
}) {
  return (
    <div>
      {!hideIdentity && (
        <div style={{ ...muted, marginBottom: 10 }}>
          {skuLabel(sku)}
          {sku.barcode ? ` · ${sku.barcode}` : ''}
        </div>
      )}

      {/* MSRP on package row */}
      <SkuMsrpField
        sku={sku}
        canEdit={canEdit}
        correctionTypes={correctionTypes}
        multiSku={multiSku}
        editingMsrp={editingMsrp}
        msrpDraft={msrpDraft}
        onStartMsrp={onStartMsrp}
        onMsrpDraft={onMsrpDraft}
        onSaveMsrp={onSaveMsrp}
        onCancelMsrp={onCancelMsrp}
        saving={saving}
      />

      {/* Nutrition */}
      <SkuNutrition
        sku={sku}
        canEdit={canEdit}
        correctionTypes={correctionTypes}
        multiSku={multiSku}
        showAll={showAll}
        onToggleAll={onToggleAll}
        editingNutritionKey={editingNutritionKey}
        nutritionDraft={nutritionDraft}
        onStartNutrition={onStartNutrition}
        onNutritionDraft={onNutritionDraft}
        onSaveNutrition={onSaveNutrition}
        onCancelNutrition={onCancelNutrition}
      />

      {/* Ingredients */}
      <SkuIngredients
        sku={sku}
        canEdit={canEdit}
        correctionTypes={correctionTypes}
        multiSku={multiSku}
        editingIngredients={editingIngredients}
        ingredientsDraft={ingredientsDraft}
        onStartIngredients={onStartIngredients}
        onIngredientsDraft={onIngredientsDraft}
        onSaveIngredients={onSaveIngredients}
        onCancelIngredients={onCancelIngredients}
        saving={saving}
      />
    </div>
  )
}
