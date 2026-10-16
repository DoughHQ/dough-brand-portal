'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { parseCreateCampaignDraftResult } from '@/lib/studies/parseCampaignDraft'
import { canPublishStudies } from '@/lib/studies/canPublishStudies'
import { studyBrandIdForRequest } from '@/lib/studies/studyBrandScope'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { draftToConceptPublishStudyArgs } from '@/lib/concept/publish'
import { resolvePublishError, type ConceptErrorSection } from '@/lib/concept/errors'
import { rpcPublishConceptStudy } from '@/lib/concept/rpc'
import type {
  ConceptPublishSuccessMeta,
  ConceptStudyDraft,
} from '@/lib/concept/types'
import {
  CONCEPT_DEFAULT_BRAND_ID,
  PACKAGING_TEMPLATE_CODE,
} from '@/lib/concept/constants'

export type ConceptCampaignOption = {
  id: string
  name: string
  created_at: string
}

export type ConceptPublishResult =
  | {
      ok: true
      meta: ConceptPublishSuccessMeta
    }
  | {
      ok: false
      error: string
      section: ConceptErrorSection
      hint: string | null
      productId?: number | null
      upc?: string | null
    }

function extractHint(error: { message?: string; hint?: string; code?: string }): string | null {
  if (typeof error.hint === 'string' && error.hint.trim()) return error.hint.trim()
  const msg = error.message ?? ''
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
    'DUPLICATE_COMPETITOR',
    'PRICE_ASYMMETRY',
    'MISSING_BATTLE_INTENT',
    'INVALID_BATTLE_INTENT',
    'UPC_REQUIRED',
    'UPC_INVALID',
    'UPC_PRODUCT_MISMATCH',
    'DUPLICATE_FIELD_UPC',
    'NO_BATTLE_QUESTION',
    'CAMPAIGN_NOT_FOUND',
    'NOT_A_BRAND_PORTAL_USER',
    'CROSS_TENANT_ACCESS_DENIED',
    'NOT_AUTHORIZED',
    'FORBIDDEN',
    'NO_AUTHOR',
    'CONCEPT_TIER_MUST_BE_ANY',
    'INVALID_ELIGIBILITY_TIER',
    'UNKNOWN_STATE',
    'QUALIFYING_NODE_NOT_FOUND',
    'CATEGORY_BAR_REQUIRES_NODE',
    'CATEGORY_LEVEL_OUT_OF_RANGE',
    'CATEGORY_BAR_INVALID',
    'OPTION_ID_UNRESOLVED',
  ]
  for (const code of known) {
    if (msg === code || msg.startsWith(code) || msg.includes(code)) return code
  }
  return null
}

function asRecord(data: unknown): Record<string, unknown> | null {
  if (data != null && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  return null
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function strOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null
}

function asFail(
  resolved: ReturnType<typeof resolvePublishError>
): Extract<ConceptPublishResult, { ok: false }> {
  return {
    ok: false,
    error: resolved.text,
    section: resolved.section,
    hint: resolved.code,
    productId: resolved.productId,
    upc: resolved.upc,
  }
}

export async function listBrandCampaignsAction(
  brandId: number = CONCEPT_DEFAULT_BRAND_ID
): Promise<ConceptCampaignOption[]> {
  const scope = await getPortalBrandScope()
  if (!scope) return []
  const scopedBrandId = studyBrandIdForRequest(scope, brandId)
  if (scopedBrandId == null) return []

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('brand_campaigns')
    .select('id, name, created_at')
    .eq('brand_id', scopedBrandId)
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
  taxonomyNodeId: number
}): Promise<{ ok: true; campaignId: string } | { ok: false; error: string }> {
  const scope = await getPortalBrandScope()
  if (!scope) return { ok: false, error: "You don't have access to that brand." }
  const { portalUser } = scope
  if (!canPublishStudies(portalUser)) {
    return {
      ok: false,
      error: 'Your role can view studies but not create them; ask a brand admin.',
    }
  }

  const requestedBrandId = args.brandId ?? CONCEPT_DEFAULT_BRAND_ID
  const brandId = studyBrandIdForRequest(scope, requestedBrandId)
  if (brandId == null) {
    return { ok: false, error: "You don't have access to that brand." }
  }
  const taxonomyNodeId = args.taxonomyNodeId
  if (!taxonomyNodeId) {
    return { ok: false, error: 'Choose a category for this study.' }
  }
  const name = args.campaignName.trim() || 'Concept study campaign'

  const supabase = await createServerSupabaseClient()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Concept studies are always single-session — do not thread draft.sessionCount.
  const { data, error } = await supabase.rpc('create_campaign_draft', {
    p_brand_id: brandId,
    p_campaign_name: name,
    p_mission_title: 'Draft',
    p_mission_type: 'brand_challenge',
    p_operator_type: 'brand',
    p_taxonomy_node_id: taxonomyNodeId,
    p_session_count: 1,
    p_starts_at: now.toISOString(),
    p_expires_at: expiresAt.toISOString(),
  })
  if (error) {
    const hint = extractHint(error)
    const resolved = resolvePublishError({
      thrown: { message: error.message, hint: hint ?? undefined },
    })
    return { ok: false, error: resolved.text }
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

export async function publishConceptStudyAction(
  draft: ConceptStudyDraft
): Promise<ConceptPublishResult> {
  const scope = await getPortalBrandScope()
  if (!scope) {
    return {
      ok: false,
      error: "You don't have access to that brand.",
      section: 'publish',
      hint: 'NOT_A_BRAND_PORTAL_USER',
    }
  }
  const { portalUser } = scope

  if (!canPublishStudies(portalUser)) {
    return {
      ok: false,
      error:
        'Your role can view studies but not publish them; ask a brand admin.',
      section: 'publish',
      hint: 'NOT_ALLOWED_TO_PUBLISH',
    }
  }
  if (studyBrandIdForRequest(scope, draft.brandId) == null) {
    return {
      ok: false,
      error: "You don't have access to that brand.",
      section: 'publish',
      hint: 'CROSS_TENANT_ACCESS_DENIED',
    }
  }

  if (!draft.stimulusMode) {
    return {
      ok: false,
      error: 'Choose what you are testing before publishing.',
      section: 'mode',
      hint: 'INVALID_STIMULUS_MODE',
    }
  }

  if (draft.taxonomyNodeId == null) {
    return {
      ok: false,
      error: 'Choose a category for this study.',
      section: 'mode',
      hint: 'NODE_REQUIRED',
    }
  }

  if (draft.stimulusMode !== 'package') {
    return {
      ok: false,
      error: 'Concept studies use the single concept test (packaging).',
      section: 'mode',
      hint: 'CONCEPT_REQUIRES_CORE',
    }
  }

  if (!portalUser.auth_uid) {
    return {
      ok: false,
      error: 'Publish requires an authenticated author.',
      section: 'publish',
      hint: 'NO_AUTHOR',
    }
  }

  let campaignId = draft.brandCampaignId
  if (!campaignId) {
    const created = await createConceptCampaignAction({
      brandId: draft.brandId,
      campaignName: draft.title.trim() || 'Concept study',
      taxonomyNodeId: draft.taxonomyNodeId,
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

  const supabase = await createServerSupabaseClient()

  try {
    const args = draftToConceptPublishStudyArgs(draft, {
      campaignId,
      createdBy: portalUser.auth_uid,
      // Completion target is the public contract. Ignore stale or crafted
      // calendar fields at the server boundary.
      expiresAt: null,
    })
    const { data, error } = await rpcPublishConceptStudy(supabase, args)

    if (error) {
      const hint = extractHint(error)
      const resolved = resolvePublishError({
        thrown: {
          message: error.message,
          hint: hint ?? undefined,
          details: error.details ?? undefined,
        },
      })
      return asFail(resolved)
    }

    const root = asRecord(data)
    if (root && typeof root.error === 'string') {
      const resolved = resolvePublishError({
        returned: { error: root.error, detail: root.detail },
      })
      return asFail(resolved)
    }

    const missionId =
      strOrNull(root?.mission_id) ||
      strOrNull(root?.id) ||
      null

    if (!missionId) {
      return {
        ok: false,
        error: 'Publish succeeded but no mission id returned.',
        section: 'publish',
        hint: null,
      }
    }

    return {
      ok: true,
      meta: {
        missionId,
        campaignId,
        field_size: numOrNull(root?.field_size),
        unique_pairs: numOrNull(root?.unique_pairs),
        rounds_per_respondent: numOrNull(root?.rounds_per_respondent),
        coverage_note: strOrNull(root?.coverage_note),
        target_completions: numOrNull(root?.target_completions) ?? draft.targetCompletions,
        template_code: strOrNull(root?.template_code) ?? PACKAGING_TEMPLATE_CODE,
        order: (() => {
          const order = asRecord(root?.order)
          if (!order) return null
          return {
            status: strOrNull(order.status),
            completions: numOrNull(order.completions),
            unit_price_cents: numOrNull(order.unit_price_cents),
            amount_cents: numOrNull(order.amount_cents),
            currency: strOrNull(order.currency),
          }
        })(),
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Publish failed.'
    const hint = extractHint({ message })
    const resolved = resolvePublishError({
      thrown: { message, hint: hint ?? undefined },
    })
    return asFail(resolved)
  }
}
