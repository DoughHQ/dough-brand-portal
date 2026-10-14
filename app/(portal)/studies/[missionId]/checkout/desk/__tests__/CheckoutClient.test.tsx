import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { PRODUCT_NAME } from '@/lib/brand'
import type { StudyOrderRow } from '@/lib/checkout/payment'

vi.mock('../../checkout.css', () => ({}))

import CheckoutClient from '../../CheckoutClient'
import CheckoutOrderCard from '../CheckoutOrderCard'

function order(overrides: Partial<StudyOrderRow> = {}): StudyOrderRow {
  return {
    mission_id: 'mission-9',
    brand_id: 4,
    title: 'Maple oat',
    completions: 1500,
    unit_price_cents: 400,
    amount_cents: 600000,
    currency: 'usd',
    status: 'awaiting_payment',
    payment_reference: null,
    paid_at: null,
    created_at: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderCheckout(
  overrides: Partial<Parameters<typeof CheckoutClient>[0]> = {},
) {
  return renderToStaticMarkup(
    <CheckoutClient
      order={order()}
      designs={[{ name: 'Oat carton', imageUrl: 'https://cdn.example/oat.png', kind: 'design' }]}
      products={[{ name: '', imageUrl: null, kind: 'product' }]}
      email="  "
      fieldingDays={null}
      expiresAt={null}
      {...overrides}
    />,
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

describe('CheckoutClient', () => {
  it('shows the packs, the report, and an invoice request before payment', () => {
    const markup = renderCheckout()

    expect(markup).toContain('class="checkout-page"')
    expect(markup).toContain('href="/studies"')
    expect(markup).toContain('← Studies')
    expect(markup).toContain('A blind read of these packs, from real shoppers.')
    expect(markup).toContain('src="https://cdn.example/oat.png"')
    expect(markup).toContain('alt=""')
    expect(markup).toContain('class="checkout-subhead"')
    expect(markup).toContain('>·<')
    expect(markup).toContain('Until full')
    expect(markup).toContain('Or 90 days after it goes live')
    expect(markup).toContain('1,500 completed responses × $4.00')
    expect(markup).toContain('>$6,000.00<')
    expect(markup).toContain('Invoice to your account email.')
    expect(markup).toContain(`${PRODUCT_NAME} does not review the study.`)
    expect(markup).not.toContain('This study is live.')
    expect(markup).not.toContain('We&#x27;ll email')
    expect(markup).not.toContain("We'll email")
    expectOrder(markup, [
      '← Studies',
      'Checkout',
      'Maple oat',
      'The packs',
      'Oat carton',
      'They face',
      'Responses',
      'What you get back',
      'Win share',
      'href="/studies/concept/mission-9/report?preview=sample"',
      'Sample report',
      'Order',
      'Request invoice',
      'Real people, not bots or survey farms.',
    ])
  })

  it('shows a paid receipt and a live study link', () => {
    const markup = renderCheckout({
      order: order({ status: 'paid', payment_reference: 'INV-9' }),
      designs: [],
      products: [],
      email: 'ada@example.com',
    })

    expect(markup).toContain('This study is live.')
    expect(markup).toContain('Paid')
    expect(markup).toContain(' · INV-9')
    expect(markup).toContain('Your study is live.')
    expect(markup).toContain('href="/studies/concept/mission-9"')
    expect(markup).toContain('>Open study<')
    expect(markup).not.toContain('The packs')
    expect(markup).not.toContain('They face')
    expect(markup).not.toContain('Request invoice')
    expect(markup).not.toContain('Complimentary')
    expect(markup).not.toContain('checkout-assurances')
  })

  it('marks a waived order as complimentary', () => {
    const markup = renderCheckout({
      order: order({ status: 'waived' }),
      designs: [],
      products: [],
    })

    expect(markup).toContain('This study is live.')
    expect(markup).toContain('Complimentary')
    expect(markup).toContain('Your study is live.')
    expect(markup).not.toContain('>Paid<')
    expect(markup).not.toContain('Request invoice')
  })

  it('confirms the invoice email after the request', () => {
    const markup = renderToStaticMarkup(
      <CheckoutOrderCard
        order={order()}
        requested
        setRequested={() => undefined}
        unit="$4.00"
        total="$6,000.00"
        when={null}
        invoiceEmail="ada@example.com"
        settled={false}
      />,
    )

    expect(markup).toContain('role="status"')
    expect(markup).toContain(
      'We&#x27;ll email an invoice to ada@example.com within one business day. Your study goes live the moment it&#x27;s paid.',
    )
    expect(markup).not.toContain('Request invoice')
    expect(markup).toContain('Invoice to ada@example.com.')
  })
})
