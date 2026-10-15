import { describe, expect, it } from 'vitest'
import { sessionIdFromAccessToken } from '../sessionId'

function tokenWithPayload(payload: Record<string, unknown>): string {
  const json = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `hdr.${json}.sig`
}

const SID = '11111111-1111-1111-1111-111111111111'

describe('sessionIdFromAccessToken', () => {
  it('returns a UUID session_id from a valid token', () => {
    expect(sessionIdFromAccessToken(tokenWithPayload({ session_id: SID, sub: 'u' }))).toBe(SID)
  })

  it('returns null when the claim is missing', () => {
    expect(sessionIdFromAccessToken(tokenWithPayload({ sub: 'u' }))).toBeNull()
  })

  it('returns null when session_id is not a UUID', () => {
    expect(sessionIdFromAccessToken(tokenWithPayload({ session_id: 'not-a-uuid' }))).toBeNull()
  })

  it('returns null for garbage input', () => {
    expect(sessionIdFromAccessToken('not.a.jwt')).toBeNull()
    expect(sessionIdFromAccessToken('%%%')).toBeNull()
  })

  it('returns null for undefined / null / empty', () => {
    expect(sessionIdFromAccessToken(undefined)).toBeNull()
    expect(sessionIdFromAccessToken(null)).toBeNull()
    expect(sessionIdFromAccessToken('')).toBeNull()
  })
})
