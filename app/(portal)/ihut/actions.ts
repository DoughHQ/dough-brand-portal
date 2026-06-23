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
  type QuestionType,
  type ProtocolQuestionRow,
  type ChallengerProductResult,
  type BrandMissionListItem,
  type MissionWizardDraft,
} from '@/lib/queries'

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
): Promise<{ campaignId: string; missionId: string; protocolId: string }> {
  return createCampaignDraft(brandId, portalUserAuthUid, wizardStudyType, focalProductId, taxonomyNodeId)
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
