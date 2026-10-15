import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import BrandCorrectionsClient from '../../BrandCorrectionsClient'
import { waitingLabel } from '../brandQueue'

vi.mock('../../../admin/corrections/correctionsCase.css', () => ({}))
vi.mock('../../actions', () => ({
  listRelatedBrandCorrectionsAction: vi.fn(async () => []),
  loadMoreBrandCorrectionsAction: vi.fn(),
}))

const row = {
  id: 'c1',
  product_id: 7,
  created_at: '2026-10-11T12:00:00.000Z',
  correction_type: 'other',
  product_name_short: 'Oat Bar',
  product_name_display: 'Oat Bar',
  brand_name: 'Acme',
  current_category: 'Bars',
  current_category_path: null,
  proposed_category_label: null,
  evidence_preview_url: null,
  evidence_capture_path: null,
  product_image_url: null,
  user_notes: null,
  proposed_value: null,
  claude_corrected_value: null,
} as unknown as CorrectionReviewRow

describe('brand corrections inbox', () => {
  it('labels an empty queue and a counted wait', () => {
    expect(waitingLabel(0, false, 0)).toBe('Nothing waiting')
    expect(waitingLabel(1, false, 1)).toContain('1 waiting on ')
  })

  it('renders the quiet catalog', () => {
    const html = renderToStaticMarkup(
      <BrandCorrectionsClient initialRows={[]} renderedAt={0} />,
    )
    expect(html).toContain('Quiet catalog')
    expect(html).toContain('Nothing waiting')
    expect(html).not.toContain('Load more')
  })

  it('keeps load more on a paged inbox', () => {
    const html = renderToStaticMarkup(
      <BrandCorrectionsClient
        initialRows={[row]}
        initialHasMore
        initialCursor={{ createdAt: row.created_at, id: row.id }}
        pendingCount={4}
        renderedAt={Date.parse('2026-10-11T12:00:00.000Z')}
      />,
    )
    expect(html).toContain('Load more')
    expect(html).toContain('Oat Bar')
    expect(html).toContain('Waiting today')
    expect(html).toContain('J / K move')
  })
})
