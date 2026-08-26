import { describe, expect, it } from 'vitest'
import {
  activeDietaryFlags,
  dietaryContainsItems,
  nutritionSummary,
  skuHasIngredientStatement,
  skuHasNutritionFacts,
  splitIngredientStatement,
  displayAllCapsPhrase,
} from '../../app/(portal)/products/[productId]/tabs/compositionPresentation'
import type { MasterSku, SkuNutrition } from '../productMaster/types'

function sku(partial: Partial<MasterSku>): MasterSku {
  return {
    sku_variant_id: 1,
    row_version: 1,
    variant_name_display: 'Test',
    package_size_value: null,
    package_size_uom: null,
    package_count: null,
    package_type: null,
    status: 'active',
    is_available: true,
    barcode: null,
    nutrition: null,
    ingredients: null,
    msrp: null,
    ...partial,
  }
}

describe('compositionPresentation', () => {
  it('lists only truthy dietary flags and contains keys', () => {
    expect(
      activeDietaryFlags({
        is_gluten_free: false,
        is_vegan: true,
        is_vegetarian: true,
        is_organic: null,
        is_non_gmo: null,
        is_kosher: null,
        is_halal: null,
        is_keto_friendly: null,
        is_paleo: null,
        contains: { wheat: true, milk: false, soybeans: true },
        source_type: null,
        evidence_rung: 'inferred',
        computed_at: null,
      }).map((f) => f.label)
    ).toEqual(['Vegan', 'Vegetarian'])

    expect(
      dietaryContainsItems({
        is_gluten_free: null,
        is_vegan: null,
        is_vegetarian: null,
        is_organic: null,
        is_non_gmo: null,
        is_kosher: null,
        is_halal: null,
        is_keto_friendly: null,
        is_paleo: null,
        contains: { wheat: true, milk: false, soybeans: true },
        source_type: null,
        evidence_rung: 'inferred',
        computed_at: null,
      })
    ).toEqual(['wheat', 'soybeans'])
  })

  it('detects ingredient statements and nutrition without inventing empty panels', () => {
    expect(skuHasIngredientStatement(sku({}))).toBe(false)
    expect(
      skuHasIngredientStatement(
        sku({
          ingredients: {
            sku_ingredients_id: 1,
            row_version: 1,
            ingredients_text_raw: '  Water, apples.  ',
            allergens_contains: null,
            allergens_may_contain: null,
            source_type: null,
            is_human_verified: false,
            evidence_rung: 'inferred',
            locked: false,
          },
        })
      )
    ).toBe(true)

    expect(skuHasNutritionFacts(sku({}))).toBe(false)
    expect(
      skuHasNutritionFacts(
        sku({
          nutrition: { calories: 90 } as SkuNutrition,
        })
      )
    ).toBe(true)
  })

  it('only builds a nutrition summary when calories and at least two macros exist', () => {
    expect(nutritionSummary({ calories: 90, protein_g: 1 } as SkuNutrition)).toEqual([])
    expect(nutritionSummary({ calories: 90, protein_g: 1, total_carbs_g: 20 } as SkuNutrition)).toEqual(
      [
        { label: 'Calories', value: '90' },
        { label: 'Protein', value: '1 g' },
        { label: 'Carbs', value: '20 g' },
      ]
    )
  })

  it('splits a comma ingredient statement and title-cases ALL CAPS for display', () => {
    expect(
      splitIngredientStatement(
        'APPLE JUICE, PEACH PUREE, VITAMIN C (ASCORBIC ACID), LEMON BIOFLAVONOIDS AND NOVA SCOTIA DULSE.'
      ).map(displayAllCapsPhrase)
    ).toEqual([
      'Apple Juice',
      'Peach Puree',
      'Vitamin C (Ascorbic Acid)',
      'Lemon Bioflavonoids and Nova Scotia Dulse.',
    ])
    expect(splitIngredientStatement('Water')).toEqual(['Water'])
  })
})
