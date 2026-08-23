import { sanitizeSelectedModules } from '@/lib/study/modules'
import { createEmptyConceptDraft } from './defaults'
import type { ConceptStudyDraft } from './types'

/** Hydrate a stored / server draft onto today's ConceptStudyDraft shape. */
export function normalizeDraft(draft: ConceptStudyDraft): ConceptStudyDraft {
  const base = createEmptyConceptDraft()
  const blindImageMode =
    draft.stimulusMode === 'package' || draft.stimulusMode === 'price'
  const priceMode = draft.stimulusMode === 'price'
  const rawArms = draft.conceptArms ?? base.conceptArms
  const armsSource = priceMode ? rawArms.slice(0, 1) : rawArms
  const { scoringRounds: _retired, ...legacy } = draft as ConceptStudyDraft & {
    scoringRounds?: unknown
  }
  return {
    ...base,
    ...legacy,
    stimulusMode: draft.stimulusMode ?? null,
    templateConfig: {
      ...base.templateConfig,
      ...(draft.templateConfig ?? {}),
      price_answer_mode: draft.templateConfig?.price_answer_mode ?? 'bands',
    },
    taxonomyNodeId: draft.taxonomyNodeId ?? null,
    eligibility: {
      ...base.eligibility,
      ...(draft.eligibility ?? {}),
    },
    selectedModules: sanitizeSelectedModules(draft.selectedModules, 'concept'),
    targetCompletions: draft.targetCompletions ?? base.targetCompletions,
    expiresAt: draft.expiresAt ?? base.expiresAt,
    pricePosture: blindImageMode ? 'blind' : draft.pricePosture ?? base.pricePosture,
    conceptArms: armsSource.map((arm, i) => ({
      localId: arm.localId,
      display_name: arm.display_name ?? '',
      frozen_price: blindImageMode ? null : arm.frozen_price ?? null,
      arm_label: arm.arm_label || String.fromCharCode(65 + i),
      image_url: arm.image_url ?? null,
      image_filename: arm.image_filename ?? null,
      stimulus_payload: arm.stimulus_payload ?? {},
    })),
    products: (draft.products ?? []).map((p) =>
      blindImageMode ? { ...p, frozen_price: null } : p
    ),
  }
}
