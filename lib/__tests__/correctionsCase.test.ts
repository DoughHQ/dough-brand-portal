import { describe, expect, it } from 'vitest'
import { blankCorrectionRow } from '../corrections.shared'
import {
  assignSearchSeed,
  brandCatalogMismatch,
  brandMismatchWork,
  brandsLookDifferent,
  claimCopy,
  brandClaimCopy,
  collapseDuplicatedDisplayName,
  correctionCaseMode,
  formatCategoryPath,
  preferredTaxonomyHit,
  productTitle,
  softenDisplayName,
  relatedBrandClaim,
  waitingAge,
} from '../correctionsCase'

const CLASSICO_DISPLAY =
  'CLASSICO VIRGIN OLIVE OIL SNACK SIZE ITALIAN BRUSCHETTA TOASTS, CLASSICO VIRGIN OLIVE OIL'

describe('product identity', () => {
  it('collapses duplicated ALL-CAPS display names', () => {
    expect(collapseDuplicatedDisplayName(CLASSICO_DISPLAY)).toBe(
      'CLASSICO VIRGIN OLIVE OIL SNACK SIZE ITALIAN BRUSCHETTA TOASTS'
    )
  })

  it('title-cases screaming names and prefers short name', () => {
    expect(softenDisplayName(CLASSICO_DISPLAY)).toBe(
      'Classico Virgin Olive Oil Snack Size Italian Bruschetta Toasts'
    )
    expect(
      productTitle(
        blankCorrectionRow({
          id: '1',
          product_id: 30118146,
          product_name_display: CLASSICO_DISPLAY,
          product_name_short: 'Classico bruschetta toasts',
        })
      )
    ).toBe('Classico bruschetta toasts')
  })

  it('strips All Products from a taxonomy path', () => {
    expect(
      formatCategoryPath('All Products > Pantry & Cooking > Sauces & Condiments > Other Olives')
    ).toBe('Pantry & Cooking · Sauces & Condiments · Other Olives')
  })
})

describe('Classico golden case', () => {
  const row = blankCorrectionRow({
    id: 'a2bf19fd-6a47-4fe6-9a32-9a6df28ea6cb',
    product_id: 30118146,
    correction_type: 'category',
    product_name_display: CLASSICO_DISPLAY,
    brand_name: 'Abraco Group, LLC',
    brand_id: 99,
    current_category: 'Other Olives',
    current_category_path: 'All Products > Pantry & Cooking > Sauces & Condiments > Other Olives',
    proposed_value: { taxonomy_node_id: null, other: true },
    other_category_description: 'Crackers or toasts, crispy bread',
  })

  it('is Assign, not Confirm — no node to apply', () => {
    expect(correctionCaseMode(row)).toBe('assign')
  })

  it('leads with their words, not system-speak', () => {
    const copy = claimCopy(row)
    expect(copy.headline).toBe('Category looks wrong')
    expect(copy.sentence).toBe(
      'They say this belongs with “Crackers or toasts, crispy bread,” not Other Olives.'
    )
    expect(copy.sentence).not.toMatch(/flagged for a human/)
    expect(copy.sentence).not.toMatch(/Override/)
  })

  it('tells the brand Dough is on it — never File or Pick', () => {
    const copy = brandClaimCopy(row)
    expect(copy.headline).toBe('Category looks wrong')
    expect(copy.sentence).toBe(
      'They say this belongs with “Crackers or toasts, crispy bread,” not Other Olives.'
    )
    expect(copy.status).toBe('Dough is reviewing the category.')
    expect(`${copy.sentence} ${copy.status}`).not.toMatch(/Pick|File|Apply|Override/)
  })

  it('seeds taxonomy search with the submitter description', () => {
    expect(assignSearchSeed(row)).toBe('Crackers or toasts, crispy bread')
  })

  it('flags a catalog brand that does not match the record', () => {
    expect(
      brandCatalogMismatch({
        brandId: 99,
        brandName: 'Abraco Group, LLC',
        workspaceBrandId: 1,
        workspaceBrandName: 'The Kellogg',
      })
    ).toBe('Brand on record is Abraco Group, LLC. This catalog is The Kellogg.')
  })

  it('treats mismatch as work the current claim may not finish', () => {
    const opts = {
      brandId: 99,
      brandName: 'Abraco Group, LLC',
      workspaceBrandId: 1,
      workspaceBrandName: 'The Kellogg',
    }
    expect(brandMismatchWork({ ...opts, correctionType: 'category' })).toEqual({
      sentence: 'Brand on record is Abraco Group, LLC. This catalog is The Kellogg.',
      thisClaimFixesIt: false,
    })
    expect(brandMismatchWork({ ...opts, correctionType: 'brand' })?.thisClaimFixesIt).toBe(true)
  })

  it('finds an existing brand claim among related work', () => {
    expect(
      relatedBrandClaim([
        blankCorrectionRow({ id: 'c', correction_type: 'category' }),
        blankCorrectionRow({ id: 'b', correction_type: 'brand' }),
      ])?.id
    ).toBe('b')
  })
})

describe('waitingAge', () => {
  const now = Date.parse('2026-09-15T20:00:00.000Z')

  it('speaks in days and months, not UTC clocks', () => {
    expect(waitingAge('2026-09-15T10:00:00.000Z', now)).toBe('Waiting today')
    expect(waitingAge('2026-09-14T20:00:00.000Z', now)).toBe('Waiting 1 day')
    expect(waitingAge('2026-06-12T22:06:00.000Z', now)).toBe('Waiting 3 months')
  })
})

describe('preferredTaxonomyHit', () => {
  const hits = [
    { taxonomy_node_id: 1, node_name_display: 'Other Olives', path_names_csv: 'a', node_level: 3, is_leaf: true },
    {
      taxonomy_node_id: 2,
      node_name_display: 'Crackers or toasts, crispy bread',
      path_names_csv: 'b',
      node_level: 3,
      is_leaf: true,
    },
  ]

  it('picks the named match, not the first row', () => {
    expect(preferredTaxonomyHit(hits, 'Crackers or toasts, crispy bread')?.taxonomy_node_id).toBe(2)
  })

  it('does not invent a pick from unrelated hits', () => {
    expect(preferredTaxonomyHit(hits, 'sparkling water')).toBeNull()
  })
})

describe('brandsLookDifferent', () => {
  it('ignores LLC noise', () => {
    expect(brandsLookDifferent('Abraco Group, LLC', 'Abraco Group')).toBe(false)
    expect(brandsLookDifferent('Abraco Group, LLC', 'The Kellogg')).toBe(true)
  })
})

describe('extract mode', () => {
  it('treats nutrition as extract, not confirm', () => {
    const row = blankCorrectionRow({
      id: 'n1',
      correction_type: 'nutrition_facts',
      evidence_image_url: 'https://example.com/label.jpg',
      proposed_value: {},
    })
    expect(correctionCaseMode(row)).toBe('extract')
    expect(claimCopy(row).headline).toBe('Nutrition from a label photo')
    expect(brandClaimCopy(row).sentence).toBe('A label photo was sent. Dough is reading it.')
    expect(brandClaimCopy(row).sentence).not.toMatch(/apply/)
  })
})

describe('brand classifier copy', () => {
  it('does not ask a brand to pick a category', () => {
    const row = blankCorrectionRow({
      id: 'c1',
      correction_type: 'category',
      current_category: 'Other Olives',
      proposed_value: { review_reason: 'no_match_auto_classify' },
    })
    const copy = brandClaimCopy(row)
    expect(copy.sentence).toBe('This product still needs a category. Dough is assigning one.')
    expect(copy.sentence).not.toMatch(/Pick a category/)
    expect(claimCopy(row).sentence).toMatch(/Pick a category/)
  })
})
