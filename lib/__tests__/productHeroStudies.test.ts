import { describe, expect, it } from 'vitest'
import {
  isHeroStudyForProduct,
  toProductStudyCards,
  typeBadgeLabel,
} from '../productMaster/productHeroStudies'
import type { OperatorStudyRow } from '../studies/types'

function row(partial: Partial<OperatorStudyRow>): OperatorStudyRow {
  return {
    mission_id: 'm1',
    title: 'Odwalla box',
    status: 'active',
    lifecycle_state: 'active',
    is_finished: false,
    brand_id: 1,
    brand_name: 'Odwalla',
    focal_product_id: 99,
    focal_product_name: 'Fruit Smoothie Blend',
    template_code: null,
    mission_type: 'product_discovery',
    test_type: 'ihut',
    total_claims: 10,
    completed_claims: 4,
    target_completions: 20,
    created_at: '2026-08-01T00:00:00Z',
    expires_at: null,
    ...partial,
  }
}

describe('isHeroStudyForProduct', () => {
  it('keeps the study only when this product is the focal hero', () => {
    expect(isHeroStudyForProduct(row({ focal_product_id: 99 }), 99)).toBe(true)
    expect(isHeroStudyForProduct(row({ focal_product_id: 12 }), 99)).toBe(false)
    expect(isHeroStudyForProduct(row({ focal_product_id: null }), 99)).toBe(false)
  })

  it('drops drafts even when the focal id matches', () => {
    expect(
      isHeroStudyForProduct(row({ lifecycle_state: 'draft', focal_product_id: 99 }), 99)
    ).toBe(false)
  })
})

describe('toProductStudyCards', () => {
  it('maps owned iHUT rows and ignores competitor focals', () => {
    const cards = toProductStudyCards(
      [
        row({ mission_id: 'hero', focal_product_id: 99 }),
        row({ mission_id: 'other', focal_product_id: 1, title: 'Competitor slot' }),
      ],
      99
    )
    expect(cards).toHaveLength(1)
    expect(cards[0]).toMatchObject({
      missionId: 'hero',
      typeLabel: 'iHUT',
      badge: 'Live',
      progressDetail: '4 / 20 completions',
      progressPct: 20,
      isCampaignOwner: true,
    })
  })

  it('labels a co-sponsor when the RPC says the campaign is not ours', () => {
    const cards = toProductStudyCards(
      [row({ is_campaign_owner: false })],
      99,
      { alreadyHeroScoped: true }
    )
    expect(cards[0]?.isCampaignOwner).toBe(false)
  })

  it('uses Concept vs iHUT labels from test_type', () => {
    expect(typeBadgeLabel(row({ test_type: 'concept', mission_type: 'concept_test' }))).toBe(
      'Concept'
    )
    expect(typeBadgeLabel(row({ test_type: 'ihut' }))).toBe('iHUT')
  })
})
