import { describe, expect, it } from 'vitest'
import {
  IHUT_COMPLETION_OVERAGE_PERCENT,
  IHUT_MAX_TARGET_COMPLETIONS,
  IHUT_RESPONDENT_WINDOW_DAYS,
  IHUT_RESPONDENT_WINDOW_MIN_DAYS,
  ihutInventoryPlan,
} from '../completionContract'

describe('IHUT completion contract', () => {
  it('prepares ten percent extra inventory, rounded up', () => {
    expect(ihutInventoryPlan(100)).toEqual({
      targetCompletions: 100,
      overagePercent: 10,
      overageUnits: 10,
      physicalUnits: 110,
    })
    expect(ihutInventoryPlan(31)).toMatchObject({
      overageUnits: 4,
      physicalUnits: 35,
    })
  })

  it('never rounds a positive target down to zero overage', () => {
    expect(ihutInventoryPlan(1)).toMatchObject({
      overageUnits: 1,
      physicalUnits: 2,
    })
  })

  it('rejects empty, fractional, and non-positive targets', () => {
    expect(ihutInventoryPlan(null)).toBeNull()
    expect(ihutInventoryPlan(0)).toBeNull()
    expect(ihutInventoryPlan(2.5)).toBeNull()
  })

  it('keeps derived inventory inside the Postgres integer domain', () => {
    expect(ihutInventoryPlan(IHUT_MAX_TARGET_COMPLETIONS)).toMatchObject({
      physicalUnits: 2_147_483_646,
    })
    expect(ihutInventoryPlan(IHUT_MAX_TARGET_COMPLETIONS + 1)).toBeNull()
  })

  it('keeps the default respondent window above the hard floor', () => {
    expect(IHUT_COMPLETION_OVERAGE_PERCENT).toBe(10)
    expect(IHUT_RESPONDENT_WINDOW_DAYS).toBeGreaterThanOrEqual(
      IHUT_RESPONDENT_WINDOW_MIN_DAYS
    )
  })
})
