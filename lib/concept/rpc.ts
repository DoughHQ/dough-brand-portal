/**
 * Typed wrappers for concept publish / questionnaire walkthrough RPCs.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import type { StudyModuleCode } from '@/lib/study/modules'

export type PublishConceptStudyArgs = {
  p_test_type: 'concept'
  p_brand_campaign_id: string
  p_brand_id: number
  p_title: string
  p_taxonomy_node_id: number
  p_field: {
    concepts: Json
    products: Json
  }
  p_modules: StudyModuleCode[]
  p_module_config: Json
  p_battle_prompt?: string
  p_created_by: string
  p_price_posture: string
  p_expires_at: string
  p_target_completions: number
  p_audience_definition?: string
  p_eligibility?: Json
  p_predictive_validity_opt_in?: boolean
  p_category_intelligence_opt_in?: boolean
}

type Client = SupabaseClient<Database>

export async function rpcPublishConceptStudy(
  supabase: Client,
  args: PublishConceptStudyArgs
) {
  return supabase.rpc('publish_study', {
    ...args,
    p_field: args.p_field as unknown as Json,
    p_module_config: args.p_module_config,
    p_audience_definition: args.p_audience_definition ?? undefined,
  })
}

/** Read-only walkthrough questionnaire. */
export async function rpcPreviewConceptQuestionnaire(
  supabase: Client,
  args: {
    p_module_config: Json
    p_modules: StudyModuleCode[]
    p_battle_prompt?: string | null
  }
) {
  return supabase.rpc('preview_concept_questionnaire', {
    p_module_config: args.p_module_config,
    p_modules: args.p_modules,
    p_battle_prompt: args.p_battle_prompt ?? undefined,
  })
}
