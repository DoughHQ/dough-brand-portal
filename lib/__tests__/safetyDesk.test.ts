import { describe, expect, it } from 'vitest'
import {
  parseSafetyFocus,
  reasonLabel,
  safetyAgeLabel,
  safetyDeskHref,
  safetyIsStale,
  safetyPersonLabel,
  severityRank,
} from '../safety.shared'

describe('safety desk helpers', () => {
  it('labels people and reasons', () => {
    expect(safetyPersonLabel('Ada', 'ada')).toBe('Ada')
    expect(safetyPersonLabel(null, 'ada')).toBe('@ada')
    expect(safetyPersonLabel(null, null, 42)).toBe('User 42')
    expect(reasonLabel('sexual_content')).toBe('Sexual content')
  })

  it('ranks sexual / violence / hate first', () => {
    expect(severityRank('sexual_content')).toBe(0)
    expect(severityRank('spam')).toBe(2)
  })

  it('marks cases older than 12h as stale', () => {
    const now = Date.parse('2026-10-07T12:00:00.000Z')
    expect(safetyIsStale('2026-10-06T23:00:00.000Z', now)).toBe(true)
    expect(safetyIsStale('2026-10-07T11:00:00.000Z', now)).toBe(false)
    expect(safetyAgeLabel('2026-10-07T11:30:00.000Z', now)).toBe('30m')
  })

  it('builds desk hrefs and parses focus', () => {
    expect(safetyDeskHref()).toBe('/admin/safety')
    expect(safetyDeskHref({ focusId: 9 })).toBe('/admin/safety?focus=9')
    expect(parseSafetyFocus({ focus: '9' })).toBe(9)
    expect(parseSafetyFocus({ focus: 'nope' })).toBeNull()
  })
})
