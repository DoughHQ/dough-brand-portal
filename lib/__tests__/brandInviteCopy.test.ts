import { describe, expect, it } from 'vitest'
import { describeInviteState } from '../brandInviteCopy'
import type { BrandInviteState } from '../brandInvite.server'

const ctx = { brandName: 'Acme', email: 'owner@acme.com' }

describe('describeInviteState', () => {
  it('valid: joins with brand + email, continue action, peek-only small print', () => {
    const c = describeInviteState('valid', ctx)
    expect(c.title).toBe('Join Acme on Runoff')
    expect(c.body).toContain('owner@acme.com')
    expect(c.action).toBe('continue')
    expect(c.actionLabel).toBe('Continue')
    expect(c.smallPrint).toBe("Opening this page doesn't use your invite.")
  })

  it('resume: finish setup with the same email', () => {
    const c = describeInviteState('resume', ctx)
    expect(c.title).toBe('Finish setting up Acme')
    expect(c.body).toContain('owner@acme.com')
    expect(c.action).toBe('continue')
  })

  it('has_account: password form with sign-in-and-join action', () => {
    const c = describeInviteState('has_account', ctx)
    expect(c.title).toBe('Join Acme on Runoff')
    expect(c.body).toContain('owner@acme.com already has an account')
    expect(c.action).toBe('password')
    expect(c.actionLabel).toBe('Sign in and join')
  })

  it('used: sign-in action', () => {
    const c = describeInviteState('used', ctx)
    expect(c.title).toMatch(/already been used/)
    expect(c.action).toBe('login')
  })

  it('does not leak brand or email on terminal states', () => {
    const terminal: BrandInviteState[] = [
      'expired',
      'revoked',
      'invalid',
      'other_brand',
      'blocked',
      'brand_has_admin',
      'unavailable',
      'error',
    ]
    for (const state of terminal) {
      const c = describeInviteState(state, ctx)
      expect(c.action).toBe('none')
      expect(`${c.title} ${c.body}`).not.toContain('owner@acme.com')
      expect(`${c.title} ${c.body}`).not.toContain('Acme')
    }
  })

  it('points support copy at hello@itsarunoff.com', () => {
    for (const state of ['expired', 'revoked', 'invalid', 'blocked', 'error'] as const) {
      expect(describeInviteState(state, ctx).body).toContain('hello@itsarunoff.com')
    }
  })

  it('groups revoked/invalid and blocked/brand_has_admin/unavailable', () => {
    expect(describeInviteState('revoked', ctx)).toEqual(describeInviteState('invalid', ctx))
    expect(describeInviteState('blocked', ctx)).toEqual(describeInviteState('unavailable', ctx))
    expect(describeInviteState('blocked', ctx)).toEqual(describeInviteState('brand_has_admin', ctx))
  })
})
