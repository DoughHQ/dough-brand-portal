import { describe, expect, it } from 'vitest'
import {
  isBrandFacingDesignLabel,
  respondentDesignLabel,
  respondentLabelForArm,
} from '../designLetters'

describe('respondentDesignLabel', () => {
  it('maps 0-based index to Design A…Z', () => {
    expect(respondentDesignLabel(0)).toBe('Design A')
    expect(respondentDesignLabel(1)).toBe('Design B')
    expect(respondentDesignLabel(25)).toBe('Design Z')
  })

  it('falls back past Z', () => {
    expect(respondentDesignLabel(26)).toBe('Design 27')
  })
})

describe('respondentLabelForArm', () => {
  const concepts = [
    { arm_label: 'New design', display_name: 'New design' },
    { arm_label: 'Current pack', display_name: 'Current pack' },
  ]

  it('finds by arm_label', () => {
    expect(respondentLabelForArm(concepts, { arm_label: 'Current pack' })).toBe('Design B')
  })

  it('finds by display_name', () => {
    expect(respondentLabelForArm(concepts, { display_name: 'New design' })).toBe('Design A')
  })
})

describe('isBrandFacingDesignLabel', () => {
  it('allows Design letters', () => {
    expect(isBrandFacingDesignLabel('Design A')).toBe(false)
  })

  it('flags brand names', () => {
    expect(isBrandFacingDesignLabel('Midnight Cocoa')).toBe(true)
  })
})
