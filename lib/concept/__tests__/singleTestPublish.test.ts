import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  createEmptyConceptDraft,
  newConceptArm,
  newProductCompetitor,
} from '../defaults'
import { draftToConceptPublishStudyArgs, draftToPublishPayload } from '../publish'
import { MODULE_CONCEPT_CORE_V1 } from '../singleTest'
import publishFixture from '../../../concept-core-fixtures/publish_args.json'

describe('single-test publish payload', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.doUnmock('@/lib/studies/features')
  })

  it('emits current_pack benchmark + CONCEPT_CORE_V1 when flag on', async () => {
    vi.doMock('@/lib/studies/features', () => ({
      CONCEPT_SINGLE_TEST_ENABLED: true,
      STUDY_AUDIENCE_BUILDER_ENABLED: false,
    }))
    const { draftToConceptPublishStudyArgs: argsFn, draftToPublishPayload: payloadFn } =
      await import('../publish')

    const draft = createEmptyConceptDraft({
      stimulusMode: 'package',
      title: 'fixture study',
      taxonomyNodeId: 9330085,
      brandId: 20016372,
      targetCompletions: 30,
      pricePosture: 'blind',
      conceptArms: [
        {
          ...newConceptArm(0),
          display_name: 'New design',
          arm_label: 'New design',
          image_url:
            'https://rzovknemrvpioidkaqrk.supabase.co/storage/v1/object/public/concept-images/fixture/new-design.png',
          battle_intent: 'hero',
        },
        {
          ...newConceptArm(1),
          display_name: 'Current pack',
          arm_label: 'Current pack',
          image_url:
            'https://rzovknemrvpioidkaqrk.supabase.co/storage/v1/object/public/concept-images/fixture/current-pack.png',
          battle_intent: 'competitor',
          benchmark_role: 'current_pack',
        },
      ],
      products: [
        {
          ...newProductCompetitor(),
          product_id: 30615039,
          frozen_display_name: 'PB Blondie Bestie Sundae',
          frozen_brand_name: "Ben & Jerry's",
          frozen_image_url:
            'https://rzovknemrvpioidkaqrk.supabase.co/storage/v1/object/public/concept-images/fixture/pb-blondie.png',
          upc: '00076840004492',
          identityConfirmed: true,
        },
      ],
      templateConfig: {
        ...createEmptyConceptDraft().templateConfig,
        category_plural: 'pints of ice cream',
        pack_size: 'pint',
        expected_price: '7.99',
        price_display: '7.99',
        decoy_option: 'Frostline',
        verification_options: [
          { id: 'brand:20000217', brand_id: 20000217, label: 'Häagen-Dazs' },
          { id: 'brand:20001741', brand_id: 20001741, label: 'HALO TOP' },
        ],
      },
      brandQuestions: [
        {
          localId: 'bq1',
          prompt: 'Which flavor would you buy first?',
          options: ['Vanilla bean', 'Mint chip', 'Cookie dough'],
          max_select: 1,
        },
      ],
    })

    const payload = payloadFn(draft, { singleTest: true })
    expect(payload.concepts[0]?.battle_intent).toBe('hero')
    expect(payload.concepts[0]).not.toHaveProperty('benchmark_role')
    expect(payload.concepts[1]).toMatchObject({
      battle_intent: 'competitor',
      benchmark_role: 'current_pack',
    })

    const args = argsFn(draft, {
      campaignId: publishFixture.p_brand_campaign_id,
      createdBy: 'user-1',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })
    expect(args.p_modules).toEqual([MODULE_CONCEPT_CORE_V1])
    expect(args.p_price_posture).toBe('blind')
    expect(args.p_target_completions).toBe(30)
    const concepts = args.p_field.concepts as unknown[]
    expect(concepts).toHaveLength(2)
    expect(concepts[1]).toMatchObject({
      benchmark_role: 'current_pack',
      battle_intent: 'competitor',
    })
    expect(args.p_module_config).toMatchObject({
      category_plural: 'pints of ice cream',
      pack_size: 'pint',
      decoy_option: 'Frostline',
    })
    const mod = args.p_module_config as Record<string, unknown>
    expect(mod.brand_questions).toEqual([
      {
        prompt: 'Which flavor would you buy first?',
        options: ['Vanilla bean', 'Mint chip', 'Cookie dough'],
      },
    ])
  })

  it('flag off keeps hero-only payload (no benchmark_role)', () => {
    const draft = createEmptyConceptDraft({
      stimulusMode: 'package',
      conceptArms: [
        {
          ...newConceptArm(0),
          display_name: 'Arm',
          image_url: 'https://example.com/a.png',
          benchmark_role: 'current_pack',
          battle_intent: 'competitor',
        },
      ],
      products: [
        {
          ...newProductCompetitor(),
          product_id: 1,
          frozen_display_name: 'X',
          frozen_brand_name: 'Y',
          frozen_image_url: 'https://example.com/b.png',
          upc: '028400017688',
          identityConfirmed: true,
        },
      ],
    })
    const payload = draftToPublishPayload(draft)
    expect(payload.concepts[0]?.battle_intent).toBe('hero')
    expect(payload.concepts[0]).not.toHaveProperty('benchmark_role')
  })
})
