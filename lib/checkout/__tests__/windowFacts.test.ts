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
        settled: false,
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

  it('treats no length as no end date', () => {
    expect(
      checkoutWindowFacts({
        completions: 1000,
        fieldingDays: null,
        expiresAt: null,
        settled: false,
        now,
      })
    ).toMatchObject({
      responses: '1,000',
      length: 'No end date',
      end: 'When full',
    })
  })

  it('uses the live deadline after payment', () => {
    const facts = checkoutWindowFacts({
      completions: 30,
      fieldingDays: 26,
      expiresAt: '2026-10-28T03:59:00.000Z',
      settled: true,
      now,
    })
    expect(facts.end).toBe('Oct 27')
    expect(facts.endNote).toBe('Live end')
    expect(facts.lengthNote).toBe('From the day it was paid')
  })
})
