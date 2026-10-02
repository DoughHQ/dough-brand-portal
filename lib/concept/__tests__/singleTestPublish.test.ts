import { describe, expect, it } from 'vitest'
import {
  createEmptyConceptDraft,
  newConceptArm,
  newProductCompetitor,
} from '../defaults'
import { draftToConceptPublishStudyArgs, draftToPublishPayload } from '../publish'
import { MODULE_CONCEPT_CORE_V1 } from '../singleTest'
import publishFixture from '../../../concept-core-fixtures/publish_args.json'

describe('concept CORE publish payload', () => {
  it('emits equal concepts + CONCEPT_CORE_V1 only — no benchmark_role', () => {
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
          display_name: 'Alt design',
          arm_label: 'Alt design',
          image_url:
            'https://rzovknemrvpioidkaqrk.supabase.co/storage/v1/object/public/concept-images/fixture/current-pack.png',
          battle_intent: 'hero',
        },
      ],
      products: [
        {
          ...newProductCompetitor(),
          product_id: 88401,
          frozen_display_name: 'Halo Top Vanilla Bean',
          frozen_brand_name: 'Halo Top',
          frozen_image_url:
            'https://rzovknemrvpioidkaqrk.supabase.co/storage/v1/object/public/concept-images/fixture/halo.png',
          upc: '858089003015',
          identityConfirmed: true,
        },
      ],
      templateConfig: {
        ...createEmptyConceptDraft().templateConfig,
        category_plural: 'pints of ice cream',
        pack_size: 'pint',
        expected_price: '5.99',
        decoy_option: 'Frostline',
        verification_options: [
          { id: 'a', label: 'Ben & Jerry\'s' },
          { id: 'b', label: 'Häagen-Dazs' },
          { id: 'decoy', label: 'Frostline' },
          { id: 'none_of_these', label: 'None of these' },
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
      battlePromptCode: 'CONCEPT_BATTLE_BUY',
      customBattlePrompt: null,
    })

    const payload = draftToPublishPayload(draft)
    expect(payload.concepts[0]).not.toHaveProperty('benchmark_role')
    expect(payload.concepts[1]).not.toHaveProperty('benchmark_role')
    expect(payload.concepts[1]).toMatchObject({
      battle_intent: 'hero',
    })
    expect(payload.products[0]).not.toHaveProperty('benchmark_role')

    const args = draftToConceptPublishStudyArgs(draft, {
      campaignId: '00000000-0000-0000-0000-000000000001',
      createdBy: '00000000-0000-0000-0000-000000000002',
      expiresAt: (publishFixture as { p_expires_at?: string }).p_expires_at ?? '2099-01-01T00:00:00Z',
    })
    expect(args.p_modules).toEqual([MODULE_CONCEPT_CORE_V1])
    expect(args.p_price_posture).toBe('blind')
    expect(args.p_target_completions).toBe(30)
    const concepts = args.p_field.concepts as unknown[]
    expect(concepts).toHaveLength(2)
    expect(concepts[0]).toMatchObject({ battle_intent: 'hero' })
    expect(concepts[1]).toMatchObject({ battle_intent: 'hero' })
    expect(concepts[0]).not.toHaveProperty('benchmark_role')
    expect(concepts[1]).not.toHaveProperty('benchmark_role')
    expect(args.p_module_config).toMatchObject({
      category_plural: 'pints of ice cream',
      pack_size: 'pint',
      decoy_option: 'Frostline',
      success_bars: { liking_mode: 'off' },
    })
    const mod = args.p_module_config as Record<string, unknown>
    expect(mod.brand_questions).toEqual([
      {
        prompt: 'Which flavor would you buy first?',
        options: ['Vanilla bean', 'Mint chip', 'Cookie dough'],
      },
    ])
  })

  it('always sends CONCEPT_CORE_V1 modules', () => {
    const draft = createEmptyConceptDraft({
      stimulusMode: 'package',
      title: 'T',
      taxonomyNodeId: 1,
      targetCompletions: 30,
      conceptArms: [
        {
          ...newConceptArm(0),
          display_name: 'A',
          image_url: 'https://example.com/a.png',
        },
        {
          ...newConceptArm(1),
          display_name: 'B',
          image_url: 'https://example.com/b.png',
          battle_intent: 'hero',
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
      templateConfig: {
        ...createEmptyConceptDraft().templateConfig,
        pack_size: 'pint',
        expected_price: '4.99',
        decoy_option: 'Frostline',
        verification_options: [
          { id: 'a', label: 'Brand A' },
          { id: 'b', label: 'Brand B' },
          { id: 'decoy', label: 'Frostline' },
          { id: 'none_of_these', label: 'None of these' },
        ],
      },
    })
    const args = draftToConceptPublishStudyArgs(draft, {
      campaignId: '00000000-0000-0000-0000-000000000001',
      createdBy: '00000000-0000-0000-0000-000000000002',
      expiresAt: '2099-01-01T00:00:00Z',
    })
    expect(args.p_modules).toEqual([MODULE_CONCEPT_CORE_V1])
  })
})
