import { describe, expect, it } from 'vitest'
import {
  composeShopperFacetLine,
  facetFooterParts,
  filterDerivedValues,
  formatFacetFooterLine,
  messageFromFacetError,
  normalizeDerivedValues,
  provenanceLabelFromSource,
  rowIsPickerEditable,
  FACET_LIST_SEARCH_THRESHOLD,
  type DeclarableFacetRow,
} from '@/lib/facets/productFacets'

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
      {
        facet_type: 'flavor',
        display_name: 'Flavor',
        cardinality: 'single',
        polarity: 'neutral',
        assignability: 'derived_only',
        editable: false,
        requires_evidence: false,
        available_values: [],
        derived_values: [{ value: 'pineapple', source: 'product_name' }],
        declared_values: [],
      },
      {
        facet_type: 'certification',
        display_name: 'Certification',
        cardinality: 'multi',
        polarity: 'positive',
        assignability: 'brand_verifiable',
        editable: true,
        requires_evidence: true,
        available_values: [{ value: 'organic', label: 'Organic' }],
        derived_values: [{ value: 'organic', source: 'product_name' }],
        declared_values: [
          { value: 'fair_trade', declaration_id: 1, review_state: 'auto_accepted' },
          { value: 'b_corp', declaration_id: 2, review_state: 'pending' },
        ],
      },
    ]
    expect(
      composeShopperFacetLine(rows, (type, value) => {
        if (type === 'flavor' && value === 'pineapple') return 'Pineapple'
        if (value === 'organic') return 'Organic'
        if (value === 'fair_trade') return 'Fair Trade'
        return value
      }),
    ).toBe('Pineapple · Organic · Fair Trade')
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
