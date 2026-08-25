import { describe, expect, it } from 'vitest'
import {
  isRealRpcError,
  matchL2DisplayName,
  slugifyCategoryName,
} from '../categoryIntelligence'

describe('slugifyCategoryName', () => {
  it('slugifies display names with ampersands', () => {
    expect(slugifyCategoryName('Juices & Smoothies')).toBe('juices-and-smoothies')
    expect(slugifyCategoryName('Soda & Carbonated')).toBe('soda-and-carbonated')
  })
})

describe('matchL2DisplayName', () => {
  const names = ['Juices & Smoothies', 'Soda & Carbonated', 'Milk']

  it('matches exact display name (URL-encoded form)', () => {
    expect(matchL2DisplayName(names, 'Juices%20%26%20Smoothies')).toBe('Juices & Smoothies')
    expect(matchL2DisplayName(names, 'Juices & Smoothies')).toBe('Juices & Smoothies')
  })

  it('matches kebab slug variants', () => {
    expect(matchL2DisplayName(names, 'juices-and-smoothies')).toBe('Juices & Smoothies')
    expect(matchL2DisplayName(names, 'juices-smoothies')).toBe('Juices & Smoothies')
    expect(matchL2DisplayName(names, 'milk')).toBe('Milk')
  })

  it('returns null when nothing matches', () => {
    expect(matchL2DisplayName(names, 'not-a-category')).toBeNull()
  })
})

describe('isRealRpcError', () => {
  it('rejects null and empty objects', () => {
    expect(isRealRpcError(null)).toBe(false)
    expect(isRealRpcError({})).toBe(false)
    expect(isRealRpcError({ message: '' })).toBe(false)
    expect(isRealRpcError({ message: '   ' })).toBe(false)
  })

  it('accepts errors with a message', () => {
    expect(isRealRpcError({ message: 'permission denied', code: '42501' })).toBe(true)
  })
})
