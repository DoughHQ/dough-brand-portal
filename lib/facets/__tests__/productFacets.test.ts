import { describe, expect, it } from 'vitest'
import {
  composeShopperFacetLine,
  facetFooterParts,
  facetValueLabel,
  filterDerivedValues,
  formatFacetFooterLine,
  messageFromFacetError,
  normalizeDeclaredValues,
  normalizeDerivedValues,
  provenanceLabelFromSource,
  rowIsPickerEditable,
  FACET_LIST_SEARCH_THRESHOLD,
  type DeclarableFacetRow,
} from '@/lib/facets/productFacets'

function row(partial: Partial<DeclarableFacetRow> & Pick<DeclarableFacetRow, 'facet_type'>): DeclarableFacetRow {
  return {
    display_name: partial.display_name ?? partial.facet_type,
    cardinality: 'multi',
    polarity: 'positive',
    assignability: 'derived_only',
    editable: false,
    requires_evidence: false,
    available_values: [],
    derived_values: [],
    declared_values: [],
    ...partial,
  }
}

describe('productFacets helpers', () => {
  it('softens first-open footer without completeness_pct or deficit counts', () => {
    expect(
      formatFacetFooterLine({
        product_id: 1,
        derived_count: 4,
        declared_count: 0,
        pending_count: 0,
        declarable_total: 10,
        declarable_filled: 0,
        completeness_pct: 0,
      }),
    ).toBe('4 attributes from Dough · add what only you know')
  })

  it('shows remaining count once the brand has started filling', () => {
    expect(
      formatFacetFooterLine({
        product_id: 1,
        derived_count: 4,
        declared_count: 2,
        pending_count: 0,
        declarable_total: 10,
        declarable_filled: 6,
        completeness_pct: 60,
      }),
    ).toBe("4 attributes from Dough · 2 you've added · 4 you can add")
  })

  it('keeps styled footer parts in sync with the plain line', () => {
    const row = {
      product_id: 1,
      derived_count: 3,
      declared_count: 0,
      pending_count: 1,
      declarable_total: 8,
      declarable_filled: 0,
      completeness_pct: 0,
    }
    const parts = facetFooterParts(row)
    expect(parts?.map((p) => p.text).join(' · ')).toBe(formatFacetFooterLine(row))
  })

  it('composes a shopper find line from derived + live declared', () => {
    const rows: DeclarableFacetRow[] = [
      row({
        facet_type: 'flavor',
        display_name: 'Flavor',
        cardinality: 'single',
        polarity: 'neutral',
        derived_values: [{ value: 'pineapple', source: 'product_name' }],
      }),
      row({
        facet_type: 'certification',
        display_name: 'Certification',
        assignability: 'brand_verifiable',
        editable: true,
        requires_evidence: true,
        available_values: [{ value: 'organic', label: 'Organic' }],
        derived_values: [{ value: 'organic', source: 'product_name' }],
        declared_values: [
          { value: 'fair_trade', declaration_id: 1, review_state: 'auto_accepted' },
          { value: 'b_corp', declaration_id: 2, review_state: 'pending' },
        ],
      }),
    ]
    expect(composeShopperFacetLine(rows)).toBe('Pineapple · Organic · Fair Trade')
    expect(
      composeShopperFacetLine([
        row({
          facet_type: 'certification',
          declared_values: [
            {
              value: 'fair_trade',
              declaration_id: 1,
              review_state: 'auto_accepted',
              label: 'Fair-Trade Certified',
            },
          ],
        }),
      ]),
    ).toBe('Fair-Trade Certified')
  })

  it('renders RPC display names on the summary line, not title-cased codes', () => {
    // Live check: product 30331662 GLACIER FREEZE ZERO SUGAR THIRST QUENCHER
    const gatorade = composeShopperFacetLine([
      row({
        facet_type: 'additive',
        display_name: 'Additive',
        derived_values: [
          { value: 'artificial_color', source: 'ingredients', label: 'Artificial Colour' },
        ],
      }),
      row({
        facet_type: 'free_from',
        display_name: 'Free From',
        derived_values: [{ value: 'sugar', source: 'ingredients', label: 'Sugar-Free' }],
      }),
      row({
        facet_type: 'nutrition_claim',
        display_name: 'Nutrition Claim',
        derived_values: [{ value: 'sugar_free', source: 'product_name', label: 'Sugar Free' }],
      }),
      row({
        facet_type: 'sweetener',
        display_name: 'Sweetener',
        derived_values: [
          { value: 'intense_sweetener', source: 'ingredients', label: 'Contains Intense Sweetener' },
          { value: 'no_caloric_sweetener', source: 'ingredients', label: 'No Caloric Sweetener' },
        ],
      }),
    ])
    expect(gatorade).toBe(
      'Artificial Colour · Sugar-Free · Sugar Free · Contains Intense Sweetener · No Caloric Sweetener',
    )
    expect(gatorade).not.toContain(' · Sugar · ')
  })

  it('keeps dietary hyphens from the item label (the humaniser would drop them)', () => {
    // Live check: product 30574016 TRADER JOE'S, UNSWEETENED NON-DAIRY BEVERAGE
    expect(
      composeShopperFacetLine([
        row({
          facet_type: 'dietary',
          display_name: 'Dietary',
          derived_values: [
            { value: 'dairy_free', source: 'ingredients', label: 'Dairy-Free' },
            { value: 'lactose_free', source: 'ingredients', label: 'Lactose-Free' },
            { value: 'grain_free', source: 'ingredients', label: 'Grain-Free' },
          ],
        }),
      ]),
    ).toBe('Dairy-Free · Lactose-Free · Grain-Free')
    expect(facetValueLabel({ available_values: [] }, 'dairy_free', 'Dairy-Free')).toBe(
      'Dairy-Free',
    )
  })

  it('does not invert meaning when the code is the thing the product is free of', () => {
    const inversions: [string, string, string][] = [
      ['free_from', 'gluten', 'Gluten-Free'],
      ['milk_fat', 'skim', 'Skim / Fat-Free'],
      ['free_from', 'sugar', 'Sugar-Free'],
      ['free_from', 'dairy', 'Dairy-Free'],
      ['meat_prep', 'uncured', 'Uncured / Nitrate-Free'],
      ['free_from', 'nut', 'Nut-Free'],
      ['free_from', 'gmo', 'Non-GMO'],
    ]
    for (const [facet_type, value, label] of inversions) {
      expect(facetValueLabel({ available_values: [] }, value, label)).toBe(label)
      expect(
        composeShopperFacetLine([
          row({
            facet_type,
            display_name: facet_type,
            derived_values: [{ value, source: 'ingredients', label }],
          }),
        ]),
      ).toBe(label)
    }
  })

  it('prefers the item label over picker vocabulary', () => {
    expect(
      facetValueLabel(
        { available_values: [{ value: 'sugar', label: 'Sugar' }] },
        'sugar',
        'Sugar-Free',
      ),
    ).toBe('Sugar-Free')
    expect(
      facetValueLabel({ available_values: [{ value: 'organic', label: 'Organic' }] }, 'organic'),
    ).toBe('Organic')
  })

  it('never uses the facet type display_name as a value label', () => {
    const freeFrom = row({
      facet_type: 'free_from',
      display_name: 'Free From',
      derived_values: [{ value: 'gluten', source: 'ingredients', label: 'Gluten-Free' }],
    })
    expect(facetValueLabel(freeFrom, 'gluten', 'Gluten-Free')).toBe('Gluten-Free')
    expect(composeShopperFacetLine([freeFrom])).toBe('Gluten-Free')
  })

  it('carries RPC labels through normalize and drops extras / blanks', () => {
    expect(
      normalizeDerivedValues([
        { value: 'sugar', source: 'ingredients', label: 'Sugar-Free', extra: 'nope' },
        { value: 'wheat', source: 'ingredients', label: '  ' },
        { value: 'soy', source: 'ingredients', display_name: 'Soy-Free' },
        { value: 'x', source: 'product_name' },
      ]),
    ).toEqual([
      { value: 'sugar', source: 'ingredients', label: 'Sugar-Free' },
      { value: 'wheat', source: 'ingredients' },
      { value: 'soy', source: 'ingredients', label: 'Soy-Free' },
      { value: 'x', source: 'product_name' },
    ])
    expect(
      normalizeDeclaredValues([
        {
          value: 'fair_trade',
          declaration_id: 9,
          review_state: 'auto_accepted',
          label: 'Fair Trade',
          extra: 'nope',
        },
        { value: 'organic', declaration_id: 10, review_state: 'pending', label: null },
      ]),
    ).toEqual([
      {
        value: 'fair_trade',
        declaration_id: 9,
        review_state: 'auto_accepted',
        label: 'Fair Trade',
      },
      { value: 'organic', declaration_id: 10, review_state: 'pending' },
    ])
  })

  it('normalizes derived values and keeps intense_sweetener visible', () => {
    expect(
      filterDerivedValues('sweetener', [
        { value: 'intense_sweetener', source: 'ingredients' },
        { value: 'cane_sugar', source: 'ingredients' },
      ]),
    ).toEqual([
      { value: 'intense_sweetener', source: 'ingredients' },
      { value: 'cane_sugar', source: 'ingredients' },
    ])
    expect(normalizeDerivedValues([{ value: 'x', source: 'product_name' }])).toEqual([
      { value: 'x', source: 'product_name' },
    ])
  })

  it('falls back to a humanised code only when the RPC label is blank', () => {
    // Defensive: no live derived-only value has a blank display_name. Do not treat
    // this path as the safety net — item.label is the contract.
    expect(facetValueLabel({ available_values: [] }, 'sugar')).toBe('Sugar')
    expect(facetValueLabel({ available_values: [] }, 'sugar', '  ')).toBe('Sugar')
  })

  it('maps provenance without leaking batch names', () => {
    expect(provenanceLabelFromSource('product_name')).toBe('From the product name')
    expect(provenanceLabelFromSource('node_merge_juice_20260829')).toBe('Derived by Dough')
  })

  it('treats editable=false as read-only', () => {
    expect(
      rowIsPickerEditable({
        editable: false,
        available_values: [{ value: 'x', label: 'X' }],
      }),
    ).toBe(false)
  })

  it('keeps multi shortlists under the same search threshold as single', () => {
    expect(FACET_LIST_SEARCH_THRESHOLD).toBe(8)
  })

  it('maps facet HINT codes', () => {
    expect(messageFromFacetError({ hint: 'EVIDENCE_REQUIRED', message: 'x' })).toBe(
      'Add a link to your certification.',
    )
  })
})
