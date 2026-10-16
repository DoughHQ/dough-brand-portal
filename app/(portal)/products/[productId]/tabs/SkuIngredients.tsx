'use client'

import type { CSSProperties } from 'react'
import { EvidenceRungChip } from '@/components/productMaster/EvidenceRungChip'
import { SupportLink } from '@/components/productMaster/ComingSoonStub'
import { bodyText, button, caption, inputStyle as masterInput } from '@/lib/productMaster/styles'
import type { MasterSku } from '@/lib/productMaster/types'
import { ProposalBadge } from './productMasterBits'
import { PRODUCT_NAME } from '@/lib/brand'

const muted: CSSProperties = { ...caption }
const secondaryBtn: CSSProperties = { ...button }
const inputStyle: CSSProperties = { ...masterInput }

export function SkuIngredients({
  sku,
  canEdit,
  correctionTypes,
  multiSku,
  editingIngredients,
  ingredientsDraft,
  onStartIngredients,
  onIngredientsDraft,
  onSaveIngredients,
  onCancelIngredients,
  saving,
}: {
  sku: MasterSku
  canEdit: boolean
  correctionTypes: Set<string>
  multiSku: boolean
  editingIngredients: boolean
  ingredientsDraft: string
  onStartIngredients: () => void
  onIngredientsDraft: (v: string) => void
  onSaveIngredients: () => void
  onCancelIngredients: () => void
  saving: boolean
}) {
  const ing = sku.ingredients
  return (
    <div>
      <div style={{ ...bodyText, fontWeight: 500, marginBottom: 8 }}>
        Ingredients
        {!multiSku && <ProposalBadge types={correctionTypes} match="ingredients" />}
        {ing && <EvidenceRungChip rung={ing.evidence_rung} />}
      </div>
      {!ing ? (
        <p style={muted}>No ingredients on file.</p>
      ) : (
        <>
          {ing.locked && (
            <p style={{ ...muted, marginBottom: 8 }}>
              🔒 {PRODUCT_NAME} verified this against the label.{' '}
              <SupportLink subject={`Locked ingredients — SKU ${sku.sku_variant_id}`}>
                Contact us to change it
              </SupportLink>
              .
            </p>
          )}
          {editingIngredients && !ing.locked ? (
            <div>
              <textarea
                value={ingredientsDraft}
                onChange={(e) => onIngredientsDraft(e.target.value)}
                rows={5}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" onClick={onSaveIngredients} disabled={saving} style={secondaryBtn}>
                  Save
                </button>
                <button type="button" onClick={onCancelIngredients} style={secondaryBtn}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={!canEdit || ing.locked}
              onClick={onStartIngredients}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                fontSize: 15,
                lineHeight: 1.6,
                color: 'var(--ink)',
                cursor: canEdit && !ing.locked ? 'pointer' : 'default',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {ing.ingredients_text_raw || (canEdit && !ing.locked ? 'Add ingredients' : '—')}
            </button>
          )}
          {(ing.allergens_contains?.length || ing.allergens_may_contain?.length) ? (
            <p style={{ ...muted, marginTop: 8 }}>
              {ing.allergens_contains?.length
                ? `Contains: ${ing.allergens_contains.join(', ')}`
                : null}
              {ing.allergens_may_contain?.length
                ? `${ing.allergens_contains?.length ? ' · ' : ''}May contain: ${ing.allergens_may_contain.join(', ')}`
                : null}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
