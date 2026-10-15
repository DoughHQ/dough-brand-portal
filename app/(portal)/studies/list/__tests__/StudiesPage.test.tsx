import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PortalBrandScope } from '@/lib/portal/getPortalBrandScope'

vi.mock('server-only', () => ({}))

const {
  redirect,
  getPortalBrandScope,
  getBrand,
  fetchOperatorStudiesPage,
  getWithdrawnStudies,
  listStudyDraftsAction,
  attachOrderStatus,
  attachBoxIds,
  loadStaffCheckoutDesk,
  createServerSupabaseClient,
} = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT ${href}`)
  }),
  getPortalBrandScope: vi.fn(),
  getBrand: vi.fn(),
  fetchOperatorStudiesPage: vi.fn(),
  getWithdrawnStudies: vi.fn(),
  listStudyDraftsAction: vi.fn(),
  attachOrderStatus: vi.fn(),
  attachBoxIds: vi.fn(),
  loadStaffCheckoutDesk: vi.fn(),
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('../../studiesPage.css', () => ({}))
vi.mock('next/navigation', () => ({
  redirect,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}))
vi.mock('@/lib/portal/getPortalBrandScope', () => ({ getPortalBrandScope }))
vi.mock('@/lib/queries', () => ({ getBrand }))
vi.mock('@/lib/studies/fetchOperatorStudies', () => ({ fetchOperatorStudiesPage }))
vi.mock('@/lib/studies/fetchWithdrawnStudies', () => ({ getWithdrawnStudies }))
vi.mock('../../drafts/actions', () => ({ listStudyDraftsAction }))
vi.mock('@/lib/checkout/load', () => ({
  attachOrderStatus,
}))
vi.mock('@/lib/box/brandFulfillment', () => ({
  attachBoxIds,
}))
vi.mock('@/lib/checkout/loadStaffDesk', () => ({ loadStaffCheckoutDesk }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient }))

import StudiesPage from '../../page'

function scope(role: 'brand_admin' | 'dough_admin', isImpersonating = false): PortalBrandScope {
  return {
    effectiveBrandId: 7,
    isImpersonating,
    impersonatedBrandId: null,
    portalUser: { role, brand_id: 7 },
  } as unknown as PortalBrandScope
}

function study(title: string, missionId: string) {
  return {
    mission_id: missionId,
    title,
    status: 'active' as const,
    lifecycle_state: 'active' as const,
    is_finished: false,
    brand_id: 7,
    brand_name: 'Maple',
    focal_product_id: null,
    focal_product_name: null,
    template_code: null,
    test_type: 'concept' as const,
    total_claims: 0,
    completed_claims: 0,
    created_at: '2026-03-01T00:00:00.000Z',
    expires_at: null,
  }
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
  const element = await StudiesPage()
  return renderToStaticMarkup(element)
}

describe('StudiesPage', () => {
  beforeEach(() => {
    redirect.mockClear()
    getPortalBrandScope.mockReset()
    getBrand.mockReset()
    fetchOperatorStudiesPage.mockReset()
    getWithdrawnStudies.mockReset()
    listStudyDraftsAction.mockReset()
    attachOrderStatus.mockReset()
    attachBoxIds.mockReset()
    loadStaffCheckoutDesk.mockReset()
    createServerSupabaseClient.mockReset()
    loadStaffCheckoutDesk.mockResolvedValue({
      awaitingOrders: [],
      refundsOwed: [],
      orderBrandNames: {},
      invoiceContactLabels: {},
      conceptUnitPriceCents: null,
      conceptCurrency: 'usd',
    })
    getPortalBrandScope.mockResolvedValue(scope('brand_admin'))
    getBrand.mockResolvedValue({ brand_id: 7, brand_name: 'Maple' })
    fetchOperatorStudiesPage.mockImplementation(async (opts: { tab: string }) => ({
      ok: true,
      page: {
        rows: [study(opts.tab === 'active' ? 'Live maple' : 'Done maple', opts.tab)],
        hasMore: opts.tab === 'active',
        nextCursor: opts.tab === 'active' ? { createdAt: '2026-03-01T00:00:00.000Z', id: 'active' } : null,
      },
    }))
    getWithdrawnStudies.mockResolvedValue([
      {
        mission_id: 'withdrawn-1',
        title: 'Trashed oat',
        status: 'archived',
        is_draft: false,
        brand_id: 7,
        brand_name: 'Maple',
        focal_product_id: null,
        focal_product_name: null,
        template_code: null,
        total_claims: 0,
        completed_claims: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        deleted_at: '2026-02-01T00:00:00.000Z',
      },
    ])
    listStudyDraftsAction.mockResolvedValue({
      ok: true,
      drafts: [
        {
          id: 'draft-old',
          test_type: 'concept',
          title: 'Older draft',
          updated_by: 'ada',
          updated_at: '2026-01-01T00:00:00.000Z',
          created_at: '2026-01-01T00:00:00.000Z',
          expires_at: '2026-04-01T00:00:00.000Z',
        },
        {
          id: 'draft-new',
          test_type: 'concept',
          title: 'Newer draft',
          updated_by: 'ada',
          updated_at: '2026-03-01T00:00:00.000Z',
          created_at: '2026-01-02T00:00:00.000Z',
          expires_at: '2026-04-01T00:00:00.000Z',
        },
      ],
    })
    attachOrderStatus.mockImplementation(async (_supabase: unknown, rows: unknown[]) => rows)
    attachBoxIds.mockImplementation(async (_supabase: unknown, rows: unknown[]) =>
      (rows as { mission_id: string }[]).map((row) => ({ ...row, box_id: null }))
    )
    loadStaffCheckoutDesk.mockResolvedValue({
      awaitingOrders: [
        {
          mission_id: 'mission-9',
          brand_id: 4,
          title: 'Oat carton order',
          completions: 1500,
          unit_price_cents: 400,
          amount_cents: 600000,
          currency: 'usd',
          status: 'awaiting_payment',
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
        },
      ],
      refundsOwed: [],
      orderBrandNames: { 4: 'Maple' },
      invoiceContactLabels: { 'mission-9': 'ada@example.com' },
      conceptUnitPriceCents: 400,
      conceptCurrency: 'usd',
    })
    createServerSupabaseClient.mockResolvedValue({})
  })

  it('sends a signed-out visitor to login before loading studies', async () => {
    getPortalBrandScope.mockResolvedValue(null)

    await expect(renderPage()).rejects.toThrow('REDIRECT /login')
    expect(fetchOperatorStudiesPage).not.toHaveBeenCalled()
    expect(createServerSupabaseClient).not.toHaveBeenCalled()
    expect(getBrand).not.toHaveBeenCalled()
  })

  it('lists a brand workspace with newer drafts first', async () => {
    const markup = await renderPage()

    expect(fetchOperatorStudiesPage).toHaveBeenCalledWith({
      tab: 'active',
      limit: 25,
      brandId: 7,
      includeDrafts: false,
    })
    expect(fetchOperatorStudiesPage).toHaveBeenCalledWith({
      tab: 'complete',
      limit: 25,
      brandId: 7,
      includeDrafts: false,
    })
    expect(getBrand).toHaveBeenCalledWith(7)
    expect(getWithdrawnStudies).not.toHaveBeenCalled()
    expect(loadStaffCheckoutDesk).not.toHaveBeenCalled()
    expect(markup).toContain('Live maple')
    expect(markup).toContain('Done maple')
    expect(markup).toContain('>Load more<')
    expect(markup).not.toContain('Awaiting payment')
    expect(markup).not.toContain('Archived studies')
    expectOrder(markup, ['Newer draft', 'Older draft'])
  })

  it('redirects after the list load when the brand is missing', async () => {
    getBrand.mockResolvedValue(null)

    await expect(renderPage()).rejects.toThrow('REDIRECT /login')
    expect(fetchOperatorStudiesPage).toHaveBeenCalled()
    expect(createServerSupabaseClient).toHaveBeenCalled()
  })

  it('loads the staff desk for an operator', async () => {
    getPortalBrandScope.mockResolvedValue(scope('dough_admin'))

    const markup = await renderPage()

    expect(fetchOperatorStudiesPage).toHaveBeenCalledWith({
      tab: 'active',
      limit: 25,
      brandId: null,
      includeDrafts: false,
    })
    expect(getWithdrawnStudies).toHaveBeenCalledOnce()
    expect(loadStaffCheckoutDesk).toHaveBeenCalledOnce()
    expect(getBrand).not.toHaveBeenCalled()
    expect(markup).toContain('Awaiting payment')
    expect(markup).toContain('Refunds owed')
    expect(markup).toContain('No refunds are waiting.')
    expect(markup).toContain('Oat carton order')
    expect(markup).toContain('Maple')
    expect(markup).toContain('ada@example.com')
    expect(markup).toContain('$4.00 per completed response')
    expect(markup).toContain('Archived studies')
    expect(markup).toContain('(1)')
  })

  it('shows the active list error ahead of the complete list error', async () => {
    fetchOperatorStudiesPage.mockImplementation(async (opts: { tab: string }) => ({
      ok: false,
      error: opts.tab === 'active' ? 'Active failed' : 'Complete failed',
    }))

    const markup = await renderPage()

    expect(markup).toContain('Active failed')
    expect(markup).not.toContain('Complete failed')
    expect(markup).not.toContain('Live maple')
    expect(attachOrderStatus).toHaveBeenCalledWith(expect.any(Object), [])
  })
})
