'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { parseCreateCampaignDraftResult } from '@/lib/ihut/missionPublish'
import { draftToBoxPublishArgs } from '@/lib/box/publish'
import { rpcPublishBoxStudy } from '@/lib/box/rpc'
import {
  BOX_PUBLISH_HINT_MESSAGES,
  extractBoxHint,
  resolveBoxPublishError,
  type BoxErrorSection,
} from '@/lib/box/errors'
import { BOX_DEFAULT_BATTLE_QUESTION } from '@/lib/box/constants'
import type { BoxPublishSuccessMeta, BoxStudyDraft } from '@/lib/box/types'

export type BoxPublishResult =
  | { ok: true; meta: BoxPublishSuccessMeta }
  | {
      ok: false
      error: string
      section: BoxErrorSection
      hint: string | null
      productId?: number | null
      upc?: string | null
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
  resolved: ReturnType<typeof resolveBoxPublishError>
): Extract<BoxPublishResult, { ok: false }> {
  return {
    ok: false,
    error: resolved.text,
    section: resolved.section,
    hint: resolved.code,
    productId: resolved.productId,
    upc: resolved.upc,
  }
}

/**
 * A campaign is a container (create_campaign_draft ignores mission-shaped
 * args by design — its own return note says so), so this sends only what the
 * function actually uses. Tenancy is enforced inside the RPC: a non-admin
 * caller must match get_effective_brand_id(), and an impersonating admin
 * creates for the impersonated brand.
 */
export async function createBoxCampaignAction(args: {
  brandId: number
  campaignName: string
}): Promise<{ ok: true; campaignId: string } | { ok: false; error: string }> {
  const portalUser = await getPortalUser()
  if (!portalUser) return { ok: false, error: "You don't have access to that brand." }

  const name = args.campaignName.trim() || 'Box study campaign'
  const now = new Date()
  const expires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('create_campaign_draft', {
    p_brand_id: args.brandId,
    p_campaign_name: name,
    p_starts_at: now.toISOString(),
    p_expires_at: expires.toISOString(),
  })

  if (error) {
    const resolved = resolveBoxPublishError({
      thrown: { message: error.message, hint: extractBoxHint(error) ?? undefined },
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

export async function publishBoxStudyAction(
  draft: BoxStudyDraft
): Promise<BoxPublishResult> {
  const portalUser = await getPortalUser()
  if (!portalUser) {
    return {
      ok: false,
      error: "You don't have access to that brand.",
      section: 'publish',
      hint: 'NOT_A_BRAND_PORTAL_USER',
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

  // Minimal pre-checks for the two things draftToBoxPublishArgs cannot
  // express as wire args. Everything else is the server's job, mapped back
  // through resolveBoxPublishError.
  if (draft.taxonomyNodeId == null) {
    return {
      ok: false,
      error: 'Choose a category for this box.',
      section: 'setup',
      hint: 'CATEGORY_REQUIRED',
    }
  }
  if (draft.focalProductId == null) {
    return {
      ok: false,
      error: 'Choose the hero product this box is about.',
      section: 'setup',
      hint: 'FOCAL_REQUIRED',
    }
  }
  if (draft.physicalUnits == null || draft.physicalUnits < 1) {
    return {
      ok: false,
      error: 'Set how many boxes will ship.',
      section: 'logistics',
      hint: 'INVALID_UNITS',
    }
  }
  if (
    draft.fieldProducts.some((r) => r.product_id != null && !r.upc?.trim())
  ) {
    return {
      ok: false,
      error: BOX_PUBLISH_HINT_MESSAGES.UPC_REQUIRED,
      section: 'field',
      hint: 'UPC_REQUIRED',
    }
  }
  const upcs = draft.fieldProducts
    .map((r) => r.upc?.trim())
    .filter((u): u is string => !!u)
  if (new Set(upcs).size !== upcs.length) {
    return {
      ok: false,
      error: BOX_PUBLISH_HINT_MESSAGES.DUPLICATE_FIELD_UPC,
      section: 'field',
      hint: 'DUPLICATE_FIELD_UPC',
    }
  }

  let campaignId = draft.brandCampaignId
  if (!campaignId) {
    const created = await createBoxCampaignAction({
      brandId: draft.brandId,
      campaignName: draft.title.trim() || 'Box study',
    })
    if (!created.ok) {
      return { ok: false, error: created.error, section: 'setup', hint: 'CAMPAIGN_NOT_FOUND' }
    }
    campaignId = created.campaignId
  }

  const supabase = await createServerSupabaseClient()

  try {
    const args = draftToBoxPublishArgs(draft, {
      campaignId,
      createdBy: portalUser.auth_uid,
      open: true,
    })
    const { data, error } = await rpcPublishBoxStudy(supabase, args)

    if (error) {
      const resolved = resolveBoxPublishError({
        thrown: {
          message: error.message,
          hint: extractBoxHint(error) ?? undefined,
          details: error.details ?? undefined,
        },
      })
      return asFail(resolved)
    }

    const root = asRecord(data)
    if (root && typeof root.error === 'string') {
      const resolved = resolveBoxPublishError({
        returned: { error: root.error, detail: root.detail },
      })
      return asFail(resolved)
    }

    const missionId = strOrNull(root?.mission_id)
    const boxId = strOrNull(root?.box_id)
    if (!missionId || !boxId) {
      return {
        ok: false,
        error: 'Publish succeeded but no box id returned.',
        section: 'publish',
        hint: null,
      }
    }

    const boxStatus = strOrNull(root?.box_status)
    const publishedOpen = root?.published_open === true && boxStatus === 'open'
    if (!publishedOpen) {
      return {
        ok: false,
        error: "Couldn't publish — check the box is complete.",
        section: 'publish',
        hint: 'BOX_OPEN_FAILED',
      }
    }

    return {
      ok: true,
      meta: {
        missionId,
        boxId,
        protocolId: strOrNull(root?.protocol_id),
        campaignId,
        field_size: numOrNull(root?.field_size),
        unique_pairs: numOrNull(root?.unique_pairs),
        session_count: numOrNull(root?.session_count),
        session2_interval_hours: numOrNull(root?.session2_interval_hours),
        eligibility_applied: root?.eligibility_applied === true,
        box_status: boxStatus,
        publishedOpen,
        battle_question:
          strOrNull(root?.battle_question) ??
          (draft.battleQuestion.trim() || BOX_DEFAULT_BATTLE_QUESTION),
        battle_question_is_custom:
          typeof root?.battle_question_is_custom === 'boolean'
            ? root.battle_question_is_custom
            : draft.battleQuestion.trim().length > 0,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Publish failed.'
    const resolved = resolveBoxPublishError({
      thrown: { message, hint: extractBoxHint({ message }) ?? undefined },
    })
    return asFail(resolved)
  }
}
