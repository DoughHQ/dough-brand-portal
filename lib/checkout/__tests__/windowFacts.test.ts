import { describe, expect, it } from 'vitest'
import { checkoutWindowFacts } from '../windowFacts'

const now = new Date('2026-10-01T16:00:00.000Z')

describe('checkoutWindowFacts', () => {
  it('previews the end from the length before payment', () => {
    expect(
      checkoutWindowFacts({
        completions: 30,
        fieldingDays: 26,
        expiresAt: null,
        orderPaidOrWaived: false,
        now,
      })
    ).toEqual({
      responses: '30',
      length: '26 days',
      lengthNote: "Once it's paid",
      end: 'Oct 27',
      endNote: 'If paid today',
    })
  })

  it('treats no length as until full, up to 90 days', () => {
    expect(
      checkoutWindowFacts({
        completions: 1000,
        fieldingDays: null,
        expiresAt: null,
        orderPaidOrWaived: false,
        now,
      })
    ).toEqual({
      responses: '1,000',
      length: 'Until full',
      lengthNote: 'Up to 90 days',
      end: 'When full',
      endNote: 'Or 90 days after it goes live',
    })
  })

  it('uses the live deadline after payment', () => {
    const facts = checkoutWindowFacts({
      completions: 30,
      fieldingDays: 26,
      expiresAt: '2026-10-28T03:59:00.000Z',
      orderPaidOrWaived: true,
      now,
    })
    expect(facts.end).toBe('Oct 27')
    expect(facts.endNote).toBe('Live end')
    expect(facts.lengthNote).toBe('From the day it was paid')
  })

  it('shows the live 90-day limit when paid with no chosen length', () => {
    expect(
      checkoutWindowFacts({
        completions: 30,
        fieldingDays: null,
        expiresAt: '2026-12-30T16:00:00.000Z',
        orderPaidOrWaived: true,
        now,
      })
    ).toEqual({
      responses: '30',
      length: 'Until full',
      lengthNote: 'Up to 90 days',
      end: 'Dec 30',
      endNote: 'At the latest',
    })
  })
})
