import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import { CorrectionRail } from '../CorrectionRail'

const nowMs = Date.parse('2026-10-11T12:00:00.000Z')

function row(overrides: Record<string, unknown>): CorrectionReviewRow {
  return {
    id: 'c1',
    product_id: 4,
    product_name_short: 'Maple bar',
    correction_type: 'category',
    current_category: 'Dairy',
    proposed_category_label: 'Oat milk',
    created_at: '2026-10-11T12:00:00.000Z',
    product_image_url: null,
    ...overrides,
  } as unknown as CorrectionReviewRow
}

function rail(overrides: Partial<Parameters<typeof CorrectionRail>[0]> = {}) {
  return renderToStaticMarkup(
    <CorrectionRail
      rows={[
        row({ id: 'c1', product_name_short: 'Maple bar', product_image_url: null }),
        row({
          id: 'c2',
          product_name_short: 'Oat cup',
          product_image_url: 'https://cdn.example/oat.jpg',
          correction_type: 'name',
        }),
      ]}
      focusIndex={0}
      nowMs={nowMs}
      busyId={null}
      hasMore={false}
      loadingMore={false}
      cursor={null}
      queueLabel="2 in view"
      activeRailRef={{ current: null }}
      dispatch={vi.fn()}
      appendPage={vi.fn(async () => false)}
      {...overrides}
    />,
  )
}

describe('CorrectionRail', () => {
  it('lists the focused claim ahead of the next one', () => {
    const html = rail()
    const maple = html.indexOf('Maple bar')
    const oat = html.indexOf('Oat cup')
    expect(maple).toBeGreaterThan(-1)
    expect(oat).toBeGreaterThan(maple)
    expect(html).toContain('aria-label="Correction queue"')
    expect(html).toContain('>2 in view<')
    expect(html).toContain('aria-current="true"')
    expect(html).toContain('corr-rail-item is-on')
    expect(html).toContain('>Category<')
    expect(html).toContain('They want Dairy → Oat milk.')
    expect(html).toContain('Waiting today')
    expect(html).toContain('>M<')
    expect(html).toContain('src="https://cdn.example/oat.jpg"')
    expect(html).toContain('J / K move · A apply')
    expect(html).not.toContain('Load more')
  })

  it('offers another page while the queue still has more', () => {
    const html = rail({
      hasMore: true,
      loadingMore: true,
      cursor: { createdAt: '2026-10-11T12:00:00.000Z', id: 'c2' },
      busyId: 'c1',
    })
    expect(html).toContain('Loading…')
    expect(html).toContain('disabled=""')
    expect(html).toContain('J / K move · A apply')
  })
})
