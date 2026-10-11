import { describe, expect, it } from 'vitest'
import { intFromInput } from '../integer'

describe('intFromInput', () => {
  it('accepts trimmed signed safe integers', () => {
    expect(intFromInput(' 42 ')).toBe(42)
    expect(intFromInput('-7')).toBe(-7)
    expect(intFromInput('0')).toBe(0)
  })

  it('rejects blanks, decimals, mixed values, and unsafe integers', () => {
    expect(intFromInput('')).toBeNull()
    expect(intFromInput('1.5')).toBeNull()
    expect(intFromInput('12px')).toBeNull()
    expect(intFromInput('9007199254740992')).toBeNull()
  })
})
