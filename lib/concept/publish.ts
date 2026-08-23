import type {
  ConceptPublishConcept,
  ConceptPublishProduct,
  ConceptStudyDraft,
} from './types'
import type { PublishConceptStudyArgs } from './rpc'
import { armLabelForIndex } from './defaults'
import { priceToWire } from './price'
import { templateConfigToWire } from './templateConfig'
import { isIdentityConfirmed } from '@/lib/productEntryMode'
import { conceptModulesForStimulusMode } from '@/lib/study/modules'

/** Combinatorial pairs for a field of size n. */
export function uniquePairs(n: number): number {
  if (n < 2) return 0
  return (n * (n - 1)) / 2
}

/** Default scoring rounds: min(10, pairs). */
export function defaultScoringRounds(fieldSize: number): number {
  const pairs = uniquePairs(fieldSize)
  if (pairs < 1) return 1
  return Math.min(10, pairs)
}

/**
 * Map UI draft → field arms for publish_study.
 * Questions / modules are resolved server-side from p_modules + p_module_config.
 */
export function draftToPublishPayload(draft: ConceptStudyDraft): {
  concepts: ConceptPublishConcept[]
  products: ConceptPublishProduct[]
} {
  const concepts: ConceptPublishConcept[] = draft.conceptArms.map((arm, i) => {
    const base: ConceptPublishConcept = {
      arm_label: arm.arm_label || armLabelForIndex(i),
      display_name: arm.display_name.trim(),
      image_url: arm.image_url?.trim() || null,
      frozen_price: priceToWire(arm.frozen_price),
      stimulus_payload: arm.stimulus_payload ?? {},
      battle_intent: 'hero',
    }
    if (
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

  const products: ConceptPublishProduct[] = resolvedProducts.map((p) => ({
    product_id: p.product_id,
    frozen_display_name: p.frozen_display_name.trim(),
    frozen_brand_name: p.frozen_brand_name.trim(),
    frozen_image_url: p.frozen_image_url,
    frozen_price: priceToWire(p.frozen_price),
    market_reference_price: priceToWire(p.market_reference_price),
    battle_intent: 'competitor',
    upc: p.upc!.trim(),
  }))

  return { concepts, products }
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
  if (draft.stimulusMode !== 'package' && draft.stimulusMode !== 'price') {
    throw new Error('NO_TEMPLATE_FOR_MODE')
  }

  const { concepts, products } = draftToPublishPayload(draft)

  return {
    p_test_type: 'concept',
    p_brand_campaign_id: ctx.campaignId,
    p_brand_id: draft.brandId,
    p_title: draft.title.trim(),
    p_taxonomy_node_id: draft.taxonomyNodeId,
    p_field: {
      concepts: concepts as unknown as PublishConceptStudyArgs['p_field']['concepts'],
      products: products as unknown as PublishConceptStudyArgs['p_field']['products'],
    },
    p_modules: conceptModulesForStimulusMode(draft.stimulusMode),
    p_module_config: templateConfigToWire(
      draft.templateConfig
    ) as unknown as PublishConceptStudyArgs['p_module_config'],
    p_created_by: ctx.createdBy,
    p_price_posture:
      draft.stimulusMode === 'package' || draft.stimulusMode === 'price'
        ? 'blind'
        : draft.pricePosture,
    p_expires_at: ctx.expiresAt,
    p_target_completions: draft.targetCompletions,
    p_audience_definition: draft.audienceDefinition.trim() || undefined,
  }
}
