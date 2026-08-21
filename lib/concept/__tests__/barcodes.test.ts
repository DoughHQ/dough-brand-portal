import { describe, expect, it } from 'vitest'
import {
  barcodeChoiceLabel,
  barcodeLookupCandidates,
  knownUpcFromBarcodeResolve,
  unwrapRpcJson,
} from '../barcodes'

describe('barcodeChoiceLabel', () => {
  it('leads with the barcode, then size/UOM, then variant_name', () => {
    expect(
      barcodeChoiceLabel({
        barcode: '028400017688',
        variant_name: 'Plastic Bottle',
        package_size_value: 20,
        package_size_uom: 'oz',
        package_count: 1,
      })
    ).toBe('028400017688 · 20 oz · Plastic Bottle')
  })

  it('is just the barcode when size and variant are missing', () => {
    expect(
      barcodeChoiceLabel({
        barcode: '028400017688',
        variant_name: null,
        package_size_value: null,
        package_size_uom: null,
        package_count: null,
      })
    ).toBe('028400017688')
  })
})

describe('knownUpcFromBarcodeResolve', () => {
  const hit = {
    product_id: 1,
    product_name: 'Classic',
    brand_name: "Lay's",
    image_url: null,
    category: 'Chips',
    taxonomy_node_id: 10,
    matched_barcode: '00028400017688',
  }

  it('fills UPC only when the barcode uniquely identifies one product', () => {
    expect(
      knownUpcFromBarcodeResolve(
        {
          found: true,
          normalized: '00028400017688',
          ambiguous: false,
          match_count: 1,
          products: [hit],
        },
        hit
      )
    ).toBe('00028400017688')
  })

  it('does not auto-take products[0] when the match is ambiguous', () => {
    expect(
      knownUpcFromBarcodeResolve(
        {
          found: true,
          normalized: '00028400017688',
          ambiguous: true,
          match_count: 2,
          products: [hit, { ...hit, product_id: 2 }],
        },
        hit
      )
    ).toBeUndefined()
  })
})

describe('barcodeLookupCandidates', () => {
  it('pads a UPC-A to GTIN-14 so catalog rows stored as 14 digits still match', () => {
    expect(barcodeLookupCandidates('076840004492')).toEqual([
      '076840004492',
      '00076840004492',
    ])
  })

  it('strips spaces and dashes before padding', () => {
    expect(barcodeLookupCandidates('076 84000-4492')).toEqual([
      '076 84000-4492',
      '076840004492',
      '00076840004492',
    ])
  })

  it('does not re-pad an already 14-digit GTIN', () => {
    expect(barcodeLookupCandidates('00076840004492')).toEqual(['00076840004492'])
  })
})

describe('unwrapRpcJson', () => {
  it('reads a plain object', () => {
    expect(unwrapRpcJson({ found: true, products: [] })).toEqual({
      found: true,
      products: [],
    })
  })

  it('unwraps a one-row array (table-returning RPCs)', () => {
    expect(unwrapRpcJson([{ found: true, match_count: 1 }])).toEqual({
      found: true,
      match_count: 1,
    })
  })

  it('parses a JSON string payload', () => {
    expect(unwrapRpcJson('{"found":false,"products":[]}')).toEqual({
      found: false,
      products: [],
    })
  })
})
