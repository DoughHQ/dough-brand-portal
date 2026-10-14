import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import CaseEditor from '../../CaseEditor'

vi.mock('server-only', () => ({}))
vi.mock('../../actions', () => ({
  searchBrandsAction: vi.fn(),
  searchTaxonomyAction: vi.fn(),
}))

function row(overrides: Record<string, unknown>): CorrectionReviewRow {
  return {
    id: 'c1',
    product_id: 4,
    product_name_short: 'Maple bar',
    variants: [],
    variant_count: 0,
    proposed_value: null,
    ...overrides,
  } as unknown as CorrectionReviewRow
}

function editor(overrides: Record<string, unknown>) {
  return renderToStaticMarkup(
    <CaseEditor row={row(overrides)} busy={false} onCancel={() => {}} onSubmit={() => {}} />,
  )
}

describe('CaseEditor fields', () => {
  it('asks for a category before anything is filed', () => {
    const html = editor({ correction_type: 'category' })
    expect(html).toContain('Pick the Runoff category')
    expect(html).toContain('placeholder="Search by name or path…"')
    expect(html).toContain('value="Maple bar"')
    expect(html).toContain('Pick a result. Nothing is filed until you do.')
    expect(html).toContain('No matching categories.')
    expect(html).toContain('File in this category')
    expect(html).toContain('disabled=""')
  })

  it('shows the nutrition draft and blocks a product with no variants', () => {
    const html = editor({
      correction_type: 'nutrition_facts',
      extracted_value: { calories: 120, basis_type: 'per_serving' },
    })
    expect(html).toContain('Review the draft, then apply')
    expect(html).toContain('This product has no SKU variants — nutrition/ingredients cannot be applied.')
    expect(html).toContain('Basis')
    expect(html).toContain('Per serving')
    expect(html).toContain('corr-editor-chip is-on')
    expect(html).toContain('>Calories<')
    expect(html).toContain('value="120"')
    expect(html).toContain('Apply these values')
  })

  it('asks which variant to file when the product has several', () => {
    const html = editor({
      correction_type: 'ingredients',
      variant_count: 2,
      variants: [
        { sku_variant_id: 3, label: '12 oz' },
        { sku_variant_id: 4, label: '24 oz' },
      ],
    })
    expect(html).toContain('Review the draft, then apply')
    expect(html).toContain('>Variant<')
    expect(html).toContain('Select variant…')
    expect(html).toContain('>12 oz<')
    expect(html).toContain('>24 oz<')
    expect(html).toContain('Apply these values')
    expect(html).toContain('disabled=""')
  })

  it('shows the apply label while a save is in flight', () => {
    const html = renderToStaticMarkup(
      <CaseEditor
        row={row({ correction_type: 'name', proposed_value: { name: 'Maple bar' } })}
        busy
        onCancel={() => {}}
        onSubmit={() => {}}
      />,
    )
    expect(html).toContain('Applying…')
    expect(html).toContain('>Cancel<')
  })

  it('searches brands without creating one', () => {
    const html = editor({
      correction_type: 'brand',
      proposed_value: { brand_name: 'Maple', brand_id: 7 },
    })
    expect(html).toContain('Enter the correct value')
    expect(html).toContain('placeholder="Type to search — brands are never auto-created"')
    expect(html).toContain('Selected: Maple (#7)')
  })
})
