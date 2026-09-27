import { describe, expect, it } from 'vitest'
import {
  PACK_SIZE_OTHER,
  packSizePromptPreview,
  packSizeSelectValue,
  shouldClearPackSizeOnCategoryChange,
} from '../packSize'

describe('packSizeSelectValue', () => {
  it('returns empty when unset', () => {
    expect(packSizeSelectValue('', ['pint'])).toBe('')
    expect(packSizeSelectValue('  ', ['pint'])).toBe('')
  })

  it('matches a known phrase', () => {
    expect(packSizeSelectValue('pint', ['pint', 'quart'])).toBe('pint')
  })

  it('routes free text to Other', () => {
    expect(packSizeSelectValue('club pack', ['pint'])).toBe(PACK_SIZE_OTHER)
  })
})

describe('shouldClearPackSizeOnCategoryChange', () => {
  it('keeps a phrase that still exists', () => {
    expect(
      shouldClearPackSizeOnCategoryChange('4-pack', ['4-pack', '6-pack'])
    ).toBe(false)
  })

  it('clears pint when switching to chips', () => {
    expect(
      shouldClearPackSizeOnCategoryChange('pint', [
        'single bag',
        'family-size bag',
      ])
    ).toBe(true)
  })

  it('does not clear an empty value', () => {
    expect(shouldClearPackSizeOnCategoryChange('', ['pint'])).toBe(false)
  })
})

describe('packSizePromptPreview', () => {
  it('fills the token', () => {
    expect(packSizePromptPreview('pint')).toBe(
      'What would you expect to pay for a pint of this?'
    )
  })

  it('uses an ellipsis placeholder when empty', () => {
    expect(packSizePromptPreview('')).toBe(
      'What would you expect to pay for a … of this?'
    )
  })
})
