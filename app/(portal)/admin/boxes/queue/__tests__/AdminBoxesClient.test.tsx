import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { OperatorBoxRow } from '@/lib/box/operator'
import AdminBoxesClient from '../../AdminBoxesClient'
import { parseTab } from '../boxesModel'

const { searchParams } = vi.hoisted(() => ({ searchParams: new URLSearchParams() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => searchParams,
}))
vi.mock('../../actions', () => ({
  listOperatorBoxesAction: vi.fn(),
}))

const row: OperatorBoxRow = {
  box_id: 'box-1',
  mission_id: 'mission-1',
  title: 'Spring snack box',
  brand_id: 3,
  brand_name: 'Acme',
  taxonomy_node_id: 7,
  category_name: 'Snacks',
  status: 'open',
  physical_units: 40,
  session_count: 2,
  blind_sponsor: true,
  field_size: 1,
  seats_claimed: 12,
  seats_active: 3,
  seats_completed: 9,
  seats_abandoned: 0,
  seats_delivery_failed: 0,
  seats_available: 28,
  expires_at: null,
  created_at: '2026-10-01T12:00:00.000Z',
  locked_at: null,
}

describe('AdminBoxesClient', () => {
  it('defaults unknown tabs to live', () => {
    expect(parseTab('draft')).toBe('draft')
    expect(parseTab('nope')).toBe('live')
    expect(parseTab(null)).toBe('live')
  })

  it('renders the empty live tab without Load more', () => {
    const html = renderToStaticMarkup(
      <AdminBoxesClient initialRows={[]} initialHasMore={false} initialCursor={null} initialTab="live" loadError={null} />,
    )
    expect(html).toContain('Sampling boxes')
    expect(html).toContain('href="/studies/box/new"')
    expect(html).toContain('No live boxes.')
    expect(html).toContain('Include archived')
    expect(html).not.toContain('Load more')
  })

  it('renders a box row, the error, and Load more in order', () => {
    const html = renderToStaticMarkup(
      <AdminBoxesClient
        initialRows={[row]}
        initialHasMore
        initialCursor={null}
        initialTab="live"
        loadError="Queue unavailable"
      />,
    )
    const expected = [
      'Sampling boxes',
      'role="alert"',
      'Queue unavailable',
      'aria-selected="true"',
      'href="/admin/boxes/box-1"',
      'Spring snack box',
      'Acme · Snacks · blind',
      'Open for claims',
      '28',
      ' / 40',
      '9 done · 3 active',
      '1 product · 2 sessions',
      'Load more',
    ]
    let cursor = 0
    for (const text of expected) {
      const next = html.indexOf(text, cursor)
      expect(next, text).toBeGreaterThanOrEqual(0)
      cursor = next + text.length
    }
  })
})
