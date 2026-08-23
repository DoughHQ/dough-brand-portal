import { describe, expect, it } from 'vitest'
import { MODULE_LOYALTY, MODULE_VALUE } from '@/lib/study/modules'
import { normalizeStoredBoxDraft } from '../draftStore'

describe('normalizeStoredBoxDraft modules migrate', () => {
  it('seeds MODULE_LOYALTY from a legacy loyaltyFollowUp draft', () => {
    const next = normalizeStoredBoxDraft(
      {
        draftId: 'd1',
        brandId: 1,
        loyaltyFollowUp: true,
        selectedModules: [MODULE_VALUE],
      } as never,
      1
    )
    expect(next.selectedModules).toEqual([MODULE_VALUE, MODULE_LOYALTY])
    expect(next.loyaltyFollowUp).toBe(true)
  })

  it('seeds loyalty from the retired sessionCount === 2', () => {
    const next = normalizeStoredBoxDraft(
      { draftId: 'd2', brandId: 1, sessionCount: 2 } as never,
      1
    )
    expect(next.selectedModules).toEqual([MODULE_LOYALTY])
  })
})
