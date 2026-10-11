import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { newConceptArm } from '@/lib/concept/defaults'
import OwnProductColumn from '../../OwnProductColumn'

vi.mock('server-only', () => ({}))

function renderColumn(
  overrides: Partial<Parameters<typeof OwnProductColumn>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(OwnProductColumn, {
      arms: [],
      onArmsChange: () => {},
      brandId: 1,
      draftId: 'draft-1',
      priceMode: false,
      blindImageMode: true,
      pricePosture: 'blind',
      modeLabel: 'Packaging',
      addVariant: { allowed: true },
      singleTestMode: true,
      ...overrides,
    }),
  )
}

describe('OwnProductColumn', () => {
  it('invites the first concept before any design exists', () => {
    const markup = renderColumn()

    expect(markup).toContain('Your concepts')
    expect(markup).toContain('The designs respondents will evaluate.')
    expect(markup).toContain('Add your product')
    expect(markup).toContain('+ Add your product')
    expect(markup).not.toContain('+ Add another concept')
    expect(markup).not.toContain('Name this design')
  })

  it('shows a design letter and the add-another control once a concept exists', () => {
    const arm = newConceptArm(0)
    arm.localId = 'arm-1'
    arm.display_name = 'Midnight Cocoa'
    const markup = renderColumn({ arms: [arm] })

    expect(markup).toContain('id="field-seat-arm-arm-1"')
    expect(markup).toContain('class="cb-concept-letter"')
    expect(markup).toContain('Design A')
    expect(markup).toContain('aria-label="Name this design"')
    expect(markup).toContain('value="Midnight Cocoa"')
    expect(markup).toContain('Add pack image')
    expect(markup).toContain('+ Add another concept')
    expect(markup).not.toContain('+ Add your product')
  })

  it('explains why another concept cannot be added', () => {
    const arm = newConceptArm(0)
    arm.display_name = 'Midnight Cocoa'
    const markup = renderColumn({
      arms: [arm],
      addVariant: {
        allowed: false,
        reason: 'field-full',
        message: 'Field limit reached · 5 of 5',
      },
    })

    expect(markup).toContain('id="cb-add-variant-reason"')
    expect(markup).toContain('Field limit reached · 5 of 5')
    expect(markup).toContain('disabled=""')
  })

  it('keeps the legacy product column when single-test mode is off', () => {
    const arm = newConceptArm(0)
    arm.localId = 'arm-legacy'
    arm.display_name = 'Midnight Cocoa'
    const markup = renderColumn({
      arms: [arm],
      singleTestMode: false,
      blindImageMode: false,
      pricePosture: 'realistic',
      modeLabel: 'Packaging',
    })

    expect(markup).toContain('Your product')
    expect(markup).toContain('Own product')
    expect(markup).toContain('Your product in this study')
    expect(markup).toContain('Product name')
    expect(markup).toContain('placeholder="e.g. Midnight Cocoa — matte black"')
    expect(markup).toContain('Study format')
    expect(markup).toContain('Packaging')
    expect(markup).toContain('id="arm-price-arm-legacy"')
    expect(markup).toContain('placeholder="4.99"')
    expect(markup).toContain('+ Add another variant')
  })
})
