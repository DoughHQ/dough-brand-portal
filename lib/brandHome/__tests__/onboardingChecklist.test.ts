import { describe, expect, it } from 'vitest'
import { deriveOnboardingChecklist } from '../onboardingChecklist'

const base = {
  brandName: 'Acme',
  logoUrl: 'https://cdn.example/logo.png',
  websiteUrl: 'https://acme.example',
  aboutText: 'We make snacks.',
  productCount: 0,
  prototypeCount: 0,
  openStudies: 0,
  draftCount: 0,
}

describe('deriveOnboardingChecklist', () => {
  it('treats blank-after-trim profile fields as incomplete', () => {
    const result = deriveOnboardingChecklist({
      ...base,
      logoUrl: '  ',
      websiteUrl: '\t',
      aboutText: '',
    })
    expect(result.steps.find((s) => s.id === 'profile')?.done).toBe(false)
    expect(result.allDone).toBe(false)
  })

  it('marks profile done when logo, website, and about are non-blank', () => {
    const result = deriveOnboardingChecklist(base)
    expect(result.steps.find((s) => s.id === 'profile')?.done).toBe(true)
  })

  it('counts catalog products as the product step', () => {
    const result = deriveOnboardingChecklist({ ...base, productCount: 2 })
    const product = result.steps.find((s) => s.id === 'product')
    expect(product?.done).toBe(true)
    expect(product?.links).toEqual([
      {
        label: 'Your products are in the catalog. Check your product page',
        href: '/products',
      },
    ])
  })

  it('offers prototype and barcode paths when there are no products', () => {
    const result = deriveOnboardingChecklist({ ...base, prototypeCount: 1 })
    const product = result.steps.find((s) => s.id === 'product')
    expect(product?.done).toBe(true)
    const none = deriveOnboardingChecklist(base)
    const links = none.steps.find((s) => s.id === 'product')?.links ?? []
    expect(links).toHaveLength(2)
    expect(links[0]?.href).toBe('/prototypes')
    expect(links[1]?.href).toContain('mailto:')
    expect(links[1]?.href).toContain(encodeURIComponent('Add my product: Acme'))
  })

  it('counts drafts as a started study', () => {
    const result = deriveOnboardingChecklist({ ...base, draftCount: 1 })
    expect(result.steps.find((s) => s.id === 'study')?.done).toBe(true)
    expect(result.allDone).toBe(false)
  })

  it('sets allDone when every step is complete', () => {
    const result = deriveOnboardingChecklist({
      ...base,
      productCount: 1,
      openStudies: 1,
    })
    expect(result.allDone).toBe(true)
  })
})
