import { describe, expect, it } from 'vitest'
import {
  parseSampleComposition,
  sampleCompositionLabel,
} from '../reportSampleComposition'
import { parseConceptTestEnvelope } from '../conceptReport/conceptTestTypes'

const compositionPayload = {
  version: 1,
  cohort: 'completers',
  n_in_cohort: 12,
  n_with_age: 11,
  n_missing_age: 1,
  k_floor: 5,
  age_bands: [
    {
      band: '25-34',
      n: 7,
      share: 7 / 11,
      reportable: true,
      withheld_reason: null,
    },
    {
      band: '18-24',
      n: 4,
      share: null,
      reportable: false,
      withheld_reason: 'below_k_anonymity_floor',
    },
  ],
  brand_familiarity: [
    {
      segment: 'existing_purchaser',
      n: 8,
      share: 2 / 3,
      reportable: true,
      withheld_reason: null,
    },
  ],
  definitions: {
    age_band: 'Current age at freeze; DOB is never returned.',
  },
}

describe('parseSampleComposition', () => {
  it('parses reportable and withheld cells without identifiers', () => {
    const parsed = parseSampleComposition(compositionPayload)

    expect(parsed?.n_in_cohort).toBe(12)
    expect(parsed?.age_bands).toEqual([
      {
        key: '25-34',
        n: 7,
        share: 7 / 11,
        reportable: true,
        withheld_reason: null,
      },
      {
        key: '18-24',
        n: 4,
        share: null,
        reportable: false,
        withheld_reason: 'below_k_anonymity_floor',
      },
    ])
    expect(parsed?.definitions.age_band).not.toContain('1990')
  })

  it('returns null for missing cohort counts and tolerates unavailable familiarity', () => {
    expect(parseSampleComposition({ k_floor: 5 })).toBeNull()
    expect(
      parseSampleComposition({
        n_in_cohort: 0,
        k_floor: 5,
        age_bands: [],
        brand_familiarity: null,
      })?.brand_familiarity,
    ).toBeNull()
  })

  it('uses product-safe labels', () => {
    expect(sampleCompositionLabel('existing_purchaser')).toBe('Already bought or used')
    expect(sampleCompositionLabel('new_to_brand')).toBe('New to the brand')
  })
})

describe('parseConceptTestEnvelope', () => {
  it('carries top-level sample composition into a nested concept test report', () => {
    const report = parseConceptTestEnvelope({
      status: 'ok',
      sample_composition: compositionPayload,
      concept_test: {
        flow: 'concept_core_v1',
        sample: {},
        verdict: [],
      },
    })

    expect(report?.sample_composition?.n_in_cohort).toBe(12)
    expect(report?.sample_composition?.age_bands[1]?.reportable).toBe(false)
  })
})
