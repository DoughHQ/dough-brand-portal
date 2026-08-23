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
  it('offers value + ranking on both types, loyalty only on iHUT', () => {
    expect(pickableModulesFor('concept').map((m) => m.code)).toEqual([
      MODULE_VALUE,
      MODULE_FIELD_RANKING,
    ])
    expect(pickableModulesFor('ihut').map((m) => m.code)).toEqual([
      MODULE_VALUE,
      MODULE_FIELD_RANKING,
      MODULE_LOYALTY,
    ])
  })
})

describe('sanitizeSelectedModules', () => {
  it('drops derived codes, duplicates, and loyalty on concept', () => {
    expect(
      sanitizeSelectedModules(
        [MODULE_VALUE, MODULE_VALUE, MODULE_PACKAGING, MODULE_LOYALTY, 'nope'],
        'concept'
      )
    ).toEqual([MODULE_VALUE])
  })
})

describe('composeConceptPublishModules', () => {
  it('keeps the derived base first', () => {
    expect(
      composeConceptPublishModules('package', [MODULE_FIELD_RANKING])
    ).toEqual([MODULE_PACKAGING, MODULE_FIELD_RANKING])
  })
})

describe('resolveBoxSelectedModules', () => {
  it('seeds loyalty from the legacy boolean', () => {
    expect(
      resolveBoxSelectedModules({
        selectedModules: [MODULE_VALUE],
        loyaltyFollowUp: true,
      })
    ).toEqual([MODULE_VALUE, MODULE_LOYALTY])
  })
})
