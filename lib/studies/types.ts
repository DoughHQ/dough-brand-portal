/** Server-resolved lifecycle — prefer over raw `status` (which can lie for expired rows). */
export type OperatorStudyLifecycleState =
  | 'active'
  | 'completed'
  | 'expired'
  | 'archived'
  | 'paused'
  | 'scheduled'
  | 'draft'

/** Row from list_operator_studies — tenancy enforced server-side by the RPC. */
export type OperatorStudyRow = {
  mission_id: string
  title: string
  status: 'active' | 'archived' | 'expired' | 'paused' | 'completed' | 'draft'
  /**
   * Source of truth for tabs/badges. Never recompute from status/expires_at in the UI.
   */
  lifecycle_state: OperatorStudyLifecycleState
  is_finished: boolean
  brand_id: number | null
  brand_name: string | null
  focal_product_id: number | null
  focal_product_name: string | null
  template_code: string | null
  /** missions.mission_type — e.g. concept_test, brand_challenge. */
  mission_type?: string | null
  /** From list_operator_studies — prefer over mission_type for Concept / iHUT badges. */
  test_type?: 'concept' | 'ihut' | null
  /** Session count when known (e.g. loyalty follow-up → 2); null if unset. */
  session_count?: number | null
  total_claims: number
  completed_claims: number
  /** Ordered completion count when set at publish; null = unknown — never invent from total_claims. */
  target_completions?: number | null
  /** Cap on claims when set; null on most missions. Not a substitute for target_completions. */
  max_claims?: number | null
  created_at: string
  expires_at: string | null
  /** Present on list_product_hero_studies. True when the session brand owns the campaign. */
  is_campaign_owner?: boolean
}

/** Row from list_withdrawn_studies — tenancy enforced server-side by the RPC. */
export type WithdrawnStudyRow = {
  mission_id: string
  title: string
  status: string
  is_draft: boolean
  brand_id: number | null
  brand_name: string | null
  focal_product_id: number | null
  focal_product_name: string | null
  template_code: string | null
  total_claims: number
  completed_claims: number
  created_at: string
  deleted_at: string
}
