import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { redirect, getPortalBrandScope, createServerSupabaseClient, fetchStudyOrder } = vi.hoisted(
  () => ({
    redirect: vi.fn((href: string) => {
      throw new Error(`REDIRECT ${href}`)
    }),
    getPortalBrandScope: vi.fn(),
    createServerSupabaseClient: vi.fn(),
    fetchStudyOrder: vi.fn(),
  }),
)

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/lib/portal/getPortalBrandScope', () => ({ getPortalBrandScope }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient }))
vi.mock('@/lib/checkout/load', () => ({ fetchStudyOrder }))

import ConceptStudyStatusPage from '../../page'

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

async function renderStatus() {
  const element = await ConceptStudyStatusPage({
    params: Promise.resolve({ missionId: 'mission-9' }),
  })
  return renderToStaticMarkup(element)
}

describe('ConceptStudyStatusPage', () => {
  beforeEach(() => {
    redirect.mockClear()
    getPortalBrandScope.mockReset()
    createServerSupabaseClient.mockReset()
    fetchStudyOrder.mockReset()
    getPortalBrandScope.mockResolvedValue({ portalUser: { role: 'brand_user' } })
    createServerSupabaseClient.mockResolvedValue({})
    fetchStudyOrder.mockResolvedValue(null)
  })

  it('sends a signed-out visitor to login', async () => {
    getPortalBrandScope.mockResolvedValue(null)

    await expect(renderStatus()).rejects.toThrow('REDIRECT /login')
    expect(createServerSupabaseClient).not.toHaveBeenCalled()
  })

  it('sends an unpaid order to checkout', async () => {
    fetchStudyOrder.mockResolvedValue({ status: 'awaiting_payment' })

    await expect(renderStatus()).rejects.toThrow('REDIRECT /studies/mission-9/checkout')
  })

  it('offers the report once the study is paid or waived', async () => {
    fetchStudyOrder.mockResolvedValue({ status: 'paid' })
    const paid = await renderStatus()

    expect(paid).toContain('max-width:640px')
    expect(paid).toContain('Your study is live')
    expect(paid).toContain('Respondents can take it. The report appears once enough people finish.')
    expect(paid).toContain('href="/studies/concept/mission-9/report"')
    expect(paid).toContain('>View report<')
    expect(paid).not.toContain('This study is not live.')
    expectOrder(paid, [
      '← Studies',
      'Your study is live',
      'Respondents can take it.',
      'href="/studies/concept/mission-9/report"',
      'View report',
      'Back to studies',
    ])

    fetchStudyOrder.mockResolvedValue({ status: 'waived' })
    const waived = await renderStatus()
    expect(waived).toContain('Your study is live')
    expect(waived).toContain('>View report<')
  })

  it('explains a study that is not live', async () => {
    const markup = await renderStatus()

    expect(markup).toContain('Concept study')
    expect(markup).toContain(
      'This study is not live. If it has an order, checkout is where it gets paid.',
    )
    expect(markup).toContain('href="/studies"')
    expect(markup).toContain('Back to studies')
    expect(markup).not.toContain('View report')
    expect(markup).not.toContain('Your study is live')
  })
})
