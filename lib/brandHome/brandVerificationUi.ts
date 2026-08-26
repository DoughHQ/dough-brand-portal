import { SHOW_BRAND_VERIFICATION_FLOW } from '@/lib/flags'

/** Visible copy when the brand is not domain-verified. Real text, not decoration. */
export const BRAND_VERIFICATION_UNAVAILABLE_TITLE = "Brand verification isn't available yet."

export const BRAND_VERIFICATION_UNAVAILABLE_DETAIL =
  "We'll let you know when you can confirm your product data."

/**
 * Honest “not available yet” line. Independent of the flow flag — hiding it
 * would look like verification was forgotten.
 */
export function showBrandVerificationComingSoon(domainVerified: boolean): boolean {
  return !domainVerified
}

/**
 * Per-SKU confirm control. Only when the flow is live AND this brand is
 * domain-verified. Never render a disabled stand-in.
 */
export function showSkuVerificationControl(
  domainVerified: boolean,
  flowEnabled: boolean = SHOW_BRAND_VERIFICATION_FLOW
): boolean {
  return flowEnabled && domainVerified
}
