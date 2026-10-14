// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import { useCorrectionsReview } from '../useCorrectionsReview'

const {
  extractCorrectionAction,
  listRelatedCorrectionsAction,
  loadMoreCorrectionsAction,
  reviewCorrectionAction,
} = vi.hoisted(() => ({
  extractCorrectionAction: vi.fn(),
  listRelatedCorrectionsAction: vi.fn(),
  loadMoreCorrectionsAction: vi.fn(),
  reviewCorrectionAction: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('../../actions', () => ({
  extractCorrectionAction,
  listRelatedCorrectionsAction,
  loadMoreCorrectionsAction,
  reviewCorrectionAction,
}))

function row(overrides: Record<string, unknown> = {}): CorrectionReviewRow {
  return {
    id: 'c1',
    product_id: 4,
    product_name_short: 'Maple bar',
    correction_type: 'category',
    current_category: 'Dairy',
    proposed_category_label: 'Oat milk',
    proposed_taxonomy_node_id: 9,
    created_at: '2026-10-11T12:00:00.000Z',
    ...overrides,
  } as unknown as CorrectionReviewRow
}

function renderDesk(rows: CorrectionReviewRow[] = [row()]) {
  return renderHook(() =>
    useCorrectionsReview({
      initialRows: rows,
      renderedAt: Date.parse('2026-10-11T12:00:00.000Z'),
    }),
  )
}

describe('useCorrectionsReview', () => {
  beforeEach(() => {
    extractCorrectionAction.mockReset()
    listRelatedCorrectionsAction.mockReset()
    loadMoreCorrectionsAction.mockReset()
    reviewCorrectionAction.mockReset()
    listRelatedCorrectionsAction.mockResolvedValue([])
  })

  it('labels an empty inbox and a single case in view', async () => {
    const empty = renderDesk([])
    expect(empty.result.current.queueLabel).toBe('Inbox zero')

    const one = renderDesk()
    expect(one.result.current.queueLabel).toBe('1 in view')
    expect(one.result.current.focused?.id).toBe('c1')
    await act(async () => {
      await Promise.resolve()
    })
  })

  it('applies a ready claim and drops it from the desk', async () => {
    reviewCorrectionAction.mockResolvedValue({ ok: true })
    const { result } = renderDesk()
    await act(async () => {
      await result.current.handleDecision('c1', 'approved')
    })
    expect(reviewCorrectionAction).toHaveBeenCalledWith('c1', 'approved', undefined)
    expect(result.current.flash).toBe('Applied.')
    expect(result.current.rows).toEqual([])
    expect(result.current.queueLabel).toBe('Inbox zero')
  })

  it('keeps a category claim open until a category is picked', async () => {
    const { result } = renderDesk([row({ proposed_taxonomy_node_id: null, proposed_value: null })])
    await act(async () => {
      await result.current.handleDecision('c1', 'approved')
    })
    expect(reviewCorrectionAction).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Pick a category first — nothing is ready to apply.')
    expect(result.current.editorOpenId).toBe('c1')
  })

  it('drops a case that was already handled', async () => {
    reviewCorrectionAction.mockResolvedValue({ ok: false, error: 'Submission is not pending' })
    const { result } = renderDesk()
    await act(async () => {
      await result.current.handleDecision('c1', 'approved')
    })
    expect(result.current.flash).toBe('Already handled.')
    expect(result.current.rows).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('opens the editor after a photo extract', async () => {
    extractCorrectionAction.mockResolvedValue({ ok: true, extracted_value: { name: 'Maple' } })
    const { result } = renderDesk([
      row({
        correction_type: 'nutrition_facts',
        evidence_preview_url: 'https://cdn.example/label.jpg',
      }),
    ])
    await act(async () => {
      await result.current.handleExtract('c1')
    })
    expect(result.current.flash).toBe('Draft ready — check it against the photo, then apply.')
    expect(result.current.editorOpenId).toBe('c1')
    expect(result.current.rows[0]?.extracted_value).toEqual({ name: 'Maple' })
  })

  it('moves focus down the queue from the keyboard', async () => {
    const { result } = renderDesk([row({ id: 'c1' }), row({ id: 'c2', product_name_short: 'Oat cup' })])
    expect(result.current.focusIndex).toBe(0)
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }))
    })
    expect(result.current.focusIndex).toBe(1)
    expect(result.current.focused?.id).toBe('c2')
  })
})
