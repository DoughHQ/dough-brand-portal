// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { OperatorBoxRow } from '@/lib/box/operator'

const mocks = vi.hoisted(() => ({
  listOperatorBoxesAction: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}))
vi.mock('../../actions', () => ({
  listOperatorBoxesAction: mocks.listOperatorBoxesAction,
}))

import AdminBoxesClient from '../../AdminBoxesClient'

function box(partial: Partial<OperatorBoxRow> = {}): OperatorBoxRow {
  return {
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
    ...partial,
  }
}

beforeEach(() => {
  mocks.searchParams.delete('tab')
  mocks.replace.mockReset()
  mocks.listOperatorBoxesAction.mockReset()
})

afterEach(cleanup)

describe('AdminBoxesClient behavior', () => {
  it('writes the selected queue tab into the URL', async () => {
    const user = userEvent.setup()
    render(
      <AdminBoxesClient
        initialRows={[]}
        initialHasMore={false}
        initialCursor={null}
        initialTab="live"
        loadError={null}
      />,
    )

    await user.click(screen.getByRole('tab', { name: 'Draft' }))

    expect(mocks.replace).toHaveBeenCalledWith('/admin/boxes?tab=draft')
  })

  it('reloads the tab when archived boxes are included', async () => {
    mocks.listOperatorBoxesAction.mockResolvedValue({
      ok: true,
      rows: [box({ title: 'Archived snack box', status: 'archived' })],
      hasMore: false,
      nextCursor: null,
    })
    const user = userEvent.setup()
    render(
      <AdminBoxesClient
        initialRows={[]}
        initialHasMore={false}
        initialCursor={null}
        initialTab="live"
        loadError={null}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Include archived' }))

    expect(mocks.listOperatorBoxesAction).toHaveBeenCalledWith({
      tab: 'live',
      includeArchived: true,
    })
    expect(await screen.findByText('Archived snack box')).toBeTruthy()
  })

  it('deduplicates load-more rows and surfaces a later pagination failure', async () => {
    const first = box()
    const second = box({
      box_id: 'box-2',
      mission_id: 'mission-2',
      title: 'Second snack box',
      created_at: '2026-09-01T12:00:00.000Z',
    })
    const cursor = { createdAt: first.created_at, id: first.box_id }
    mocks.listOperatorBoxesAction
      .mockResolvedValueOnce({
        ok: true,
        rows: [box({ title: 'Duplicate title' }), second],
        hasMore: true,
        nextCursor: { createdAt: second.created_at, id: second.box_id },
      })
      .mockResolvedValueOnce({
        ok: false,
        error: 'Could not load more boxes.',
      })
    const user = userEvent.setup()
    render(
      <AdminBoxesClient
        initialRows={[first]}
        initialHasMore
        initialCursor={cursor}
        initialTab="live"
        loadError={null}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByText('Second snack box')).toBeTruthy()
    expect(screen.queryByText('Duplicate title')).toBeNull()
    expect(mocks.listOperatorBoxesAction).toHaveBeenNthCalledWith(1, {
      tab: 'live',
      includeArchived: false,
      cursor,
    })

    await user.click(screen.getByRole('button', { name: 'Load more' }))
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Could not load more boxes.',
      ),
    )
    expect(screen.getByText('Second snack box')).toBeTruthy()
  })
})
