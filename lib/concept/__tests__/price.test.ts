import {
  formatPriceLabel,
  isAllowedPriceInput,
  isPriced,
  parsePriceAmount,
  priceToWire,
} from '../price'

describe('concept price helpers', () => {
  it('parses decimals with parseFloat, not integers', () => {
    expect(parsePriceAmount('4.99')).toBeCloseTo(4.99)
    expect(parsePriceAmount('4.')).toBe(4)
    expect(parsePriceAmount('')).toBeNull()
    expect(parsePriceAmount(null)).toBeNull()
  })

  it('allows intermediate decimal typing', () => {
    expect(isAllowedPriceInput('')).toBe(true)
    expect(isAllowedPriceInput('4')).toBe(true)
    expect(isAllowedPriceInput('4.')).toBe(true)
    expect(isAllowedPriceInput('4.9')).toBe(true)
    expect(isAllowedPriceInput('4.99')).toBe(true)
    expect(isAllowedPriceInput('4.999')).toBe(false)
    expect(isAllowedPriceInput('abc')).toBe(false)
  })

  it('wires price as string for the RPC', () => {
    expect(priceToWire('4.99')).toBe('4.99')
    expect(priceToWire('5')).toBe('5')
    expect(priceToWire('')).toBeNull()
    expect(priceToWire(null)).toBeNull()
  })

  it('isPriced treats blank as unpriced', () => {
    expect(isPriced(null)).toBe(false)
    expect(isPriced('')).toBe(false)
    expect(isPriced('4.99')).toBe(true)
  })

  it('formats floor labels to two decimals', () => {
    expect(formatPriceLabel('4.9')).toBe('4.90')
    expect(formatPriceLabel(null)).toBeNull()
  })
})
