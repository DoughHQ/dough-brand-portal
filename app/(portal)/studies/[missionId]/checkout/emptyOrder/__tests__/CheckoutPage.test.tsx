import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  redirect,
  getPortalBrandScope,
  createServerSupabaseClient,
  fetchStudyOrder,
  fetchCheckoutField,
  fetchMissionCheckoutWindow,
  getUser,
} = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT ${href}`)
  }),
  getPortalBrandScope: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  fetchStudyOrder: vi.fn(),
  fetchCheckoutField: vi.fn(),
  fetchMissionCheckoutWindow: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('../../checkout.css', () => ({}))
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/lib/portal/getPortalBrandScope', () => ({ getPortalBrandScope }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient }))
vi.mock('@/lib/checkout/load', () => ({
  fetchStudyOrder,
  fetchCheckoutField,
  fetchMissionCheckoutWindow,
}))

import CheckoutPage from '../../page'

const order = {
  mission_id: 'mission-9',
  brand_id: 4,
  title: 'Maple oat',
  completions: 1500,
  unit_price_cents: 400,
  amount_cents: 600000,
  currency: 'usd',
  status: 'awaiting_payment' as const,
  payment_reference: null,
  paid_at: null,
  created_at: '2026-03-01T00:00:00.000Z',
  settled_at: null,
  delivered_completions: null,
  refund_due_cents: null,
  refund_method: null,
  refund_reference: null,
  refunded_cents: null,
  refunded_at: null,
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

async function renderPage() {
  const element = await CheckoutPage({
    params: Promise.resolve({ missionId: 'mission-9' }),
  })
  return renderToStaticMarkup(element)
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    redirect.mockClear()
    getPortalBrandScope.mockReset()
    createServerSupabaseClient.mockReset()
    fetchStudyOrder.mockReset()
    fetchCheckoutField.mockReset()
    fetchMissionCheckoutWindow.mockReset()
    getUser.mockReset()
    getPortalBrandScope.mockResolvedValue({ portalUser: { role: 'brand_user' } })
    createServerSupabaseClient.mockResolvedValue({ auth: { getUser } })
    fetchStudyOrder.mockResolvedValue(null)
    getUser.mockResolvedValue({ data: { user: { email: 'ada@example.com' } } })
    fetchCheckoutField.mockResolvedValue({
      designs: [{ name: 'Oat carton', imageUrl: null, kind: 'design' }],
      products: [],
    })
    fetchMissionCheckoutWindow.mockResolvedValue({
      fieldingDays: 14,
      expiresAt: null,
      status: 'active',
    })
  })

  it('sends a signed-out visitor to login', async () => {
    getPortalBrandScope.mockResolvedValue(null)

    await expect(renderPage()).rejects.toThrow('REDIRECT /login')
    expect(createServerSupabaseClient).not.toHaveBeenCalled()
    expect(fetchStudyOrder).not.toHaveBeenCalled()
  })

  it('shows the empty order when this study has none', async () => {
    const markup = await renderPage()

    expect(markup).toContain('class="checkout-page"')
    expect(markup).toContain('class="checkout-back"')
    expect(markup).toContain('href="/studies"')
    expect(markup).toContain('class="checkout-title"')
    expect(markup).toContain('class="checkout-lede"')
    expect(markup).not.toContain('Checkout')
    expect(markup).not.toContain('Request invoice')
    expect(getUser).not.toHaveBeenCalled()
    expect(fetchCheckoutField).not.toHaveBeenCalled()
    expect(fetchMissionCheckoutWindow).not.toHaveBeenCalled()
    expectOrder(markup, ['← Studies', 'No order', 'This study has no order you can see.'])
  })

  it('hands the loaded order, packs, email, and window to the desk', async () => {
    fetchStudyOrder.mockResolvedValue(order)

    const markup = await renderPage()

    expect(fetchStudyOrder).toHaveBeenCalledWith(expect.any(Object), 'mission-9')
    expect(fetchCheckoutField).toHaveBeenCalledWith(expect.any(Object), 'mission-9')
    expect(fetchMissionCheckoutWindow).toHaveBeenCalledWith(expect.any(Object), 'mission-9')
    expect(getUser).toHaveBeenCalledOnce()
    expect(markup).toContain('Maple oat')
    expect(markup).toContain('Oat carton')
    expect(markup).toContain('14 days')
    expect(markup).toContain('Invoice to ada@example.com.')
    expect(markup).not.toContain('No order')
    expect(markup).not.toContain('This study has no order you can see.')
  })
})
