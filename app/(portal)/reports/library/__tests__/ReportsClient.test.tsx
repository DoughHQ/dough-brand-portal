import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Brand } from '@/lib/queries'
import ReportsClient from '../../ReportsClient'
import { ReportsAllSections } from '../ReportsAllSections'
import { ReportsTypeGrid } from '../ReportsTypeGrid'
import type { Report } from '../reportsModel'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ from: vi.fn() }),
}))
vi.mock('../../reportsPage.css', () => ({}))
vi.mock('@/components/reports/reports_skeleton.css', () => ({}))
vi.mock('@/components/portal/skeleton_bones.css', () => ({}))

const report: Report = {
  report_catalog_id: 1,
  report_type: 'category_ranking',
  title: 'Snack rankings',
  description: 'Who wins snacks.',
  taxonomy_node_id: 7,
  taxonomy_level: 'l2',
  time_window_days: 90,
  min_battles: 25,
  verified_only: true,
  price_cents: 49900,
  category_name: 'Snacks',
}
const other: Report = {
  ...report,
  report_catalog_id: 2,
  report_type: 'health_benchmark',
  title: 'Health benchmark',
  description: null,
  taxonomy_node_id: null,
  verified_only: false,
}
const byId = (list: Report[]) => [...list].sort((a, b) => a.report_catalog_id - b.report_catalog_id)

describe('ReportsClient', () => {
  it('renders the header, toolbar, and loading skeleton before data arrives', () => {
    const html = renderToStaticMarkup(
      <ReportsClient brand={{ brand_name: 'Acme' } as unknown as Brand} isAdmin={false} brandId={3} />,
    )
    expect(html).toContain('reports-eyebrow">Acme<')
    expect(html).toContain('Reports reflect declared preference — not surveys, not panels.')
    expect(html).toContain('placeholder="Search reports…"')
    expect(html).toContain('reports-filter is-on')
    expect(html).toContain('All reports')
    expect(html).toContain('Loading reports')
    expect(html).not.toContain('No reports match your search.')
  })

  it('splits owned and purchasable reports on the All tab', () => {
    const html = renderToStaticMarkup(
      <ReportsAllSections
        reports={[report, other]}
        search=""
        isAdmin={false}
        purchasedIds={new Set([1])}
        sortReports={byId}
        brandCategoryIds={new Set([7])}
        brandName="Acme"
      />,
    )
    const expected = [
      'Category Rankings',
      'Your category',
      'Snack rankings',
      '90d battle window',
      '25+ battles required',
      'Verified products only',
      'Purchased',
      'View report',
      'Available to purchase',
      'Licensed to Acme for internal use.',
      'Health benchmark',
      'All products included',
      '$499',
      'One-time · Perpetual license',
      'Purchase',
    ]
    let cursor = 0
    for (const text of expected) {
      const next = html.indexOf(text, cursor)
      expect(next, text).toBeGreaterThanOrEqual(0)
      cursor = next + text.length
    }
  })

  it('shows the empty copy for a filtered type', () => {
    const html = renderToStaticMarkup(
      <ReportsTypeGrid
        filtered={[]}
        isAdmin
        purchasedIds={new Set()}
        sortReports={byId}
        brandCategoryIds={new Set()}
      />,
    )
    expect(html).toContain('No reports of this type yet.')
  })
})
