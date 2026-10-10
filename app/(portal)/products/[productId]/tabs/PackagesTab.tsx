'use client'

import { skuLabel } from '@/lib/productMaster/format'
import type { MasterSku, ProductMaster } from '@/lib/productMaster/types'
import { ProductPackagesTab } from './ProductDetailTabPanels'
import { ProposalBadge } from './productMasterBits'
import { SkuBlock } from './SkuBlock'
import type { ProductMasterWrites } from './useProductMasterWrites'

export function PackagesTab({
  master,
  writes,
  canEdit,
  selectedSkuId,
  onSelectSku,
}: {
  master: ProductMaster
  writes: ProductMasterWrites
  canEdit: boolean
  selectedSkuId: number | null
  onSelectSku: (id: number) => void
}) {
  const {
    pendingFields,
    correctionTypes,
    expandedSkus,
    setExpandedSkus,
    showAllNutrients,
    setShowAllNutrients,
    editingMsrp,
    setEditingMsrp,
    msrpDraft,
    setMsrpDraft,
    editingIngredients,
    setEditingIngredients,
    ingredientsDraft,
    setIngredientsDraft,
    editingNutritionKey,
    setEditingNutritionKey,
    nutritionDraft,
    setNutritionDraft,
    saving,
    saveMsrp,
    saveIngredients,
    saveNutritionField,
  } = writes

  const multiSku = master.sku_count >= 2
  const selectedSku =
    master.skus.find((s) => s.sku_variant_id === selectedSkuId) ?? master.skus[0] ?? null
  const skuPending =
    pendingFields.has('nutrition') ||
    pendingFields.has('ingredients') ||
    pendingFields.has('price')

  const renderSkuFields = (sku: MasterSku) => (
    <SkuBlock
      sku={sku}
      hideIdentity
      canEdit={canEdit}
      correctionTypes={correctionTypes}
      multiSku={multiSku}
      showAll={!!showAllNutrients[sku.sku_variant_id]}
      onToggleAll={() =>
        setShowAllNutrients((s) => ({
          ...s,
          [sku.sku_variant_id]: !s[sku.sku_variant_id],
        }))
      }
      editingMsrp={editingMsrp === sku.sku_variant_id}
      msrpDraft={msrpDraft[sku.sku_variant_id] ?? ''}
      onStartMsrp={() => {
        setEditingMsrp(sku.sku_variant_id)
        setMsrpDraft((d) => ({
          ...d,
          [sku.sku_variant_id]: sku.msrp != null ? String(sku.msrp) : '',
        }))
      }}
      onMsrpDraft={(v) => setMsrpDraft((d) => ({ ...d, [sku.sku_variant_id]: v }))}
      onSaveMsrp={() => saveMsrp(sku, msrpDraft[sku.sku_variant_id] ?? '')}
      onCancelMsrp={() => setEditingMsrp(null)}
      editingIngredients={editingIngredients === sku.sku_variant_id}
      ingredientsDraft={ingredientsDraft}
      onStartIngredients={() => {
        setEditingIngredients(sku.sku_variant_id)
        setIngredientsDraft(sku.ingredients?.ingredients_text_raw ?? '')
      }}
      onIngredientsDraft={setIngredientsDraft}
      onSaveIngredients={() => saveIngredients(sku, ingredientsDraft)}
      onCancelIngredients={() => setEditingIngredients(null)}
      editingNutritionKey={editingNutritionKey}
      nutritionDraft={nutritionDraft}
      onStartNutrition={(key, val) => {
        setEditingNutritionKey(`${sku.sku_variant_id}:${key}`)
        setNutritionDraft(val ?? '')
      }}
      onNutritionDraft={setNutritionDraft}
      onSaveNutrition={(key) => saveNutritionField(sku, key, nutritionDraft)}
      onCancelNutrition={() => setEditingNutritionKey(null)}
      saving={saving}
    />
  )

  return (
    <ProductPackagesTab>
      <div className="pm-sku-header">
        <div>
          <h2 className="pm-sku-title">
            SKUs
            {multiSku && <ProposalBadge types={pendingFields} match="nutrition" />}
            {multiSku && <ProposalBadge types={pendingFields} match="ingredients" />}
            {multiSku && <ProposalBadge types={pendingFields} match="price" />}
          </h2>
          <p className="pm-sku-sub">
            {master.sku_count === 0
              ? 'No SKUs associated with this product'
              : `${master.sku_count} SKU${master.sku_count === 1 ? '' : 's'} associated with this product`}
          </p>
        </div>
      </div>

      {master.sku_count === 0 ? (
        <div className="pm-sku-empty">
          <p className="pm-sku-empty-title">No SKUs yet</p>
          <p className="pm-sku-empty-copy">
            About 37% of the catalog has no SKU yet. Adding one is how this product becomes
            measurable.
          </p>
        </div>
      ) : (
        <div className={`pm-sku-list${skuPending ? ' pm-sku-list-pending' : ''}`}>
          {master.skus.map((sku) => {
            const canToggle = multiSku
            const open = !canToggle || (expandedSkus[sku.sku_variant_id] ?? false)
            const isSelected = selectedSku?.sku_variant_id === sku.sku_variant_id
            return (
              <div
                key={sku.sku_variant_id}
                className={`pm-sku-item${isSelected ? ' pm-sku-item-selected' : ''}`}
              >
                {canToggle ? (
                  <button
                    type="button"
                    className="pm-sku-row"
                    aria-expanded={open}
                    onClick={() => {
                      onSelectSku(sku.sku_variant_id)
                      setExpandedSkus((e) => ({
                        ...e,
                        [sku.sku_variant_id]: !open,
                      }))
                    }}
                  >
                    <span className="pm-sku-chevron" aria-hidden>
                      {open ? '⌄' : '›'}
                    </span>
                    <span className="pm-sku-main">
                      <span className="pm-sku-name">{skuLabel(sku)}</span>
                      {sku.barcode ? (
                        <span className="pm-sku-gtin">
                          <span className="pm-sku-gtin-label">GTIN</span>
                          {sku.barcode}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ) : (
                  <div className="pm-sku-row pm-sku-row-static">
                    <span className="pm-sku-main">
                      <span className="pm-sku-name">{skuLabel(sku)}</span>
                      {sku.barcode ? (
                        <span className="pm-sku-gtin">
                          <span className="pm-sku-gtin-label">GTIN</span>
                          {sku.barcode}
                        </span>
                      ) : null}
                    </span>
                  </div>
                )}
                {open && <div className="pm-sku-detail">{renderSkuFields(sku)}</div>}
              </div>
            )
          })}
        </div>
      )}
    </ProductPackagesTab>
  )
}
