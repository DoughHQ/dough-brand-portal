import { describe, expect, it } from 'vitest'
import {
  isNaturalFlavorPhrase,
  isOilOrFatLike,
} from '@/components/transparency/OperationsSheet'
import { composeKeptLine, composeMadeLine } from '@/lib/transparency/storyLines'

describe('operations helpers', () => {
  it('detects oils and natural flavors', () => {
    expect(isOilOrFatLike('Olive oil')).toBe(true)
    expect(isOilOrFatLike('Cocoa butter')).toBe(true)
    expect(isOilOrFatLike('Sugar')).toBe(false)
    expect(isNaturalFlavorPhrase('Natural flavors')).toBe(true)
    expect(isNaturalFlavorPhrase('natural flavour')).toBe(true)
    expect(isNaturalFlavorPhrase('Vanilla extract')).toBe(false)
  })

  it('composes made and kept lines', () => {
    expect(composeMadeLine('stone_ground', '48-hour ferment')).toBe(
      'Stone-ground · 48-hour ferment',
    )
    expect(composeKeptLine('refrigerated', 'best_by_quality', 'Use within 7 days')).toBe(
      'Refrigerated · Best by (quality) · Use within 7 days',
    )
  })
})
