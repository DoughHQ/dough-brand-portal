'use server'

import { getTaxonomyNodeAction } from '../audienceActions'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { draftToConceptPublishStudyArgs } from '@/lib/concept/publish'
import type { ConceptStudyDraft, LegibilityOption } from '@/lib/concept/types'
import type { PackSizeOption } from '@/lib/concept/packSize'
import type { Json } from '@/lib/database.types'
import {
  preselectSiblingOptions,
  type TaxonomySibling,
} from '@/lib/concept/taxonomySiblings'
import type { TaxonomyNodeInfo } from '@/lib/studies/taxonomy'
import {
  mapJourneyForPhonePreview,
  parseConceptJourney,
  type PhonePreviewJourney,
} from '@/lib/concept/journey'
import journeyFixture from '../../../../concept-core-fixtures/journey.json'

export type PackSizeOptionsResult = {
  options: PackSizeOption[]
  family_code: string | null
  family_label: string | null
}

/** Category-aware pack_size phrases from get_pack_size_options. */
export async function getPackSizeOptionsAction(
  taxonomyNodeId: number
): Promise<PackSizeOptionsResult> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_pack_size_options', {
    p_taxonomy_node_id: taxonomyNodeId,
  })
  if (error) {
    console.error('[concept] get_pack_size_options', error)
    return { options: [], family_code: null, family_label: null }
  }
  const rows = (data ?? []) as Array<{
    phrase: string
    sort_order: number
    family_code: string
    family_label: string
    resolved_l2_node_id: number | null
    resolved_l2_node_code: string | null
  }>
  const options = rows.map((r) => ({
    phrase: r.phrase,
    sort_order: r.sort_order,
    family_code: r.family_code,
    family_label: r.family_label,
    resolved_l2_node_id: r.resolved_l2_node_id,
    resolved_l2_node_code: r.resolved_l2_node_code,
  }))
  return {
    options,
    family_code: options[0]?.family_code ?? null,
    family_label: options[0]?.family_label ?? null,
  }
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
  const q = query.trim().slice(0, 80)
  if (q.length < 2) return []
  const portalUser = await getPortalUser()
  if (!portalUser) {
    throw new Error('You must be signed in to search brands.')
  }

  const supabase = await createServerSupabaseClient()
  // This intentionally searches the global active-brand directory: respondents
  // need plausible recognition choices beyond the author's own brand. The RPC
  // returns only public brand labels and aggregate counts, never tenant records.
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

/** Decoy attention-check validation. Never reports success if the authoritative check is dark. */
export async function checkConceptDecoyAction(
  decoy: string
): Promise<{ ok: true; decoy: string } | { ok: false; reason: string }> {
  const trimmed = decoy.trim()
  if (!trimmed) return { ok: false, reason: 'EMPTY' }
  if (trimmed.length > 60) return { ok: false, reason: 'TOO_LONG' }
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(trimmed)) {
    return { ok: false, reason: 'PHONE_NUMBER' }
  }
  if (/@|https?:\/\//i.test(trimmed)) {
    return { ok: false, reason: 'LINK_OR_EMAIL' }
  }

  const portalUser = await getPortalUser()
  if (!portalUser) return { ok: false, reason: 'NOT_A_BRAND_PORTAL_USER' }

  const supabase = await createServerSupabaseClient()
  try {
    const { data, error } = await supabase.rpc('check_concept_decoy', {
      p_decoy: trimmed,
    })
    if (error) {
      return { ok: false, reason: 'VALIDATION_UNAVAILABLE' }
    }
    const row = data as { ok?: boolean; reason?: string; decoy?: string } | null
    if (!row || typeof row.ok !== 'boolean') {
      return { ok: false, reason: 'VALIDATION_UNAVAILABLE' }
    }
    if (!row.ok) {
      return { ok: false, reason: row.reason ?? 'REAL_BRAND' }
    }
    return { ok: true, decoy: typeof row?.decoy === 'string' ? row.decoy : trimmed }
  } catch {
    return { ok: false, reason: 'VALIDATION_UNAVAILABLE' }
  }
}

/**
 * preview_concept_journey — Section 2 respondent journey outline.
 * On UNKNOWN_MODULE / dark pack, returns fixture journey remapped to Design letters.
 */
export async function previewConceptJourneyAction(
  draft: ConceptStudyDraft
): Promise<
  | { ok: true; preview: PhonePreviewJourney; fromFixture: boolean }
  | { ok: false; error: string; preview: PhonePreviewJourney | null }
> {
  const portalUser = await getPortalUser()
  if (!portalUser) {
    return { ok: false, error: "You don't have access to that brand.", preview: null }
  }

  const fixturePreview = (): PhonePreviewJourney | null => {
    const parsed = parseConceptJourney(journeyFixture)
    if (!parsed) return null
    return mapJourneyForPhonePreview(parsed, draft.conceptArms)
  }

  const supabase = await createServerSupabaseClient()
  try {
    const args = draftToConceptPublishStudyArgs(draft, {
      campaignId: draft.brandCampaignId || '00000000-0000-0000-0000-000000000000',
      createdBy: portalUser.auth_uid || '00000000-0000-0000-0000-000000000000',
      expiresAt: null,
    })

    const { data, error } = await supabase.rpc('preview_concept_journey', {
      p_field: args.p_field as unknown as Json,
      p_module_config: args.p_module_config as Json,
      ...(args.p_battle_prompt
        ? { p_battle_prompt: args.p_battle_prompt }
        : {}),
    })

    if (error) {
      const preview = fixturePreview()
      return {
        ok: false,
        error: error.message || 'Preview unavailable',
        preview,
      }
    }

    const parsed = parseConceptJourney(data)
    if (!parsed) {
      const preview = fixturePreview()
      return { ok: false, error: 'Could not parse journey preview.', preview }
    }
    return {
      ok: true,
      preview: mapJourneyForPhonePreview(parsed, draft.conceptArms),
      fromFixture: false,
    }
  } catch (err) {
    const preview = fixturePreview()
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Preview failed',
      preview,
    }
  }
}

