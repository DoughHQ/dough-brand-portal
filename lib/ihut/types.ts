import type { Json } from '@/lib/database.types'

// BrandQuestion represents a user-added protocol question in the wizard draft.
// _id is a local React key only; it is stripped before persisting to protocol_questions.
export type BrandQuestion = {
  _id: string
  question_type_code: string
  session_number: 1 | 2
  position: number
  label: string | null
  config: Json
  selection_strategy: string | null
  selection_config: Json
  is_required: boolean
}

export type CampaignDraft = {
  // Server-side IDs, populated on completing Step 2
  campaignId: string | null
  missionId: string | null
  protocolId: string | null

  missionType: 'discovery' | 'positioning' | 'head_to_head' | null
  /** Resolved from mission_templates for commissioned studies; null for snapshot placeholders. */
  missionTemplateId: string | null
  /** Local menu key for the chosen product (snapshot tier id or template code). */
  menuProductKey: string | null
  focalProductId: string | null
  focalProductTaxonomyNodeId: number | null
  focalProductName: string | null
  challengerProductIds: string[]
  challengerMethod: 'genome_driven' | 'brand_excluded' | 'specific' | null
  targeting: {
    states: string[] // TODO: replace with state enum
    minCategoryBattles: number
    newToBrandOnly: boolean
    recentPurchaseOnly: boolean // TODO: no backend filter yet
  }
  targetCompletions: number
  payoutPerUserCents: number
  doughFeeCents: number
  questions: BrandQuestion[]
}
