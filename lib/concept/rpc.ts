/**
 * Typed wrappers for concept publish / template preview RPCs.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import type { PackagingTemplateConfig } from './types'
import { PACKAGING_TEMPLATE_CODE } from './constants'

export type PublishConceptStudyArgs = {
  p_brand_campaign_id: string
  p_brand_id: number
  p_title: string
  p_taxonomy_node_id: number
  p_stimulus_mode: string
  p_concepts: Json
  p_products: Json
  p_template_config: Json
  p_questions: Json | null
  p_created_by: string
  p_price_posture: string
  p_scoring_rounds: number
  p_expires_at: string
  p_target_completions: number
  p_audience_definition: string | null
}

type Client = SupabaseClient<Database>

export async function rpcPublishConceptStudy(
  supabase: Client,
  args: PublishConceptStudyArgs
) {
  return supabase.rpc('publish_concept_study', {
    ...args,
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
