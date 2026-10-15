import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const seeded: unknown[] = []
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: (init: unknown) => [seeded.length ? seeded.shift() : init, () => {}],
  }
})
vi.mock('@/components/categories/categoriesPage.css', () => ({}))
vi.mock('@/lib/supabase', () => ({ createClient: () => ({}) }))

import CategoryLauncher from '../CategoryLauncher'

const row = (id: number) => ({
  l2_id: id,
  l2_name: `Cat ${id}`,
  l1_name: `Dept ${id}`,
  banner_image_url: null,
  icon_name: null,
  total_products: 2,
  products_with_battles: 1,
  total_battles: 5,
  entitled: false,
})

const data = {
  owned: [{ ...row(1), entitled: true }],
  has_products: [row(2)],
  browse: [row(3)],
  search: null,
}

function render(state: unknown[], adjacent = [row(4)]) {
  seeded.length = 0
  seeded.push(...state)
  return renderToStaticMarkup(
    <CategoryLauncher brandName="Acme" adjacentCategories={adjacent} />,
  ).replaceAll('<!-- -->', '')
}

function inOrder(html: string, parts: string[]) {
  let cursor = 0
  for (const part of parts) {
    const at = html.indexOf(part, cursor)
    expect(at, part).toBeGreaterThanOrEqual(0)
    cursor = at + part.length
  }
}

describe('CategoryLauncher', () => {
  it('renders the skeleton before the first load', () => {
    const html = render([])
    expect(html).toContain('Loading categories')
    expect(html).not.toContain('Ready to explore')
  })

  it('renders the error state', () => {
    const html = render([null, true, 'Boom', '', ''])
    expect(html).toContain('Couldn’t load categories')
    expect(html).toContain('Boom')
    expect(html).not.toContain('cat-header')
  })

  it('renders sections in order once loaded', () => {
    const html = render([data, true, null, '', ''])
    inOrder(html, [
      'Acme',
      'Categories represented',
      'Dashboards unlocked',
      'Products mapped',
      'Battles captured',
      'Ready to explore',
      'Cat 1',
      'Where you compete',
      'Cat 2',
      'Categories next door',
      'Cat 4',
      'Browse categories',
      'Search browse categories',
      'Cat 3',
      'cat-note',
    ])
  })

  it('hides the adjacent section when empty and shows the search empty state', () => {
    const html = render([{ ...data, browse: [] }, true, null, 'zz', 'zz'], [])
    expect(html).not.toContain('Categories next door')
    expect(html).toContain('No categories found')
  })
})
