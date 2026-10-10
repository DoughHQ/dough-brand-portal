'use client'

import { EvidenceRungChip } from '@/components/productMaster/EvidenceRungChip'
import { SupportLink } from '@/components/productMaster/ComingSoonStub'
import type { MasterSku, ProductMaster } from '@/lib/productMaster/types'
import {
  activeDietaryFlags,
  dietaryContainsItems,
  extendedNutrientRows,
  MACRO_ROWS,
  MICRO_ROWS,
  nutritionSummary,
  presentRows,
  servingRow,
  skuHasIngredientStatement,
  skuHasNutritionFacts,
  splitIngredientStatement,
  displayAllCapsPhrase,
} from './compositionPresentation'
import { ProductNutritionTab } from './ProductDetailTabPanels'
import { ProposalBadge } from './productMasterBits'

export function NutritionTab({
  master,
  selectedSku,
  pendingFields,
}: {
  master: ProductMaster
  selectedSku: MasterSku | null
  pendingFields: Set<string>
}) {
  const ingredientSkus =
    selectedSku && skuHasIngredientStatement(selectedSku) ? [selectedSku] : []
  const nutritionSkus =
    selectedSku && skuHasNutritionFacts(selectedSku) ? [selectedSku] : []
  const showDietaryCard =
    master.dietary != null || (ingredientSkus.length === 0 && nutritionSkus.length === 0)
  const compositionSplit = ingredientSkus.length > 0 && showDietaryCard

  return (
    <ProductNutritionTab>
      <div className="pm-comp-header">
        <h2 className="pm-comp-title">Ingredients & nutrition</h2>
        <p className="pm-comp-sub">
          Product composition, nutrition, and dietary information.
        </p>
      </div>
      <div className={compositionSplit ? 'pm-comp-grid' : 'pm-comp-stack'}>
        {ingredientSkus.length > 0 && (
          <section className="pm-comp-card">
            <h3 className="pm-comp-heading">
              Ingredients
              <ProposalBadge types={pendingFields} match="ingredients" />
            </h3>
            {ingredientSkus.map((sku) => {
              const ing = sku.ingredients
              if (!ing?.ingredients_text_raw) return null
              return (
                <div key={sku.sku_variant_id} className="pm-comp-sku">
                  <ul className="pm-comp-ing-list">
                    {splitIngredientStatement(ing.ingredients_text_raw).map((item, i) => (
                      <li key={`${sku.sku_variant_id}-${i}`}>{displayAllCapsPhrase(item)}</li>
                    ))}
                  </ul>
                  {ing.locked && (
                    <p className="pm-comp-locked">
                      Dough verified this against the label.{' '}
                      <SupportLink subject={`Locked ingredients — SKU ${sku.sku_variant_id}`}>
                        Contact us to change it
                      </SupportLink>
                      .
                    </p>
                  )}
                  {ing.allergens_contains?.length || ing.allergens_may_contain?.length ? (
                    <p className="pm-comp-allergens">
                      {ing.allergens_contains?.length
                        ? `Contains: ${ing.allergens_contains.join(', ')}`
                        : null}
                      {ing.allergens_may_contain?.length
                        ? `${ing.allergens_contains?.length ? ' · ' : ''}May contain: ${ing.allergens_may_contain.join(', ')}`
                        : null}
                    </p>
                  ) : null}
                  <div className="pm-comp-rung">
                    <EvidenceRungChip rung={ing.evidence_rung} />
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {showDietaryCard && (
          <section
            className={`pm-comp-card pm-comp-dietary${pendingFields.has('allergens') ? ' pm-comp-card-pending' : ''}`}
          >
            <h3 className="pm-comp-heading">
              Dietary & allergens
              <ProposalBadge types={pendingFields} match="allergens" />
            </h3>
            {!master.dietary ? (
              <p className="pm-comp-empty">No dietary flags on file.</p>
            ) : (
              <>
                <div className="pm-comp-flags">
                  {activeDietaryFlags(master.dietary).map((flag) => (
                    <span key={flag.key} className="pm-comp-flag">
                      {flag.label}
                    </span>
                  ))}
                  <EvidenceRungChip rung={master.dietary.evidence_rung} />
                </div>
                {dietaryContainsItems(master.dietary).length > 0 && (
                  <div className="pm-comp-contains">
                    <p className="pm-comp-label">Contains</p>
                    <p className="pm-comp-contains-value">
                      {dietaryContainsItems(master.dietary).join(', ')}
                    </p>
                  </div>
                )}
                <p className="pm-comp-note">Read-only — no write path for dietary flags yet.</p>
              </>
            )}
          </section>
        )}

        {nutritionSkus.length > 0 && (
          <section className="pm-comp-card pm-comp-nutrition">
            <h3 className="pm-comp-heading">
              Nutrition
              <ProposalBadge types={pendingFields} match="nutrition" />
            </h3>
            {nutritionSkus.map((sku) => {
              const n = sku.nutrition
              if (!n) return null
              const summary = nutritionSummary(n)
              const serving = servingRow(n)
              const macros = presentRows(
                n,
                summary.length > 0
                  ? MACRO_ROWS.filter(
                      (def) =>
                        !['calories', 'protein_g', 'total_carbs_g', 'total_fat_g'].includes(def.key)
                    )
                  : MACRO_ROWS
              )
              const micros = presentRows(n, MICRO_ROWS)
              const extra = extendedNutrientRows(n)
              const mainRows = serving ? [serving, ...macros] : macros
              return (
                <div key={sku.sku_variant_id} className="pm-comp-sku">
                  {n.locked && (
                    <p className="pm-comp-locked">
                      Dough verified this against the label.{' '}
                      <SupportLink subject={`Locked nutrition — SKU ${sku.sku_variant_id}`}>
                        Contact us to change it
                      </SupportLink>
                      .
                    </p>
                  )}
                  {summary.length > 0 && (
                    <dl className="pm-comp-summary">
                      {summary.map((row) => (
                        <div key={row.label} className="pm-comp-summary-item">
                          <dt>{row.label}</dt>
                          <dd>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {mainRows.length > 0 && (
                    <dl className="pm-comp-rows">
                      {mainRows.map((row) => (
                        <div key={row.label} className="pm-comp-row">
                          <dt>{row.label}</dt>
                          <dd>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {micros.length > 0 && (
                    <>
                      <p className="pm-comp-subhead">Micronutrients</p>
                      <dl className="pm-comp-rows">
                        {micros.map((row) => (
                          <div key={row.label} className="pm-comp-row">
                            <dt>{row.label}</dt>
                            <dd>{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  )}
                  {extra.length > 0 && (
                    <dl className="pm-comp-rows">
                      {extra.map((row) => (
                        <div key={row.label} className="pm-comp-row">
                          <dt>{row.label}</dt>
                          <dd>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <div className="pm-comp-rung">
                    <EvidenceRungChip rung={n.evidence_rung} />
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </div>
    </ProductNutritionTab>
  )
}
