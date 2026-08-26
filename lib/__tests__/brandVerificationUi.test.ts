import { describe, expect, it } from 'vitest'
import { SHOW_BRAND_VERIFICATION_FLOW, SHOW_POPULATION_ELO } from '../flags'
import {
  BRAND_VERIFICATION_UNAVAILABLE_DETAIL,
  BRAND_VERIFICATION_UNAVAILABLE_TITLE,
  showBrandVerificationComingSoon,
  showSkuVerificationControl,
} from '../brandHome/brandVerificationUi'

describe('brand verification flags', () => {
  it('keeps verification flow and population Elo off', () => {
    expect(SHOW_BRAND_VERIFICATION_FLOW).toBe(false)
    expect(SHOW_POPULATION_ELO).toBe(false)
  })
})

describe('showBrandVerificationComingSoon', () => {
  it('shows honest copy when the brand is not domain-verified', () => {
    expect(showBrandVerificationComingSoon(false)).toBe(true)
    expect(showBrandVerificationComingSoon(true)).toBe(false)
  })
})

describe('showSkuVerificationControl', () => {
  it('never renders when the flow flag is off', () => {
    expect(showSkuVerificationControl(false, false)).toBe(false)
    expect(showSkuVerificationControl(true, false)).toBe(false)
  })

  it('renders only when the flow is live and the brand is verified', () => {
    expect(showSkuVerificationControl(true, true)).toBe(true)
    expect(showSkuVerificationControl(false, true)).toBe(false)
  })

  it('defaults to the app flag (off)', () => {
    expect(showSkuVerificationControl(true)).toBe(false)
  })
})

describe('copy', () => {
  it('is plain language, not a CTA', () => {
    expect(BRAND_VERIFICATION_UNAVAILABLE_TITLE).toBe("Brand verification isn't available yet.")
    expect(BRAND_VERIFICATION_UNAVAILABLE_DETAIL).toMatch(/confirm your product data/)
    expect(BRAND_VERIFICATION_UNAVAILABLE_TITLE.toLowerCase()).not.toMatch(/verify your brand/)
  })
})
