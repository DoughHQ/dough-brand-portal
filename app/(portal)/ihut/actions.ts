'use server'

import {
  getEligiblePool,
  getQuestionTypes,
  getFocalProductTaxonomyNode,
  getAllBrandProducts,
  searchChallengerProducts,
  createCampaignDraft,
  upsertProtocolQuestions,
  getBrandMissions,
  getMissionWizardDraft,
  previewMissionFeasibility,
  publishMissionFromTemplate,
  type QuestionType,
  type ProtocolQuestionRow,
  type ChallengerProductResult,
  type BrandMissionListItem,
  type MissionWizardDraft,
  type CreateCampaignDraftResult,
  type PreviewMissionFeasibility,
  type PublishMissionResult,
} from '@/lib/queries'
import {
  extractRpcErrorCode,
  humanizeRpcError,
  PublishError,
} from '@/lib/ihut/missionPublish'

export async function getEligiblePoolAction(
  states: string[] | null,
  newToBrandId: number | null,
  taxonomyNodeId: number | null
): Promise<number> {
  return getEligiblePool(states, newToBrandId, taxonomyNodeId)
}

export async function getQuestionTypesAction(): Promise<QuestionType[]> {
  return getQuestionTypes()
}

export async function getFocalProductTaxonomyNodeAction(productId: number): Promise<number | null> {
  return getFocalProductTaxonomyNode(productId)
}

export async function getAllBrandProductsAction(brandId: number) {
  return getAllBrandProducts(brandId)
}

export async function searchChallengerProductsAction(
  query: string,
  excludeBrandId: number,
  excludeProductId: number | null
): Promise<ChallengerProductResult[]> {
  return searchChallengerProducts(query, excludeBrandId, excludeProductId)
}

export async function createCampaignDraftAction(
  brandId: number,
  portalUserAuthUid: string,
  wizardStudyType: 'discovery' | 'positioning' | 'head_to_head',
  focalProductId: number,
  taxonomyNodeId: number
): Promise<CreateCampaignDraftResult> {
  return createCampaignDraft(brandId, portalUserAuthUid, wizardStudyType, focalProductId, taxonomyNodeId)
}

export type PreviewActionResult =
  | { ok: true; preview: PreviewMissionFeasibility }
  | { ok: false; error: string }

export async function previewMissionFeasibilityAction(
  focalProductId: number,
  templateId: string
): Promise<PreviewActionResult> {
  try {
    const preview = await previewMissionFeasibility(focalProductId, templateId)
    return { ok: true, preview }
  } catch (err) {
    if (err instanceof PublishError) {
      return {
        ok: false,
        error: humanizeRpcError(err.hint, err.message),
      }
    }
    return {
      ok: false,
      error: humanizeRpcError(null, err instanceof Error ? err.message : String(err)),
    }
  }
}

export type PublishActionResult =
  | { ok: true; result: PublishMissionResult }
  | { ok: false; error: string; code: string | null }

export async function publishMissionFromTemplateAction(params: {
  brandCampaignId: string
  createdBy: string
  focalProductId: number
  nodeId: number
  templateId: string
  titleOverride?: string
  targetCompletions?: number
}): Promise<PublishActionResult> {
  try {
    const result = await publishMissionFromTemplate(params)
    return { ok: true, result }
  } catch (err) {
    if (err instanceof PublishError) {
      return {
        ok: false,
        error: humanizeRpcError(err.hint, err.message),
        code: extractRpcErrorCode(err.hint, err.message) ?? err.code,
      }
    }
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      error: humanizeRpcError(null, message),
      code: extractRpcErrorCode(null, message),
    }
  }
}

export async function upsertProtocolQuestionsAction(
  protocolId: string,
  questions: ProtocolQuestionRow[]
): Promise<void> {
  return upsertProtocolQuestions(protocolId, questions)
}

export async function getBrandMissionsAction(brandId: number): Promise<BrandMissionListItem[]> {
  return getBrandMissions(brandId)
}

export async function getMissionWizardDraftAction(
  missionId: string,
  brandId: number
): Promise<MissionWizardDraft | null> {
  return getMissionWizardDraft(missionId, brandId)
}
