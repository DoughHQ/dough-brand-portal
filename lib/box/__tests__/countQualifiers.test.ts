import { describe, expect, it } from 'vitest'
import { createEmptyBoxDraft } from '../defaults'
import {
  boxDraftToQualifierArgs,
  parseCountBoxQualifiers,
} from '../countQualifiers'
import type { BoxStudyDraft } from '../types'

function draft(overrides: Partial<BoxStudyDraft> = {}): BoxStudyDraft {
  return {
    ...createEmptyBoxDraft(1),
    focalProductId: 30012404,
    ...overrides,
    eligibility: {
      ...createEmptyBoxDraft(1).eligibility,
      ...overrides.eligibility,
    },
  }
}

describe('boxDraftToQualifierArgs', () => {
  it('returns null without a hero product', () => {
    expect(boxDraftToQualifierArgs(draft({ focalProductId: null }))).toBeNull()
  })

  it('sends only the hero and default experience when nothing else is set', () => {
    expect(boxDraftToQualifierArgs(draft())).toEqual({
      p_focal_product_id: 30012404,
      p_eligibility_tier: 'any',
    })
  })

  it('omits empty arrays and null numeric filters', () => {
    const args = boxDraftToQualifierArgs(
      draft({
        eligibilityTier: 'tried',
        eligibility: {
          ...createEmptyBoxDraft(1).eligibility,
          requiredDietaryFlags: [],
          targetStates: [],
          minAge: null,
        },
      })
    )
    expect(args).toEqual({
      p_focal_product_id: 30012404,
      p_eligibility_tier: 'tried',
    })
    expect(args).not.toHaveProperty('p_required_dietary_flags')
    expect(args).not.toHaveProperty('p_min_age')
    expect(args).not.toHaveProperty('p_target_states')
  })

  it('includes only filters the brand has set', () => {
    expect(
      boxDraftToQualifierArgs(
        draft({
          eligibilityTier: 'not_tried',
          eligibility: {
            ...createEmptyBoxDraft(1).eligibility,
            requiredDietaryFlags: ['no_dairy'],
            minAge: 21,
            maxAge: 45,
            allowedGenders: ['female'],
            targetStates: ['NY', 'CA'],
            targetCountries: ['US'],
            minAccountAgeDays: 14,
          },
        })
      )
    ).toEqual({
      p_focal_product_id: 30012404,
      p_eligibility_tier: 'not_tried',
      p_required_dietary_flags: ['no_dairy'],
      p_min_age: 21,
      p_max_age: 45,
      p_allowed_genders: ['female'],
      p_target_states: ['NY', 'CA'],
      p_target_countries: ['US'],
      p_min_account_age_days: 14,
    })
  })

  it('omits category params until a bar is set', () => {
    const args = boxDraftToQualifierArgs(
      draft({
        eligibility: {
          ...createEmptyBoxDraft(1).eligibility,
          qualifyingTaxonomyNodeId: 99,
        },
      })
    )
    expect(args).not.toHaveProperty('p_qualifying_taxonomy_node_id')
  })

  it('sends category-mastery params when a bar is set', () => {
    expect(
      boxDraftToQualifierArgs(
        draft({
          eligibility: {
            ...createEmptyBoxDraft(1).eligibility,
            qualifyingTaxonomyNodeId: 99,
            minCategoryBattles: 3,
            minCategoryLevel: 4,
          },
        })
      )
    ).toMatchObject({
      p_qualifying_taxonomy_node_id: 99,
      p_min_category_battles: 3,
      p_min_category_level: 4,
    })
  })
})

describe('parseCountBoxQualifiers', () => {
  it('parses the live RPC object', () => {
    expect(
      parseCountBoxQualifiers({
        qualifying_users: 1,
        total_users: 19,
        pass_experience: 4,
        pass_rules: 2,
        below_viable_floor: true,
        warning: 'Thin audience — fewer than 30 people currently qualify.',
      })
    ).toEqual({
      qualifying_users: 1,
      total_users: 19,
      pass_experience: 4,
      pass_rules: 2,
      below_viable_floor: true,
      warning: 'Thin audience — fewer than 30 people currently qualify.',
    })
  })

  it('treats empty warning as null and unwraps a one-row array', () => {
    expect(
      parseCountBoxQualifiers([
        {
          qualifying_users: '40',
          total_users: 100,
          pass_experience: 80,
          pass_rules: 50,
          below_viable_floor: false,
          warning: null,
        },
      ])
    ).toEqual({
      qualifying_users: 40,
      total_users: 100,
      pass_experience: 80,
      pass_rules: 50,
      below_viable_floor: false,
      warning: null,
    })
  })
})
