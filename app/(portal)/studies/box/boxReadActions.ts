'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { rpcTaxonomyBoxRisk } from '@/lib/box/rpc'
import {
  summarizeTaxonomyRisk,
  type BoxTaxonomyRisk,
  type BoxTaxonomyRiskValue,
} from '@/lib/box/risk'
import type { BoxStudyDraft } from '@/lib/box/types'
import { ihutModuleConfigFromDraft } from '@/lib/box/method'
import { isResolvedBoxSeat } from '@/lib/box/fieldSize'
import {
  parseIhutPreviewJourney,
  type IhutPreviewJourney,
} from '@/lib/box/preview/screensFromIhutJourney'

/**
 * taxonomy_box_risk for the box category and every seat. Lets the builder
 * lock "contains alcohol" and flag restricted products before publish; the
 * publish RPC runs the same check and stays authoritative.
 */
export async function checkBoxTaxonomyRiskAction(
  nodeIds: number[]
): Promise<{ ok: true; risk: BoxTaxonomyRisk } | { ok: false }> {
  const portalUser = await getPortalUser()
  if (!portalUser) return { ok: false }
  const ids = nodeIds.filter((id) => Number.isSafeInteger(id)).slice(0, 12)
  if (ids.length === 0) {
    return { ok: true, risk: summarizeTaxonomyRisk([]) }
  }
  const supabase = await createServerSupabaseClient()
  const results = await Promise.all(
    ids.map(async (nodeId) => {
      const { data, error } = await rpcTaxonomyBoxRisk(supabase, nodeId)
      if (error) return null
      const risk: BoxTaxonomyRiskValue =
        data === 'alcohol' || data === 'restricted' ? data : null
      return { nodeId, risk }
    })
  )
  const verdicts = results.filter(
    (r): r is { nodeId: number; risk: BoxTaxonomyRiskValue } => r != null
  )
  if (verdicts.length !== ids.length) return { ok: false }
  return { ok: true, risk: summarizeTaxonomyRisk(verdicts) }
}

/**
 * preview_ihut_journey — respondent walkthrough outline for the box builder.
 */
export async function previewIhutJourneyAction(
  draft: BoxStudyDraft
): Promise<
  | { ok: true; preview: IhutPreviewJourney }
  | { ok: false; error: string; preview: IhutPreviewJourney | null }
> {
  const portalUser = await getPortalUser()
  if (!portalUser) {
    return { ok: false, error: "You don't have access to that brand.", preview: null }
  }

  const seats = draft.fieldProducts.filter(isResolvedBoxSeat).length
  const cfg = ihutModuleConfigFromDraft(draft)
  const includeDay2 = cfg.include_day2 === true

  try {
    const supabase = await createServerSupabaseClient()
    // Types lag the migration until portal DB types are regenerated.
    const { data, error } = await (supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message?: string } | null }>
    }).rpc('preview_ihut_journey', {
      p_seat_count: seats,
      p_module_config: cfg,
      p_include_day2: includeDay2,
    })
    if (error) {
      return {
        ok: false,
        error: error.message || 'Could not build the walkthrough.',
        preview: null,
      }
    }
    const preview = parseIhutPreviewJourney(data)
    if (!preview) {
      return { ok: false, error: 'Could not parse journey preview.', preview: null }
    }
    return { ok: true, preview }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Preview failed.',
      preview: null,
    }
  }
}
