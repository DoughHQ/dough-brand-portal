'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { parseCreateCampaignDraftResult } from '@/lib/studies/parseCampaignDraft'
import { draftToBoxPublishArgs } from '@/lib/box/publish'
import { rpcPublishBoxStudy } from '@/lib/box/rpc'
import {
  extractBoxHint,
  resolveBoxPublishError,
  type BoxErrorSection,
} from '@/lib/box/errors'
import { BOX_DEFAULT_BATTLE_QUESTION } from '@/lib/box/constants'
import type {
  BoxPrototypeLabel,
  BoxPublishSuccessMeta,
  BoxStudyDraft,
} from '@/lib/box/types'
import { ihutModuleConfigFromDraft } from '@/lib/box/method'
import { isResolvedBoxSeat } from '@/lib/box/fieldSize'
import {
  parseIhutPreviewJourney,
  type IhutPreviewJourney,
} from '@/lib/box/preview/screensFromIhutJourney'

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
  if (draft.physicalUnits == null || draft.physicalUnits < 1) {
    return {
      ok: false,
      error: 'Set how many boxes will ship.',
      section: 'logistics',
      hint: 'INVALID_UNITS',
    }
  }
  if (draft.fieldProducts.length < 2 || draft.fieldProducts.length > 5) {
    return {
      ok: false,
      error: 'A box needs 2–5 seats.',
      section: 'field',
      hint: 'FIELD_SIZE_INVALID',
    }
  }
  if (!draft.fieldProducts.some((r) => r.role === 'yours')) {
    return {
      ok: false,
      error: 'Mark at least one seat as Yours.',
      section: 'field',
      hint: 'YOURS_SEAT_REQUIRED',
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

    const boxStatus = strOrNull(root?.box_status) ?? 'open'
    const labelsRaw = root?.prototype_labels
    const prototype_labels: BoxPrototypeLabel[] = Array.isArray(labelsRaw)
      ? labelsRaw.flatMap((row) => {
          const r = asRecord(row)
          if (!r) return []
          const code = strOrNull(r.code)
          const prototypeId = strOrNull(r.prototype_id)
          if (!code || !prototypeId) return []
          const packaging: BoxPrototypeLabel['packaging'] =
            r.packaging === 'plain_sample' ? 'plain_sample' : 'final_packaging'
          return [
            {
              combatant_ref: numOrNull(r.combatant_ref) ?? 0,
              prototype_id: prototypeId,
              code,
              display_name: strOrNull(r.display_name) ?? 'Sample',
              internal_label: strOrNull(r.internal_label),
              packaging,
            } satisfies BoxPrototypeLabel,
          ]
        })
      : []

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
        publishedOpen: root?.published_open === true || boxStatus === 'open',
        battle_question:
          strOrNull(root?.battle_question) ??
          (draft.battleQuestion.trim() || BOX_DEFAULT_BATTLE_QUESTION),
        battle_question_is_custom:
          typeof root?.battle_question_is_custom === 'boolean'
            ? root.battle_question_is_custom
            : draft.battleQuestion.trim().length > 0,
        taste_only: root?.taste_only === true,
        price_check_enabled: root?.price_check_enabled === true,
        prototype_labels,
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
