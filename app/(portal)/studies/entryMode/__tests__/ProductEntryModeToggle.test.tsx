import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ProductEntryModeToggle from '../../ProductEntryModeToggle'

function renderToggle(mode: 'name' | 'barcode') {
  return renderToStaticMarkup(
    <ProductEntryModeToggle mode={mode} onChange={() => undefined} />,
  )
}

describe('ProductEntryModeToggle', () => {
  it('renders Name then Barcode, with Name selected', () => {
    const markup = renderToggle('name')

    expect(markup).toContain('role="tablist"')
    expect(markup).toContain('aria-label="Search by name or barcode"')
    expect(markup).toContain('display:inline-flex')
    expect(markup).toContain('border:1px solid var(--ink-10)')
    expect(markup).toContain('border-radius:var(--r-sm)')
    expect(markup).toContain('overflow:hidden')
    expect(markup).toContain('flex-shrink:0')
    expect(markup).toContain('role="tab"')
    expect(markup).toContain('>Name<')
    expect(markup).toContain('>Barcode<')
    expect(markup).toContain('background:var(--ink-80)')
    expect(markup).toContain('color:var(--on-fill)')
    expect(markup).toContain('background:var(--paper)')
    expect(markup).toContain('color:var(--ink-50)')
    expect(markup).toContain('height:32px')
    expect(markup).toContain('padding:0 12px')
    const tablist = markup.indexOf('role="tablist"')
    const name = markup.indexOf('>Name<')
    const barcode = markup.indexOf('>Barcode<')
    const nameSelected = markup.indexOf('aria-selected="true"')
    const barcodeSelected = markup.lastIndexOf('aria-selected="false"')
    expect(name).toBeGreaterThan(tablist)
    expect(barcode).toBeGreaterThan(name)
    expect(nameSelected).toBeGreaterThan(tablist)
    expect(nameSelected).toBeLessThan(name)
    expect(barcodeSelected).toBeGreaterThan(name)
    expect(barcodeSelected).toBeLessThan(barcode)
  })

  it('selects Barcode when that mode is active', () => {
    const markup = renderToggle('barcode')

    const name = markup.indexOf('>Name<')
    const barcode = markup.indexOf('>Barcode<')
    const nameSelected = markup.indexOf('aria-selected="false"')
    const barcodeSelected = markup.lastIndexOf('aria-selected="true"')
    expect(nameSelected).toBeLessThan(name)
    expect(barcodeSelected).toBeGreaterThan(name)
    expect(barcodeSelected).toBeLessThan(barcode)
    expect(markup).toContain('>Name<')
    expect(markup).toContain('>Barcode<')
  })
})
