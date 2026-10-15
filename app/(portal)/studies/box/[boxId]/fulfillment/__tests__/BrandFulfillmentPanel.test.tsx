import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const seeded: unknown[] = []
let budget = 0
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: (init: unknown) => {
      if (budget > 0) {
        budget--
        return [seeded.shift(), () => {}]
      }
      return actual.useState(init)
    },
  }
})
vi.mock('../actions', () => ({
  advanceBrandFulfillmentAction: async () => ({ ok: false, error: 'unused' }),
  listBrandBoxFulfillmentsAction: async () => ({ ok: false, error: 'unused' }),
}))

import BrandFulfillmentPanel from '../BrandFulfillmentPanel'

const row = (id: string, state: string, over: Record<string, unknown> = {}) => ({
  abandon_deadline: null,
  carrier: null,
  claimed_at: null,
  completed_at: null,
  confirmed_at: null,
  consent_version: null,
  consented_at: '2026-01-01',
  delivered_at: null,
  dings_reliability: false,
  fulfillment_id: id,
  left_at: null,
  left_reason: null,
  recipient_name: `Recipient ${id}`,
  session_1_completed_at: null,
  session_2_completed_at: null,
  ship_city: 'Town',
  ship_country: 'US',
  ship_hold: null,
  ship_line1: '1 Main',
  ship_line2: null,
  ship_phone: '555',
  ship_postal: '12345',
  ship_state: 'NY',
  shipped_at: null,
  state,
  terminal_reason: null,
  tracking_ref: null,
  ...over,
})

type Seed = {
  rows?: unknown
  holds?: unknown
  loadError?: string | null
  actionError?: string | null
  toast?: string | null
  shipFor?: string | null
  confirm?: unknown
}

function render(seed: Seed) {
  seeded.length = 0
  seeded.push(
    seed.rows ?? null,
    seed.holds ?? {},
    {},
    seed.loadError ?? null,
    seed.actionError ?? null,
    seed.toast ?? null,
    seed.shipFor ?? null,
    '',
    '',
    seed.confirm ?? null,
    '',
  )
  budget = 11
  const html = renderToStaticMarkup(<BrandFulfillmentPanel boxId="12345678-abcd" />)
  budget = 0
  return html.replaceAll('<!-- -->', '')
}

function inOrder(html: string, parts: string[]) {
  let cursor = 0
  for (const part of parts) {
    const at = html.indexOf(part, cursor)
    expect(at, part).toBeGreaterThanOrEqual(0)
    cursor = at + part.length
  }
}

describe('BrandFulfillmentPanel', () => {
  it('renders loading and load-error states', () => {
    expect(render({})).toContain('Loading seats…')
    const failed = render({ loadError: 'Could not load' })
    expect(failed).toContain('Could not load')
    expect(failed).not.toContain('Loading seats…')
  })

  it('renders the empty state', () => {
    const html = render({ rows: [] })
    expect(html).toContain('Packing · 0 seats')
    expect(html).toContain('No one has claimed a box yet.')
    expect(html).not.toContain('Download CSV')
  })

  it('renders seats with actions, holds, and messages in order', () => {
    const html = render({
      rows: [row('a', 'confirmed'), row('b', 'shipped'), row('c', 'confirmed')],
      holds: { c: 'ALLERGEN_CONFLICT' },
      toast: 'Saved!',
      actionError: 'Action failed',
    })
    inOrder(html, [
      'Packing · 3 seats',
      'Download CSV',
      'Saved!',
      'Action failed',
      'Recipient a',
      'Mark shipped',
      'Recipient b',
      'Mark delivered',
      'Delivery failed',
      'Recipient c',
      'On hold · respondent’s allergies now conflict with this box. Do not pack.',
    ])
    expect(html).not.toContain('Confirm shipped')
  })

  it('shows the ship form for the selected seat', () => {
    const html = render({ rows: [row('a', 'confirmed')], shipFor: 'a' })
    inOrder(html, ['Recipient a', 'Tracking # (optional)', 'Carrier', 'Confirm shipped', 'Cancel'])
  })
})
