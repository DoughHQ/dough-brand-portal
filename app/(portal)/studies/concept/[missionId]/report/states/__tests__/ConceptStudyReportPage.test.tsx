import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConceptReportErrorCode } from '@/lib/conceptReport/types'

const {
  redirect,
  getPortalBrandScope,
  createServerSupabaseClient,
  fetchConceptMissionReport,
  parseConceptTestReport,
  parseConceptTestEnvelope,
  rpc,
} = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT ${href}`)
  }),
  getPortalBrandScope: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  fetchConceptMissionReport: vi.fn(),
  parseConceptTestReport: vi.fn(),
  parseConceptTestEnvelope: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/lib/portal/getPortalBrandScope', () => ({ getPortalBrandScope }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient }))
vi.mock('@/lib/conceptReport/fetchReport', () => ({ fetchConceptMissionReport }))
vi.mock('@/lib/conceptReport/conceptTestTypes', () => ({
  parseConceptTestReport,
  parseConceptTestEnvelope,
}))
vi.mock('@/components/conceptReport/ConceptTestReportDeck', () => ({
  ConceptTestReportDeck: ({
    report,
    backHref,
  }: {
    report: { id: string }
    backHref: string
  }) => `deck:${report.id}:${backHref}`,
}))

import ConceptStudyReportPage from '../../page'
import { messageForCode } from '../conceptReportMessages'

function scope(role: 'brand_user' | 'dough_admin') {
  return { portalUser: { role } }
}

async function renderPage(preview?: string) {
  const element = await ConceptStudyReportPage({
    params: Promise.resolve({ missionId: 'mission-9' }),
    searchParams: Promise.resolve(preview ? { preview } : {}),
  })
  return renderToStaticMarkup(element)
}

describe('ConceptStudyReportPage', () => {
  beforeEach(() => {
    redirect.mockClear()
    getPortalBrandScope.mockReset()
    fetchConceptMissionReport.mockReset()
    parseConceptTestReport.mockReset()
    parseConceptTestEnvelope.mockReset()
    rpc.mockReset()
    rpc.mockResolvedValue({ data: { snapshot: true } })
    createServerSupabaseClient.mockResolvedValue({ rpc })
    getPortalBrandScope.mockResolvedValue(scope('brand_user'))
    parseConceptTestReport.mockReturnValue(null)
    parseConceptTestEnvelope.mockReturnValue(null)
    fetchConceptMissionReport.mockResolvedValue({ ok: false, code: 'NO_REPORT_YET' })
  })

  it('sends a signed-out visitor to login', async () => {
    getPortalBrandScope.mockResolvedValue(null)

    await expect(renderPage()).rejects.toThrow('REDIRECT /login')
    expect(createServerSupabaseClient).not.toHaveBeenCalled()
  })

  it('shows the sample fixture ahead of the deck', async () => {
    parseConceptTestReport.mockReturnValue({ id: 'sample' })

    const markup = await renderPage('sample')

    expect(markup).toContain('class="no-print"')
    expect(markup).toContain(
      'Preview fixture — not a live report. These numbers are an example of the format.',
    )
    expect(markup).toContain('deck:sample:/studies')
    expect(markup.indexOf('Preview fixture')).toBeLessThan(markup.indexOf('deck:sample:/studies'))
    expect(rpc).not.toHaveBeenCalled()
  })

  it('keeps the core preview behind the admin role', async () => {
    parseConceptTestReport.mockReturnValue({ id: 'core' })

    const member = await renderPage('core')
    expect(member).not.toContain('Preview fixture')
    expect(member).not.toContain('deck:core:/studies')

    getPortalBrandScope.mockResolvedValue(scope('dough_admin'))
    const admin = await renderPage('core')
    expect(admin).toContain('Preview fixture — not a live report.')
    expect(admin).toContain('deck:core:/studies')
  })

  it('renders a live concept test without the preview banner', async () => {
    parseConceptTestEnvelope.mockReturnValue({ id: 'live' })

    const markup = await renderPage()

    expect(markup).toContain('deck:live:/studies')
    expect(markup).not.toContain('Preview fixture')
    expect(markup).not.toContain('Report isn&#x27;t ready yet')
    expect(rpc).toHaveBeenCalledWith('get_concept_mission_report', {
      p_mission_id: 'mission-9',
    })
    expect(fetchConceptMissionReport).not.toHaveBeenCalled()
  })

  it('explains a missing snapshot and a legacy win-rate report', async () => {
    const missing = await renderPage()
    expect(missing).toContain('href="/studies"')
    expect(missing).toContain('← Back to studies')
    expect(missing).toContain('Report isn&#x27;t ready yet')
    expect(missing).toContain(
      'This study&#x27;s report isn&#x27;t ready yet. A frozen snapshot appears after compute runs for this mission. This page only reads that snapshot — it never recomputes.',
    )

    fetchConceptMissionReport.mockResolvedValue({ ok: true, report: { win_rate_field: [] } })
    const legacy = await renderPage()
    expect(legacy).toContain('Report isn&#x27;t ready yet')
    expect(legacy).toContain(
      'This study uses the single concept test. The verdict report appears once enough respondents have finished.',
    )
    expect(legacy).not.toContain('frozen snapshot')
  })
})

describe('messageForCode', () => {
  it('maps each report error onto the same card copy', () => {
    const cases: Array<[ConceptReportErrorCode, string]> = [
      ['NO_REPORT_YET', "Report isn't ready yet"],
      ['FORBIDDEN', 'No access'],
      ['NOT_A_PORTAL_USER', 'No access'],
      ['NOT_AUTHENTICATED', 'Sign in required'],
      ['FETCH_ERROR', "Couldn't load report"],
    ]

    expect(messageForCode('FORBIDDEN').body).toBe("You don't have access to this report.")
    expect(messageForCode('NOT_A_PORTAL_USER').body).toBe(
      "You don't have access to this report.",
    )
    expect(messageForCode('NOT_AUTHENTICATED').body).toBe('Sign in to view this report.')
    expect(messageForCode('FETCH_ERROR').body).toBe(
      'Something went wrong loading this report. Try again in a moment.',
    )
    for (const [code, title] of cases) {
      expect(messageForCode(code).title).toBe(title)
    }
  })
})
