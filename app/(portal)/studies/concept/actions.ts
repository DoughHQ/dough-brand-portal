'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { parseCreateCampaignDraftResult } from '@/lib/ihut/missionPublish'
import { draftToPublishPayload } from '@/lib/concept/publish'
import { humanizeConceptPublishHint } from '@/lib/concept/errors'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import type { Json } from '@/lib/database.types'
import {
  CONCEPT_DEFAULT_BRAND_ID,
  CONCEPT_DEFAULT_TAXONOMY_NODE_ID,
} from '@/lib/concept/constants'

export type ConceptCampaignOption = {
  id: string
  name: string
  created_at: string
}

export type ConceptPublishResult =
  | {
      ok: true
      missionId: string
      campaignId: string
    }
  | {
      ok: false
      error: string
      section: ReturnType<typeof humanizeConceptPublishHint>['section']
      hint: string | null
    }

function extractHint(error: { message?: string; hint?: string; code?: string }): string | null {
  if (typeof error.hint === 'string' && error.hint.trim()) return error.hint.trim()
  const msg = error.message ?? ''
  // PostgREST often puts HINT in message as "HINT_CODE: ..." or just the code
  const known = [
    'TITLE_REQUIRED',
    'NODE_REQUIRED',
    'INVALID_PRICE_POSTURE',
    'INVALID_SESSION_COUNT',
    'S2_INTERVAL_MUST_BE_NULL',
    'S2_INTERVAL_TOO_SMALL',
    'INVALID_SCORING_ROUNDS',
    'FIELD_TOO_SMALL',
    'NO_CONCEPT_ARM',
    'PRICE_ASYMMETRY',
    'MISSING_BATTLE_INTENT',
    'INVALID_BATTLE_INTENT',
    'NO_BATTLE_QUESTION',
    'CAMPAIGN_NOT_FOUND',
    'NOT_A_BRAND_PORTAL_USER',
    'CROSS_TENANT_ACCESS_DENIED',
    'NOT_AUTHORIZED',
    'FORBIDDEN',
  ]
  for (const code of known) {
    if (msg === code || msg.startsWith(code) || msg.includes(code)) return code
  }
  return null
}

export async function listBrandCampaignsAction(
  brandId: number = CONCEPT_DEFAULT_BRAND_ID
): Promise<ConceptCampaignOption[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('brand_campaigns')
    .select('id, name, created_at')
    .eq('brand_id', brandId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) {
    console.warn('listBrandCampaignsAction', error.message)
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    created_at: r.created_at,
  }))
}

export async function createConceptCampaignAction(args: {
  brandId?: number
  campaignName: string
  taxonomyNodeId?: number
  sessionCount?: 1 | 2
}): Promise<{ ok: true; campaignId: string } | { ok: false; error: string }> {
  const portalUser = await getPortalUser()
  if (!portalUser) return { ok: false, error: "You don't have access to that brand." }

  const brandId = args.brandId ?? CONCEPT_DEFAULT_BRAND_ID
  const taxonomyNodeId = args.taxonomyNodeId ?? CONCEPT_DEFAULT_TAXONOMY_NODE_ID
  const sessionCount = args.sessionCount ?? 1
  const name = args.campaignName.trim() || 'Concept study campaign'

  const supabase = await createServerSupabaseClient()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const rpcParams: {
    p_brand_id: number
    p_campaign_name: string
    p_mission_title: string
    p_mission_type: string
    p_operator_type: string
    p_taxonomy_node_id: number
    p_session_count: number
    p_starts_at: string
    p_expires_at: string
    p_session2_interval_hours?: number
  } = {
    p_brand_id: brandId,
    p_campaign_name: name,
    p_mission_title: 'Draft',
    p_mission_type: 'brand_challenge',
    p_operator_type: 'brand',
    p_taxonomy_node_id: taxonomyNodeId,
    p_session_count: sessionCount,
    p_starts_at: now.toISOString(),
    p_expires_at: expiresAt.toISOString(),
  }
  if (sessionCount === 2) {
    rpcParams.p_session2_interval_hours = 24
  }

  const { data, error } = await supabase.rpc('create_campaign_draft', rpcParams)
  if (error) {
    const hint = extractHint(error)
    const { text } = humanizeConceptPublishHint(hint, error.message)
    return { ok: false, error: text }
  }

  try {
    const parsed = parseCreateCampaignDraftResult(data)
    return { ok: true, campaignId: parsed.campaignId }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not create campaign.',
    }
  }
}

export async function publishConceptMissionAction(
  draft: ConceptStudyDraft
): Promise<ConceptPublishResult> {
  const portalUser = await getPortalUser()
  if (!portalUser) {
    return {
      ok: false,
      error: "You don't have access to that brand.",
      section: 'publish',
      hint: 'NOT_A_BRAND_PORTAL_USER',
    }
  }

  let campaignId = draft.brandCampaignId
  if (!campaignId) {
    const created = await createConceptCampaignAction({
      brandId: draft.brandId,
      campaignName: draft.title.trim() || 'Concept study',
      taxonomyNodeId: draft.taxonomyNodeId,
      sessionCount: draft.sessionCount,
    })
    if (!created.ok) {
      return {
        ok: false,
        error: created.error,
        section: 'title',
        hint: 'CAMPAIGN_NOT_FOUND',
      }
    }
    campaignId = created.campaignId
  }

  const { concepts, products, questions } = draftToPublishPayload(draft)
  const supabase = await createServerSupabaseClient()

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase.rpc('publish_concept_mission', {
    p_brand_campaign_id: campaignId,
    p_brand_id: draft.brandId,
    p_title: draft.title.trim(),
    p_taxonomy_node_id: draft.taxonomyNodeId,
    p_concepts: concepts as unknown as Json,
    p_products: products as unknown as Json,
    p_questions: questions as unknown as Json,
    p_created_by: portalUser.auth_uid,
    p_price_posture: draft.pricePosture,
    p_session_count: draft.sessionCount,
    p_session2_interval_hours:
      draft.sessionCount === 2 ? draft.session2IntervalHours : null,
    p_scoring_rounds: draft.scoringRounds,
    p_expires_at: expiresAt,
    p_predictive_validity_opt_in: draft.predictiveValidityOptIn,
    p_category_intelligence_opt_in: draft.categoryIntelligenceOptIn,
    p_audience_definition: draft.audienceDefinition.trim() || null,
  })

  if (error) {
    const hint = extractHint(error)
    const humanized = humanizeConceptPublishHint(hint, error.message)
    return {
      ok: false,
      error: humanized.text,
      section: humanized.section,
      hint,
    }
  }

  const root =
    data != null && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null
  const missionId =
    (typeof root?.mission_id === 'string' && root.mission_id) ||
    (typeof root?.id === 'string' && root.id) ||
    null

  if (!missionId) {
    return {
      ok: false,
      error: 'Publish succeeded but no mission id returned.',
      section: 'publish',
      hint: null,
    }
  }

  return { ok: true, missionId, campaignId }
}
