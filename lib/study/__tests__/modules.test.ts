import { describe, expect, it } from 'vitest'
import {
  MODULE_FIELD_RANKING,
  MODULE_LOYALTY,
  MODULE_PACKAGING,
  MODULE_VALUE,
  composeConceptPublishModules,
  pickableModulesFor,
  resolveBoxSelectedModules,
  sanitizeSelectedModules,
} from '../modules'

describe('pickableModulesFor', () => {
  it('offers only the supported Day 2 module on iHUT', () => {
    expect(pickableModulesFor('concept').map((m) => m.code)).toEqual([])
    expect(pickableModulesFor('ihut').map((m) => m.code)).toEqual([MODULE_LOYALTY])
  })
})

describe('sanitizeSelectedModules', () => {
  it('drops retired, derived, unknown, and type-incompatible codes', () => {
    expect(
      sanitizeSelectedModules(
        [
          MODULE_VALUE,
          MODULE_FIELD_RANKING,
          MODULE_PACKAGING,
          MODULE_LOYALTY,
          'nope',
        ],
        'concept'
      )
    ).toEqual([])
  })
})

describe('composeConceptPublishModules', () => {
  it('keeps the derived base and drops retired extras', () => {
    expect(composeConceptPublishModules('package', [MODULE_FIELD_RANKING])).toEqual([
      MODULE_PACKAGING,
    ])
  })
})

describe('resolveBoxSelectedModules', () => {
  it('seeds loyalty from the legacy boolean and drops retired extras', () => {
    expect(
      resolveBoxSelectedModules({
        selectedModules: [MODULE_VALUE],
        loyaltyFollowUp: true,
      })
    ).toEqual([MODULE_LOYALTY])
  })
})
