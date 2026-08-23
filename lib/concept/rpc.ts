/**
 * Typed wrappers for concept publish / template preview RPCs.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import type { PackagingTemplateConfig } from './types'
import type { StudyModuleCode } from '@/lib/study/modules'
import { PACKAGING_TEMPLATE_CODE } from './constants'

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

export async function rpcBuildConceptQuestionsFromTemplate(
  supabase: Client,
  args: {
    p_template_code?: string
    p_config: PackagingTemplateConfig
  }
) {
  return supabase.rpc('build_concept_questions_from_template', {
    p_template_code: args.p_template_code ?? PACKAGING_TEMPLATE_CODE,
    p_config: args.p_config as unknown as Json,
  })
}
