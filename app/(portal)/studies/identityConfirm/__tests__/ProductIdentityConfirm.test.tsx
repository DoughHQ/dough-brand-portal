import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ProductIdentityConfirm from '../../ProductIdentityConfirm'

function renderConfirm(category: string | null) {
  return renderToStaticMarkup(
    <ProductIdentityConfirm
      name="Oat carton"
      brand="Maple"
      category={category}
      upc="012345678905"
      help="Check the brand before you lock this seat."
      onConfirm={() => undefined}
      onChange={() => undefined}
    />,
  )
}

describe('ProductIdentityConfirm', () => {
  it('shows the brand, category, and UPC before the confirm actions', () => {
    const markup = renderConfirm('Oat milk')

    expect(markup).toContain('margin-top:10px')
    expect(markup).toContain('Maple')
    expect(markup).toContain(' · Oat milk')
    expect(markup).toContain('UPC 012345678905')
    expect(markup).toContain('Check the brand before you lock this seat.')
    expect(markup).toContain('class="cb-btn cb-btn-secondary"')
    expect(markup).toContain('aria-label="Confirm Oat carton"')
    expect(markup).toContain('>Confirm<')
    expect(markup).toContain('class="cb-quiet-action"')
    expect(markup).toContain('>Not this one<')
    const brand = markup.indexOf('Maple')
    const upc = markup.indexOf('UPC 012345678905')
    const help = markup.indexOf('Check the brand')
    const confirm = markup.indexOf('>Confirm<')
    const change = markup.indexOf('Not this one')
    expect(upc).toBeGreaterThan(brand)
    expect(help).toBeGreaterThan(upc)
    expect(confirm).toBeGreaterThan(help)
    expect(change).toBeGreaterThan(confirm)
  })

  it('omits the category marker when the product has none', () => {
    const markup = renderConfirm(null)

    expect(markup).toContain('Maple')
    expect(markup).not.toContain(' · ')
    expect(markup).toContain('UPC 012345678905')
    expect(markup).toContain('>Not this one<')
  })
})
