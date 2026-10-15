import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import PrototypesClient from '../../PrototypesClient'

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ storage: { from: vi.fn() } }),
}))
vi.mock('../../PrototypeEditor', () => ({ default: () => null }))
vi.mock('../../prototypesPage.css', () => ({}))
vi.mock('@/components/categories/categoriesPage.css', () => ({}))

const item = {
  id: 'p1',
  name: 'Oat bar v2',
  internal_label: 'OB-2',
  packaging: 'final_packaging',
  planned_price: 3.5,
  category_label: 'Bars',
  image_paths: [],
  readiness: 'needs_allergens',
  allergens_declared_at: null,
  allergens_contains: null,
  allergens_may_contain: null,
} as unknown as PrototypeListItem

describe('PrototypesClient', () => {
  it('renders the empty library', () => {
    const html = renderToStaticMarkup(
      <PrototypesClient brandId={3} brandName="Acme" initialItems={[]} loadError="Library unavailable" />,
    )
    const text = html.replaceAll('<!-- -->', '')
    expect(text).toContain('Unreleased products for Acme. Private library — never the public catalog.')
    expect(text).toContain('Library unavailable')
    expect(text).toContain('Build the library before you ship the box')
    expect(text).not.toContain('proto-toolbar')
    expect(text).not.toContain('proto-grid')
  })

  it('renders counts, filters, and a prototype card in order', () => {
    const html = renderToStaticMarkup(
      <PrototypesClient brandId={3} brandName="Acme" initialItems={[item, { ...item, id: 'p2', readiness: 'ready' } as PrototypeListItem]} />,
    )
    const text = html.replaceAll('<!-- -->', '')
    const expected = [
      'In library', '>2<', 'Ready', '>1<', 'Needs work', '>1<',
      'prod-filter prod-filter-on', 'Needs allergens',
      'proto-card-art proto-card-art-empty',
      'proto-pill proto-pill-needs_allergens',
      'Final pack', 'Oat bar v2', 'OB-2', 'Bars · $3.50', 'Allergens not declared',
    ]
    let cursor = 0
    for (const t of expected) {
      const next = text.indexOf(t, cursor)
      expect(next, t).toBeGreaterThanOrEqual(0)
      cursor = next + t.length
    }
    expect(text).not.toContain('Build the library before you ship the box')
  })
})
