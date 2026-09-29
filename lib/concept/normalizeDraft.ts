import { createEmptyConceptDraft } from './defaults'
import {
  DEFAULT_DECOY_OPTION,
  defaultSuccessBarsDraft,
} from './singleTest'
import type { ConceptStudyDraft } from './types'

/**
 * Hydrate a stored / server draft onto today's ConceptStudyDraft shape.
 * Concept is CORE-only: coerce legacy price / module drafts to packaging single-test.
 */
export function normalizeDraft(draft: ConceptStudyDraft): ConceptStudyDraft {
  const base = createEmptyConceptDraft()
  const { scoringRounds: _retired, ...legacy } = draft as ConceptStudyDraft & {
    scoringRounds?: unknown
  }

  const templateConfig = {
    ...base.templateConfig,
    ...(draft.templateConfig ?? {}),
    price_answer_mode: draft.templateConfig?.price_answer_mode ?? 'bands',
  }
  if (!templateConfig.decoy_option?.trim()) {
    templateConfig.decoy_option = DEFAULT_DECOY_OPTION
  }

  const rawArms = draft.conceptArms ?? base.conceptArms

  return {
    ...base,
    ...legacy,
    stimulusMode: 'package',
    templateConfig,
    taxonomyNodeId: draft.taxonomyNodeId ?? null,
    eligibility: {
      ...base.eligibility,
      ...(draft.eligibility ?? {}),
    },
    selectedModules: [],
    targetCompletions: Math.max(
      draft.targetCompletions ?? base.targetCompletions,
      30
    ),
    expiresAt: draft.expiresAt ?? base.expiresAt,
    pricePosture: 'blind',
    conceptArms: rawArms.map((arm, i) => ({
      localId: arm.localId,
      display_name: arm.display_name ?? '',
      frozen_price: null,
      arm_label: arm.arm_label || String.fromCharCode(65 + i),
      image_url: arm.image_url ?? null,
      image_filename: arm.image_filename ?? null,
      stimulus_payload: arm.stimulus_payload ?? {},
      battle_intent: arm.battle_intent,
      benchmark_role: arm.benchmark_role ?? null,
    })),
    products: (draft.products ?? []).map((p) => ({
      ...p,
      frozen_price: null,
      benchmark_role: p.benchmark_role ?? null,
    })),
    battlePromptCode: draft.battlePromptCode ?? 'CONCEPT_BATTLE_BUY',
    customBattlePrompt: draft.customBattlePrompt ?? null,
    brandQuestions: draft.brandQuestions ?? [],
    successBars: draft.successBars ?? defaultSuccessBarsDraft(),
    // Drop legacy questionnaire slots on hydrate
    screeners: [],
    diagnostics: [],
    floor: null,
    session2IntervalHours: base.session2IntervalHours,
  }
}
