import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createEmptyConceptDraft, newConceptArm } from '@/lib/concept/defaults'
import type { ConceptPublishSuccessMeta } from '@/lib/concept/types'
import CheckoutHandoff, { AwaitingPaymentNotice } from '../../CheckoutHandoff'

function publishMeta(
  overrides: Partial<ConceptPublishSuccessMeta> = {},
): ConceptPublishSuccessMeta {
  return {
    missionId: 'mission-1',
    campaignId: 'campaign-1',
    field_size: null,
    unique_pairs: null,
    rounds_per_respondent: null,
    coverage_note: null,
    target_completions: null,
    template_code: null,
    ...overrides,
  }
}

function renderHandoff(
  draft = createEmptyConceptDraft(),
  meta = publishMeta(),
) {
  return renderToStaticMarkup(
    createElement(CheckoutHandoff, {
      draft,
      meta,
      onClose: () => {},
      onContinue: () => {},
    }),
  )
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('CheckoutHandoff', () => {
  it('opens checkout before a design or a price exists', () => {
    const markup = renderHandoff()

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-labelledby="checkout-handoff-title"')
    expect(markup).toContain('aria-label="Close"')
    expect(markup).not.toContain('cb-handoff-hero')
    expect(markup).not.toContain('cb-handoff-photo')
    expectOrder(markup, [
      'Ready for checkout',
      'Nothing goes live until this is paid.',
      'Completions',
      '100',
      'Runs',
      'Until full',
      'Up to 90 days',
      'Ends',
      'When full',
      'Or 90 days after it goes live',
      'Total',
      '—',
      'Not now',
      'Continue to checkout',
    ])
  })

  it('names the hero design and a priced order', () => {
    const draft = createEmptyConceptDraft({
      conceptArms: [{ ...newConceptArm(0), display_name: 'Citrus bar', image_url: 'stimuli/citrus.png' }],
    })
    const markup = renderHandoff(
      draft,
      publishMeta({
        target_completions: 1000,
        order: {
          status: 'awaiting_payment',
          completions: 1000,
          unit_price_cents: 250,
          amount_cents: 250000,
          currency: 'usd',
        },
      }),
    )

    expect(markup).toContain('class="cb-handoff-letter"')
    expect(markup).toContain('>A<')
    expect(markup).not.toContain('cb-handoff-photo')
    expect(markup).not.toContain('stimuli/citrus.png')
    expect(markup).toContain('$2,500.00')
    expect(markup).not.toContain('>—<')
    expectOrder(markup, [
      'Citrus bar',
      'Design A',
      'Completions',
      '1,000',
      'Total',
      '$2,500.00',
    ])
  })
})

describe('AwaitingPaymentNotice', () => {
  it('keeps the published study read-only until checkout', () => {
    const markup = renderToStaticMarkup(
      createElement(AwaitingPaymentNotice, { onContinue: () => {} }),
    )

    expect(markup).toContain('role="status"')
    expect(markup).not.toContain('role="dialog"')
    expectOrder(markup, [
      'Awaiting payment',
      'This order is in. Changes here do not change the study.',
      'Continue to checkout',
    ])
  })
})
