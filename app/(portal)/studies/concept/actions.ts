'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { parseCreateCampaignDraftResult } from '@/lib/studies/parseCampaignDraft'
import { draftToConceptPublishStudyArgs } from '@/lib/concept/publish'
import { resolvePublishError, type ConceptErrorSection } from '@/lib/concept/errors'
import { templateConfigToWire } from '@/lib/concept/templateConfig'
import {
  rpcBuildConceptQuestionsFromTemplate,
  rpcPublishConceptStudy,
} from '@/lib/concept/rpc'
import type {
  ConceptPublishSuccessMeta,
  ConceptStudyDraft,
  LegibilityOption,
  PackagingTemplateConfig,
} from '@/lib/concept/types'
import type { Json } from '@/lib/database.types'
import {
  CONCEPT_DEFAULT_BRAND_ID,
  PACKAGING_TEMPLATE_CODE,
  PRICE_TEMPLATE_CODE,
} from '@/lib/concept/constants'
import {
  preselectSiblingOptions,
  taxonomyBreadcrumb,
  type TaxonomySibling,
} from '@/lib/concept/taxonomySiblings'

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
  taxonomyNodeId: number
}): Promise<{ ok: true; campaignId: string } | { ok: false; error: string }> {
  const portalUser = await getPortalUser()
  if (!portalUser) return { ok: false, error: "You don't have access to that brand." }

  const brandId = args.brandId ?? CONCEPT_DEFAULT_BRAND_ID
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

export async function previewPackagingQuestionsAction(
  config: PackagingTemplateConfig
): Promise<
  | { ok: true; questions: unknown[] }
  | { ok: false; error: string }
> {
  const portalUser = await getPortalUser()
  if (!portalUser) return { ok: false, error: "You don't have access to that brand." }

  const supabase = await createServerSupabaseClient()
  try {
    const { data, error } = await rpcBuildConceptQuestionsFromTemplate(supabase, {
      p_template_code: PACKAGING_TEMPLATE_CODE,
      p_config: templateConfigToWire(config),
    })
    if (error) {
      const resolved = resolvePublishError({
        thrown: { message: error.message, hint: extractHint(error) ?? undefined },
      })
      return { ok: false, error: resolved.text }
    }
    const root = asRecord(data)
    if (root && typeof root.error === 'string') {
      const resolved = resolvePublishError({
        returned: { error: root.error, detail: root.detail },
      })
      return { ok: false, error: resolved.text }
    }
    const list = Array.isArray(data)
      ? data
      : Array.isArray(root?.questions)
        ? root.questions
        : null
    if (!list) {
      return { ok: false, error: 'Template preview returned no questions.' }
    }
    return { ok: true, questions: list }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not build question preview.',
    }
  }
}

/** @deprecated Prefer publishConceptStudyAction. */
export async function publishConceptMissionAction(
  draft: ConceptStudyDraft
): Promise<ConceptPublishResult> {
  return publishConceptStudyAction(draft)
}

export async function publishConceptStudyAction(
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

  if (draft.stimulusMode !== 'package' && draft.stimulusMode !== 'price') {
    return {
      ok: false,
      error: 'Question set in progress — packaging and price studies are live now.',
      section: 'mode',
      hint: 'NO_TEMPLATE_FOR_MODE',
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
  const expiresAt = draft.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  try {
    const args = draftToConceptPublishStudyArgs(draft, {
      campaignId,
      createdBy: portalUser.auth_uid,
      expiresAt,
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
        template_code:
          strOrNull(root?.template_code) ??
          (draft.stimulusMode === 'price'
            ? PRICE_TEMPLATE_CODE
            : PACKAGING_TEMPLATE_CODE),
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

export type TaxonomyNodeInfo = {
  taxonomy_node_id: number
  node_name_display: string
  node_name_normalized: string
  parent_taxonomy_node_id: number | null
  l1_node_name: string | null
  l2_node_name: string | null
  breadcrumb: string
}

const TAXONOMY_SELECT =
  'taxonomy_node_id, node_name_display, node_name_normalized, parent_taxonomy_node_id, l1_node_name, l2_node_name'

function toNodeInfo(row: {
  taxonomy_node_id: number
  node_name_display: string
  node_name_normalized: string
  parent_taxonomy_node_id: number | null
  l1_node_name: string | null
  l2_node_name: string | null
}): TaxonomyNodeInfo {
  return {
    ...row,
    breadcrumb: taxonomyBreadcrumb(row),
  }
}

export async function getTaxonomyNodeAction(
  nodeId: number
): Promise<TaxonomyNodeInfo | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('taxonomy_nodes')
    .select(TAXONOMY_SELECT)
    .eq('taxonomy_node_id', nodeId)
    .maybeSingle()
  if (error || !data) return null
  return toNodeInfo(data as Parameters<typeof toNodeInfo>[0])
}

export async function listTaxonomySiblingsAction(nodeId: number): Promise<{
  node: TaxonomyNodeInfo | null
  siblings: TaxonomySibling[]
  preselected: LegibilityOption[]
  sparse: boolean
}> {
  const node = await getTaxonomyNodeAction(nodeId)
  if (!node?.parent_taxonomy_node_id) {
    return { node, siblings: [], preselected: [], sparse: true }
  }
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('taxonomy_nodes')
    .select('taxonomy_node_id, node_name_display, node_name_normalized')
    .eq('parent_taxonomy_node_id', node.parent_taxonomy_node_id)
    .neq('taxonomy_node_id', nodeId)
    .eq('status', 'active')
    .eq('is_assignable', true)
    .not('node_name_display', 'ilike', 'Other %')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('node_name_display', { ascending: true })
    .limit(40)

  if (error || !data) {
    return { node, siblings: [], preselected: [], sparse: true }
  }

  const siblings = data as TaxonomySibling[]
  const preselected = preselectSiblingOptions(siblings, 4)
  return {
    node,
    siblings,
    preselected,
    sparse: siblings.length < 2,
  }
}

/** Available sibling categories for legibility chips (not force-written into config). */
export async function seedLegibilityOptionsAction(nodeId: number): Promise<{
  node: TaxonomyNodeInfo | null
  available: LegibilityOption[]
  suggested: LegibilityOption[]
  sparse: boolean
}> {
  const result = await listTaxonomySiblingsAction(nodeId)
  const available = result.siblings
    .filter((s) => s.node_name_display.trim())
    .map((s) => ({
      id: `tax:${s.taxonomy_node_id}` as `tax:${number}`,
      label: s.node_name_display.trim(),
      taxonomy_node_id: s.taxonomy_node_id,
    }))
  return {
    node: result.node,
    available,
    suggested: result.preselected,
    sparse: result.sparse,
  }
}

export type VerificationBrandHit = {
  brand_id: number
  brand_name: string
  /** Clean display label for chips — prefers RPC `label` when present. */
  label: string
  product_count: number
  battle_count: number
}

/** Brand search for purchase-verification chips (brand-grain, not product). */
export async function searchVerificationBrandsAction(
  query: string
): Promise<VerificationBrandHit[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const portalUser = await getPortalUser()
  if (!portalUser) {
    throw new Error('You must be signed in to search brands.')
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('search_brands_admin', {
    p_query: q,
  })
  // Throw so typeahead can show error (never collapse failures into "no matches").
  if (error) {
    throw new Error(error.message || 'Brand search failed')
  }

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map((r) => {
      const brandId = Number(r.brand_id)
      if (!Number.isFinite(brandId) || brandId <= 0) return null
      const brandName =
        typeof r.brand_name === 'string' ? r.brand_name.trim() : ''
      const labelRaw =
        typeof r.label === 'string' && r.label.trim() ? r.label.trim() : brandName
      if (!labelRaw) return null
      return {
        brand_id: brandId,
        brand_name: brandName || labelRaw,
        label: labelRaw,
        product_count: Number(r.product_count) || 0,
        battle_count: Number(r.battle_count) || 0,
      } satisfies VerificationBrandHit
    })
    .filter((r): r is VerificationBrandHit => r != null)
    .slice(0, 12)
}

/** L3 assignable active nodes — search-as-you-type for Section 0. */
export async function searchTaxonomyNodesAction(
  query: string
): Promise<TaxonomyNodeInfo[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('taxonomy_nodes')
    .select(TAXONOMY_SELECT)
    .eq('status', 'active')
    .eq('is_assignable', true)
    .eq('node_level', 3)
    .ilike('node_name_display', `%${q}%`)
    .order('node_name_display', { ascending: true })
    .limit(20)
  if (error || !data) return []
  return (data as Parameters<typeof toNodeInfo>[0][]).map(toNodeInfo)
}
