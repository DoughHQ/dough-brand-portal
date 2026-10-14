import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { StudyOrderRow } from '@/lib/checkout/payment'
import StudyCheckoutDesk from '../../StudyCheckoutDesk'
import StudyCheckoutPriceForm from '../StudyCheckoutPriceForm'

vi.mock('server-only', () => ({}))
vi.mock('../../../checkoutActions', () => ({
  recordStudyPaymentAction: vi.fn(),
  setStudyPriceAction: vi.fn(),
}))

function order(overrides: Partial<StudyOrderRow> = {}): StudyOrderRow {
  return {
    mission_id: 'mission-1',
    brand_id: 7,
    title: 'Oat carton order',
    completions: 1,
    unit_price_cents: 400,
    amount_cents: 400,
    currency: 'usd',
    status: 'awaiting_payment',
    payment_reference: null,
    paid_at: null,
    created_at: '2026-02-01T15:00:00.000Z',
    ...overrides,
  }
}

describe('StudyCheckoutDesk', () => {
  it('lists an order before the price form', () => {
    const markup = renderToStaticMarkup(
      <StudyCheckoutDesk
        orders={[order()]}
        brandNames={{ 7: 'Maple' }}
        invoiceContactLabels={{ 'mission-1': 'ada@example.com' }}
        unitPriceCents={400}
        currency="usd"
      />,
    )

    const heading = markup.indexOf('>Awaiting payment<')
    const title = markup.indexOf('Oat carton order')
    const meta = markup.indexOf('Maple · $4.00 · ')
    const contact = markup.indexOf('ada@example.com')
    const link = markup.indexOf('href="/studies/mission-1/checkout"')
    const record = markup.indexOf('>Record payment<')
    const pricing = markup.indexOf('>Pricing<')
    expect(heading).toBeGreaterThanOrEqual(0)
    expect(title).toBeGreaterThan(heading)
    expect(meta).toBeGreaterThan(title)
    expect(contact).toBeGreaterThan(meta)
    expect(link).toBeGreaterThan(contact)
    expect(record).toBeGreaterThan(link)
    expect(pricing).toBeGreaterThan(record)
    expect(markup).toContain('>Open checkout<')
    expect(markup).toContain('Waive (design partner)')
    expect(markup).toContain('$4.00 per completed response. A change applies to new orders only.')
    expect(markup).not.toContain('No concept studies are waiting on payment.')
  })

  it('names a missing brand and an empty queue', () => {
    const markup = renderToStaticMarkup(
      <StudyCheckoutDesk
        orders={[order({ brand_id: 9 })]}
        brandNames={{}}
        invoiceContactLabels={{}}
        unitPriceCents={null}
        currency="usd"
      />,
    )

    expect(markup).toContain('Brand 9')
    expect(markup).toContain('No email on file')
    expect(markup).toContain('No concept price is set.')
  })

  it('says when nothing is waiting on payment', () => {
    const markup = renderToStaticMarkup(
      <StudyCheckoutDesk
        orders={[]}
        brandNames={{}}
        invoiceContactLabels={{}}
        unitPriceCents={400}
        currency="usd"
      />,
    )

    expect(markup).toContain('No concept studies are waiting on payment.')
    expect(markup).not.toContain('checkout-desk-row')
  })
})

describe('StudyCheckoutPriceForm', () => {
  it('keeps the price change disabled until a price exists', () => {
    const markup = renderToStaticMarkup(
      <StudyCheckoutPriceForm unitPriceCents={null} currency="usd" />,
    )

    expect(markup).toContain('No concept price is set.')
    expect(markup).toContain('disabled=""')
    expect(markup).toContain('>Change price<')
  })
})
