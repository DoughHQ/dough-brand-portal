import type {
  ConceptPublishConcept,
  ConceptPublishProduct,
  ConceptStudyDraft,
} from './types'
import type { PublishConceptStudyArgs } from './rpc'
import { armLabelForIndex } from './defaults'
import { priceToWire } from './price'
import { templateConfigToWire, composeVerificationOptions } from './templateConfig'
import { isIdentityConfirmed } from '@/lib/productEntryMode'
import { composeConceptPublishModules } from '@/lib/study/modules'
import {
  CONCEPT_SINGLE_TEST_ENABLED,
  STUDY_AUDIENCE_BUILDER_ENABLED,
} from '@/lib/studies/features'
import {
  MODULE_CONCEPT_CORE_V1,
  brandQuestionsToWire,
  defaultSuccessBarsDraft,
  successBarsToWire,
} from './singleTest'
import type { Json } from '@/lib/database.types'

/** Combinatorial pairs for a field of size n. Full round-robin battle count. */
export function uniquePairs(n: number): number {
  if (n < 2) return 0
  return (n * (n - 1)) / 2
}

function isHttpsUrl(raw: string | null | undefined): boolean {
  const s = (raw ?? '').trim()
  return /^https:\/\//i.test(s)
}

/**
 * Map UI draft → field arms for publish_study.
 * Questions / modules are resolved server-side from p_modules + p_module_config.
 */
export function draftToPublishPayload(
  draft: ConceptStudyDraft,
  opts?: { singleTest?: boolean }
): {
  concepts: ConceptPublishConcept[]
  products: ConceptPublishProduct[]
} {
  const singleTest = opts?.singleTest === true

  const concepts: ConceptPublishConcept[] = draft.conceptArms.map((arm, i) => {
    const intent =
      singleTest && arm.benchmark_role === 'current_pack'
        ? ('competitor' as const)
        : singleTest && arm.battle_intent === 'competitor'
          ? ('competitor' as const)
          : ('hero' as const)

    const base: ConceptPublishConcept = {
      arm_label: arm.arm_label || armLabelForIndex(i),
      display_name: arm.display_name.trim(),
      image_url: arm.image_url?.trim() || null,
      frozen_price: priceToWire(arm.frozen_price),
      stimulus_payload: arm.stimulus_payload ?? {},
      battle_intent: intent,
    }

    if (singleTest) {
      base.stimulus_type = 'package'
      if (arm.benchmark_role === 'current_pack') {
        base.benchmark_role = 'current_pack'
      }
    } else if (
      draft.stimulusMode &&
      draft.stimulusMode !== 'package' &&
      draft.stimulusMode !== 'price'
    ) {
      base.stimulus_type = draft.stimulusMode
    }
    return base
  })

  const resolvedProducts = draft.products.filter(
    (p): p is typeof p & { product_id: number } => p.product_id != null
  )
  if (resolvedProducts.some((p) => !p.upc?.trim() || !isIdentityConfirmed(p))) {
    throw new Error('UPC_REQUIRED')
  }
  const upcs = resolvedProducts.map((p) => p.upc!.trim())
  if (new Set(upcs).size !== upcs.length) {
    throw new Error('DUPLICATE_FIELD_UPC')
  }
  const ids = resolvedProducts.map((p) => p.product_id)
  if (new Set(ids).size !== ids.length) {
    throw new Error('DUPLICATE_COMPETITOR')
  }

  if (singleTest) {
    for (const arm of draft.conceptArms) {
      if (!isHttpsUrl(arm.image_url)) throw new Error('IMAGE_REQUIRED')
    }
    for (const p of resolvedProducts) {
      if (!isHttpsUrl(p.frozen_image_url)) throw new Error('IMAGE_REQUIRED')
    }
  }

  const products: ConceptPublishProduct[] = resolvedProducts.map((p) => {
    const row: ConceptPublishProduct = {
      product_id: p.product_id,
      frozen_display_name: p.frozen_display_name.trim(),
      frozen_brand_name: p.frozen_brand_name.trim(),
      frozen_image_url: p.frozen_image_url,
      frozen_price: priceToWire(p.frozen_price),
      market_reference_price: priceToWire(p.market_reference_price),
      battle_intent: 'competitor',
      upc: p.upc!.trim(),
    }
    if (singleTest && p.benchmark_role === 'competitor_to_beat') {
      row.benchmark_role = 'competitor_to_beat'
    }
    return row
  })

  return { concepts, products }
}

/**
 * Unset eligibility keys are omitted, not sent as null. The RPC treats a
 * present key as "this rule participates". Concept never sends
 * p_eligibility_tier (backend rejects any non-any tier).
 *
 * When the audience builder is off (V1), always omit eligibility so every
 * study is open. Pass `{ force: true }` in unit tests to exercise the wire
 * mapping without flipping the product flag.
 */
export function conceptEligibilityToWire(
  draft: ConceptStudyDraft,
  opts?: { force?: boolean }
): Record<string, unknown> | null {
  if (!STUDY_AUDIENCE_BUILDER_ENABLED && !opts?.force) return null
  const e = draft.eligibility
  if (!e) return null
  const wire: Record<string, unknown> = {}

  if (e.targetStates.length > 0) {
    wire.target_states = e.targetStates.map((s) => s.trim()).filter(Boolean)
  }
  if (e.targetCountries.length > 0) {
    wire.target_countries = e.targetCountries.map((s) => s.trim()).filter(Boolean)
  }
  if (e.requiredDietaryFlags.length > 0) {
    wire.required_dietary_flags = e.requiredDietaryFlags
  }
  if (e.allowedGenders.length > 0) {
    wire.allowed_genders = e.allowedGenders
  }
  if (e.minAge != null) wire.min_age = e.minAge
  if (e.maxAge != null) wire.max_age = e.maxAge
  if (e.minAccountAgeDays != null) wire.min_account_age_days = e.minAccountAgeDays
  if (e.qualifyingTaxonomyNodeId != null) {
    wire.qualifying_taxonomy_node_id = e.qualifyingTaxonomyNodeId
  }
  if (e.minCategoryBattles != null) wire.min_category_battles = e.minCategoryBattles
  if (e.minCategoryTries != null) wire.min_category_tries = e.minCategoryTries
  if (e.minCategoryLevel != null) wire.min_category_level = e.minCategoryLevel

  return Object.keys(wire).length > 0 ? wire : null
}

function singleTestModuleConfig(draft: ConceptStudyDraft): Record<string, unknown> {
  const wired = templateConfigToWire(draft.templateConfig)
  // Decoy label always derived from decoy_option — DECOY_LABEL_MISMATCH impossible.
  const decoy = draft.templateConfig.decoy_option.trim()
  const verification = composeVerificationOptions({
    ...draft.templateConfig,
    decoy_option: decoy,
  })

  const config: Record<string, unknown> = {
    category_plural: wired.category_plural,
    pack_size: wired.pack_size,
    expected_price: wired.expected_price,
    price_display: wired.price_display,
    decoy_option: decoy,
    verification_options: verification,
  }

  const custom = (draft.customBattlePrompt ?? '').trim()
  const code = draft.battlePromptCode ?? null
  if (custom) {
    // XOR: custom goes on p_battle_prompt, not in module_config code
  } else if (code) {
    config.battle_prompt_code = code
  } else {
    config.battle_prompt_code = 'CONCEPT_BATTLE_BUY'
  }

  const brandQs = brandQuestionsToWire(draft.brandQuestions ?? [])
  if (brandQs.length > 0) config.brand_questions = brandQs

  const bars = successBarsToWire(draft.successBars ?? defaultSuccessBarsDraft())
  if (bars) config.success_bars = bars

  return config
}

/** Full publish_study args for the concept branch. */
export function draftToConceptPublishStudyArgs(
  draft: ConceptStudyDraft,
  ctx: {
    campaignId: string
    createdBy: string
    expiresAt: string
  }
): PublishConceptStudyArgs {
  if (draft.taxonomyNodeId == null) throw new Error('NODE_REQUIRED')

  const singleTest = CONCEPT_SINGLE_TEST_ENABLED

  if (singleTest) {
    if (draft.stimulusMode !== 'package') {
      throw new Error('CORE_REQUIRES_PACKAGE_STIMULUS')
    }
  } else if (draft.stimulusMode !== 'package' && draft.stimulusMode !== 'price') {
    throw new Error('NO_TEMPLATE_FOR_MODE')
  }

  const { concepts, products } = draftToPublishPayload(draft, { singleTest })

  const customPrompt = singleTest
    ? (draft.customBattlePrompt ?? '').trim() || undefined
    : undefined

  const args: PublishConceptStudyArgs = {
    p_test_type: 'concept',
    p_brand_campaign_id: ctx.campaignId,
    p_brand_id: draft.brandId,
    p_title: draft.title.trim(),
    p_taxonomy_node_id: draft.taxonomyNodeId,
    p_field: {
      concepts: concepts as unknown as PublishConceptStudyArgs['p_field']['concepts'],
      products: products as unknown as PublishConceptStudyArgs['p_field']['products'],
    },
    p_modules: singleTest
      ? ([MODULE_CONCEPT_CORE_V1] as unknown as PublishConceptStudyArgs['p_modules'])
      : composeConceptPublishModules(draft.stimulusMode as 'package' | 'price', draft.selectedModules),
    p_module_config: (singleTest
      ? singleTestModuleConfig(draft)
      : templateConfigToWire(draft.templateConfig)) as unknown as PublishConceptStudyArgs['p_module_config'],
    p_created_by: ctx.createdBy,
    p_price_posture: singleTest
      ? 'blind'
      : draft.stimulusMode === 'package' || draft.stimulusMode === 'price'
        ? 'blind'
        : draft.pricePosture,
    p_expires_at: ctx.expiresAt,
    p_target_completions: draft.targetCompletions,
    p_audience_definition: draft.audienceDefinition.trim() || undefined,
  }

  if (customPrompt) {
    args.p_battle_prompt = customPrompt
  }

  if (singleTest) {
    args.p_predictive_validity_opt_in = draft.predictiveValidityOptIn !== false
    args.p_category_intelligence_opt_in = draft.categoryIntelligenceOptIn === true
  }

  const eligibility = conceptEligibilityToWire(draft)
  if (eligibility) {
    args.p_eligibility = eligibility as PublishConceptStudyArgs['p_eligibility']
  }

  return args
}

/** Stable snapshot of publish args for tests (drops created_by). */
export function publishArgsForFixtureCompare(
  args: PublishConceptStudyArgs
): Record<string, unknown> {
  const { p_created_by: _c, ...rest } = args
  return rest as unknown as Record<string, unknown>
}

export type { Json }
