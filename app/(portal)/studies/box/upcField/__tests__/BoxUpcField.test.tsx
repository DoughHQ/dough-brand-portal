import { createElement, type RefObject } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createEmptyBoxFieldRow } from '@/lib/box/defaults'
import type { BoxFieldRow } from '@/lib/box/types'
import type { ProductBarcodeOption } from '@/lib/concept/types'
import BoxUpcField from '../../BoxUpcField'
import UpcManualEntry from '../UpcManualEntry'

function seat(overrides: Partial<BoxFieldRow> = {}): BoxFieldRow {
  return { ...createEmptyBoxFieldRow(), localId: 'seat-1', ...overrides }
}

function option(overrides: Partial<ProductBarcodeOption> = {}): ProductBarcodeOption {
  return {
    barcode: '012345678905',
    variant_name: null,
    package_size_value: null,
    package_size_uom: null,
    package_count: null,
    ...overrides,
  }
}

function renderField(row: BoxFieldRow, error?: string | null) {
  return renderToStaticMarkup(
    createElement(BoxUpcField, { row, onSelectUpc: () => {}, error }),
  )
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('BoxUpcField', () => {
  it('asks for a package barcode before one is saved', () => {
    const markup = renderField(seat())

    expect(markup).toContain('class="cb-box-upc is-hero"')
    expect(markup).toContain('id="box-upc-manual-seat-1"')
    expect(markup).toContain('disabled=""')
    expect(markup).not.toContain('On the package')
    expect(markup).not.toContain('Cancel')
    expect(markup).not.toContain('role="alert"')
    expectOrder(markup, [
      'Package barcode',
      'Required',
      'placeholder="Scan or type the digits on the package"',
      'Save barcode',
      'Must match the physical package. Wrong code = they can’t finish or get paid.',
    ])
  })

  it('shows a saved code as the package barcode', () => {
    const markup = renderField(seat({ upc: '012345678905' }))

    expect(markup).toContain('data-ok="true"')
    expect(markup).not.toContain('Save barcode')
    expect(markup).not.toContain('Required')
    expectOrder(markup, [
      'On the package',
      '0 12345 67890 5',
      'Change',
      'Respondents scan this code to prove they tried the product.',
    ])
  })

  it('asks which barcode ships when the catalog lists more than one', () => {
    const markup = renderField(
      seat({
        upc: '012345678905',
        barcodeOptions: [
          option({ image_url: 'https://example.test/bar.png', variant_name: 'Vanilla', package_size_value: 8, package_size_uom: 'oz' }),
          option({ barcode: '00012345678905' }),
        ],
      }),
      'Identify the barcode on this package.',
    )

    expect(markup).toContain('name="box-upc-seat-1"')
    expect(markup).toContain('checked=""')
    expect(markup).toContain('src="https://example.test/bar.png"')
    expect(markup).toContain('role="alert"')
    expect(markup).not.toContain('Save barcode')
    expectOrder(markup, [
      'Required',
      'Which barcode is on the package that ships?',
      '012345678905 · 8 oz · Vanilla',
      '00012345678905',
      'Must match the physical package.',
      'Identify the barcode on this package.',
    ])
  })

  it('hides the identify prompt until a barcode is still missing and unambiguous', () => {
    const markup = renderField(seat(), 'Identify the barcode on this package.')

    expect(markup).not.toContain('role="alert"')
    expect(markup).not.toContain('Identify the barcode on this package.')
  })

  it('shows a different barcode error under the entry', () => {
    const markup = renderField(seat(), 'Enter the barcode on the package.')

    expectOrder(markup, [
      'Save barcode',
      'they can’t finish or get paid.',
      'role="alert"',
      'Enter the barcode on the package.',
    ])
  })
})

describe('UpcManualEntry', () => {
  const inputRef = { current: null } as RefObject<HTMLInputElement | null>

  it('counts short input and a saveable barcode', () => {
    const short = renderToStaticMarkup(
      createElement(UpcManualEntry, {
        inputId: 'box-upc-manual-seat-1',
        inputRef,
        manual: '1234567',
        digits: '1234567',
        canSave: false,
        editing: false,
        upc: null,
        onManualChange: () => {},
        onKeyDown: () => {},
        onCommit: () => {},
        onCancel: () => {},
      }),
    )
    const ready = renderToStaticMarkup(
      createElement(UpcManualEntry, {
        inputId: 'box-upc-manual-seat-1',
        inputRef,
        manual: '12345678',
        digits: '12345678',
        canSave: true,
        editing: true,
        upc: '012345678905',
        onManualChange: () => {},
        onKeyDown: () => {},
        onCommit: () => {},
        onCancel: () => {},
      }),
    )

    expect(short).toContain('data-ok="false"')
    expect(short).toContain('>7<')
    expect(short).toContain('disabled=""')
    expect(short).not.toContain('Cancel')
    expect(ready).toContain('data-ok="true"')
    expect(ready).toContain('>8<')
    expect(ready).not.toContain('disabled=""')
    expect(ready).toContain('Cancel')
  })
})
