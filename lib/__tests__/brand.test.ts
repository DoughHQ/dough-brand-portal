import { describe, expect, it } from 'vitest'
import {
  MARKETING_ORIGIN,
  PRODUCT_NAME,
  SUPPORT_EMAIL,
} from '@/lib/brand'

describe('lib/brand', () => {
  it('keeps display name Dough until Train B', () => {
    expect(PRODUCT_NAME).toBe('Dough')
  })

  it('owns marketing origin and re-exports support email', () => {
    expect(MARKETING_ORIGIN).toBe('https://www.itsarunoff.com')
    expect(SUPPORT_EMAIL).toBe('hello@itsarunoff.com')
  })
})
