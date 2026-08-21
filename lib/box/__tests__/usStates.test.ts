import { describe, expect, it } from 'vitest'
import {
  US_STATES,
  canonicalizeTargetStates,
  filterUsStates,
  lookupUsState,
  stateDisplayName,
} from '../usStates'

describe('US_STATES', () => {
  it('lists 50 states plus DC with unique 2-letter codes', () => {
    expect(US_STATES).toHaveLength(51)
    expect(US_STATES.every((s) => /^[A-Z]{2}$/.test(s.code))).toBe(true)
    expect(new Set(US_STATES.map((s) => s.code)).size).toBe(51)
    expect(US_STATES.some((s) => s.code === 'DC' && s.name === 'District of Columbia')).toBe(
      true
    )
  })
})

describe('lookupUsState', () => {
  it('matches codes and full names case-insensitively', () => {
    expect(lookupUsState('ca')?.code).toBe('CA')
    expect(lookupUsState('California')?.code).toBe('CA')
    expect(lookupUsState('new york')?.code).toBe('NY')
    expect(lookupUsState('Narnia')).toBeNull()
  })
})

describe('canonicalizeTargetStates', () => {
  it('emits unique USPS codes and keeps unknown tokens', () => {
    expect(canonicalizeTargetStates(['California', 'ny', 'CA', 'Narnia'])).toEqual([
      'CA',
      'NY',
      'Narnia',
    ])
  })
})

describe('filterUsStates', () => {
  it('filters by name or code and hides already-selected states', () => {
    expect(filterUsStates('cal', []).map((s) => s.code)).toEqual(['CA'])
    expect(filterUsStates('tx', []).map((s) => s.code)).toEqual(['TX'])
    expect(filterUsStates('', ['CA', 'New York']).map((s) => s.code)).not.toContain('CA')
    expect(filterUsStates('', ['CA', 'New York']).map((s) => s.code)).not.toContain('NY')
  })
})

describe('stateDisplayName', () => {
  it('shows the full name for a stored code', () => {
    expect(stateDisplayName('CA')).toBe('California')
    expect(stateDisplayName('mystery')).toBe('mystery')
  })
})
