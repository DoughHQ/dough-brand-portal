import { describe, expect, it } from 'vitest'
import {
  expiresAtFromFieldingDays,
  fieldingDaysMessage,
  fieldingDaysOrNone,
  fieldingEndPreview,
} from '../fieldingWindow'

describe('concept fielding length', () => {
  const now = new Date('2026-10-01T16:00:00.000Z')

  it('treats a missing, legacy, or non-integer value as no end date', () => {
    expect(fieldingDaysOrNone(null)).toBeNull()
    expect(fieldingDaysOrNone(undefined)).toBeNull()
    expect(fieldingDaysOrNone('2026-11-01T23:59:59.000Z')).toBeNull()
    expect(fieldingDaysOrNone('2026-11-01')).toBeNull()
    expect(fieldingDaysOrNone(14.5)).toBeNull()
    expect(fieldingDaysOrNone(0)).toBeNull()
    expect(fieldingDaysOrNone(-3)).toBeNull()
  })

  it('keeps a whole number of days, including one under 7', () => {
    expect(fieldingDaysOrNone(14)).toBe(14)
    expect(fieldingDaysOrNone('14')).toBe(14)
    expect(fieldingDaysOrNone(3)).toBe(3)
  })

  it('allows no end date and refuses a length under 7 days', () => {
    expect(fieldingDaysMessage(null)).toBeNull()
    expect(fieldingDaysMessage(7)).toBeNull()
    expect(fieldingDaysMessage(90)).toBeNull()
    expect(fieldingDaysMessage(6)).toBe('A study needs at least 7 days to run.')
  })

  it('sends a timestamp exactly that many days later', () => {
    expect(expiresAtFromFieldingDays(14, now)).toBe('2026-10-15T16:00:00.000Z')
    expect(Date.parse(expiresAtFromFieldingDays(14, now)) - now.getTime()).toBe(14 * 86_400_000)
  })

  it('shows the day count and the date if the study were paid today', () => {
    expect(fieldingEndPreview(14, now)).toBe('14 days · ends Oct 15 if paid today')
  })
})
