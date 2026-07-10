'use server'

import { getPortalUser, createCampaignDraft, validateCommissionProduct } from '@/lib/queries'
import type { CreateCampaignDraftResult } from '@/lib/ihut/missionPublish'

export type CommissionDraftResult =
  | ({ ok: true } & CreateCampaignDraftResult)
  | { ok: false; error: string }

/**
 * Operator commission path — dough_admin only, explicit brandId, no impersonation.
 * Records created_by via RPC (auth.uid()). Does not mint a mission — publish does.
 */
export async function commissionCampaignDraftAction(
  brandId: number,
  wizardStudyType: 'discovery' | 'positioning' | 'head_to_head',
  focalProductId: number,
  taxonomyNodeId: number,
  sessionCount: 1 | 2 = 2
): Promise<CommissionDraftResult> {
  if (!Number.isFinite(brandId) || !Number.isFinite(focalProductId) || !Number.isFinite(taxonomyNodeId)) {
    return { ok: false, error: 'INVALID_INPUT' }
  }

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') {
    return { ok: false, error: 'NOT_ADMIN' }
  }

  const validated = await validateCommissionProduct(focalProductId, brandId)
  if (!validated) {
    return { ok: false, error: 'PRODUCT_BRAND_MISMATCH' }
  }
  if (validated.taxonomy_node_id !== taxonomyNodeId) {
    return { ok: false, error: 'TAXONOMY_MISMATCH' }
  }

  try {
    const result = await createCampaignDraft(
      brandId,
      portalUser.auth_uid,
      wizardStudyType,
      focalProductId,
      taxonomyNodeId,
      sessionCount
    )
    return { ok: true, ...result }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'COMMISSION_FAILED',
    }
  }
}
