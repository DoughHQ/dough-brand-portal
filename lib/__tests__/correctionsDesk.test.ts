import { describe, expect, it } from 'vitest'
import {
  brandCorrectionsHref,
  correctionsDeskHref,
  initialFocusIndex,
  insertAfterFocus,
  isAlreadyHandledError,
  mergeUniqueById,
  missingFocusNotice,
  parseBrandCorrectionsSearch,
  parseCorrectionsDeskSearch,
  reduceDeskQueue,
  relatedClaims,
  removeAndAdvance,
} from '../correctionsDesk'

describe('parseCorrectionsDeskSearch', () => {
  it('treats focus as a cursor in the global queue — product does not shrink the desk', () => {
    expect(
      parseCorrectionsDeskSearch({
        product: '30118146',
        focus: 'a2bf19fd-6a47-4fe6-9a32-9a6df28ea6cb',
      })
    ).toEqual({
      focusId: 'a2bf19fd-6a47-4fe6-9a32-9a6df28ea6cb',
      productFilterId: null,
    })
  })

  it('uses product as a filter only when there is no focus', () => {
    expect(parseCorrectionsDeskSearch({ product: '99' })).toEqual({
      focusId: null,
      productFilterId: 99,
    })
  })

  it('opens the unfiltered desk with empty params', () => {
    expect(parseCorrectionsDeskSearch({})).toEqual({
      focusId: null,
      productFilterId: null,
    })
  })
})

describe('correctionsDeskHref', () => {
  it('deep-links a case without a product filter', () => {
    expect(correctionsDeskHref({ focusId: 'c1', productFilterId: 99 })).toBe(
      '/admin/corrections?focus=c1'
    )
    expect(correctionsDeskHref({ focusId: 'c1' })).toBe('/admin/corrections?focus=c1')
  })

  it('encodes an explicit product filter', () => {
    expect(correctionsDeskHref({ productFilterId: 99 })).toBe('/admin/corrections?product=99')
  })
})

describe('brandCorrectionsHref', () => {
  it('deep-links a catalog report without a product filter', () => {
    expect(brandCorrectionsHref({ focusId: 'c1' })).toBe('/corrections?focus=c1')
    expect(brandCorrectionsHref()).toBe('/corrections')
  })
})

describe('parseBrandCorrectionsSearch', () => {
  it('reads focus only — product is not a brand inbox filter', () => {
    expect(
      parseBrandCorrectionsSearch({
        product: '30118146',
        focus: 'a2bf19fd-6a47-4fe6-9a32-9a6df28ea6cb',
      })
    ).toEqual({ focusId: 'a2bf19fd-6a47-4fe6-9a32-9a6df28ea6cb' })
    expect(parseBrandCorrectionsSearch({})).toEqual({ focusId: null })
  })
})

describe('removeAndAdvance', () => {
  const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('lands on the following row and keeps order', () => {
    expect(removeAndAdvance(rows, 'a')).toEqual({
      rows: [{ id: 'b' }, { id: 'c' }],
      focusIndex: 0,
    })
    expect(removeAndAdvance(rows, 'b')).toEqual({
      rows: [{ id: 'a' }, { id: 'c' }],
      focusIndex: 1,
    })
  })

  it('lands on the previous row when the last item is completed', () => {
    expect(removeAndAdvance(rows, 'c')).toEqual({
      rows: [{ id: 'a' }, { id: 'b' }],
      focusIndex: 1,
    })
  })

  it('empties the page when the only row is completed', () => {
    expect(removeAndAdvance([{ id: 'a' }], 'a')).toEqual({ rows: [], focusIndex: 0 })
  })
})

describe('initialFocusIndex', () => {
  it('pins the focused row, else the first row', () => {
    expect(initialFocusIndex([{ id: 'a' }, { id: 'b' }], 'b')).toBe(1)
    expect(initialFocusIndex([{ id: 'a' }, { id: 'b' }], 'missing')).toBe(0)
    expect(initialFocusIndex([], 'b')).toBe(0)
  })
})

describe('missingFocusNotice', () => {
  it('is silent when the cursor is on a live row', () => {
    expect(missingFocusNotice([{ id: 'a' }], 'a')).toBeNull()
    expect(missingFocusNotice([{ id: 'a' }], null)).toBeNull()
  })

  it('tells the operator the bookmark is dead instead of silently swapping products', () => {
    expect(missingFocusNotice([{ id: 'a' }], 'gone')).toBe(
      'That case is no longer pending. Showing the next one in the queue.'
    )
    expect(missingFocusNotice([], 'gone')).toBe('That case is no longer pending.')
  })

  it('speaks as a catalog report when the brand bookmark is dead', () => {
    expect(
      missingFocusNotice([{ id: 'a' }], 'gone', {
        empty: 'That report is no longer waiting.',
        next: 'That report is no longer waiting. Showing the next one on your catalog.',
      })
    ).toBe('That report is no longer waiting. Showing the next one on your catalog.')
  })
})

describe('reduceDeskQueue', () => {
  it('keeps a prefetch that landed while the open case was applying', () => {
    const afterPrefetch = reduceDeskQueue(
      { rows: [{ id: 'a' }, { id: 'b' }], focusIndex: 0 },
      { type: 'append', incoming: [{ id: 'c' }] }
    )
    expect(afterPrefetch.rows.map((r) => r.id)).toEqual(['a', 'b', 'c'])
    const afterApply = reduceDeskQueue(afterPrefetch, { type: 'drop', id: 'a' })
    expect(afterApply.rows.map((r) => r.id)).toEqual(['b', 'c'])
    expect(afterApply.focusIndex).toBe(0)
  })

  it('opens a related claim against the current queue, not a snapshot', () => {
    const afterPrefetch = reduceDeskQueue(
      { rows: [{ id: 'a' }], focusIndex: 0 },
      { type: 'append', incoming: [{ id: 'c' }] }
    )
    const opened = reduceDeskQueue(afterPrefetch, { type: 'openRelated', row: { id: 'b' } })
    expect(opened.rows.map((r) => r.id)).toEqual(['a', 'b', 'c'])
    expect(opened.focusIndex).toBe(1)
  })
})

describe('mergeUniqueById', () => {
  it('appends unseen rows and keeps the loaded order', () => {
    expect(mergeUniqueById([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }])).toEqual([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ])
  })
})

describe('insertAfterFocus', () => {
  it('focuses a row already in the page without reordering', () => {
    expect(insertAfterFocus([{ id: 'a' }, { id: 'b' }], 'a', { id: 'b' })).toEqual({
      rows: [{ id: 'a' }, { id: 'b' }],
      focusIndex: 1,
    })
  })

  it('inserts a new related claim after the open case', () => {
    expect(insertAfterFocus([{ id: 'a' }, { id: 'c' }], 'a', { id: 'b' })).toEqual({
      rows: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      focusIndex: 1,
    })
  })
})

describe('relatedClaims', () => {
  it('lists same-SKU queue rows first, then fetched extras', () => {
    const focused = { id: 'a', product_id: 1 }
    const queue = [
      focused,
      { id: 'b', product_id: 1 },
      { id: 'z', product_id: 2 },
    ]
    const fetched = [
      { id: 'a', product_id: 1 },
      { id: 'b', product_id: 1 },
      { id: 'c', product_id: 1 },
    ]
    expect(relatedClaims(focused, queue, fetched)).toEqual([
      { id: 'b', product_id: 1 },
      { id: 'c', product_id: 1 },
    ])
  })
})

describe('isAlreadyHandledError', () => {
  it('treats a concurrent review as skip, not a desk crash', () => {
    expect(isAlreadyHandledError('Submission is not pending review')).toBe(true)
    expect(isAlreadyHandledError('Pick a reject reason first.')).toBe(false)
  })
})
