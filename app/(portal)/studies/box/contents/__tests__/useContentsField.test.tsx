// @vitest-environment jsdom

import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyBoxDraft, createEmptyBoxFieldRow } from '@/lib/box/defaults'
import { useContentsField } from '../useContentsField'

describe('useContentsField', () => {
  it('drops unresolved seats left by older drafts', () => {
    const draft = createEmptyBoxDraft(1)
    draft.fieldProducts = [createEmptyBoxFieldRow()]
    const onChange = vi.fn()

    renderHook(() => useContentsField({ draft, onChange }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0]?.[0].fieldProducts).toEqual([])
  })

  it('leaves a resolved field unchanged', () => {
    const draft = createEmptyBoxDraft(1)
    draft.fieldProducts = [
      { ...createEmptyBoxFieldRow(), localId: 'kept', product_id: 4 },
    ]
    const onChange = vi.fn()

    renderHook(() => useContentsField({ draft, onChange }))

    expect(onChange).not.toHaveBeenCalled()
  })
})
