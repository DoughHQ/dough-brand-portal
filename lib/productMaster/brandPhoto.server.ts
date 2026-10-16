import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isBrandPublishedPath } from '@/lib/productMaster/brandPhoto'

const HOLDING_PATH =
  /^(\d+)\/holding\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/

export type ModerateBrandPhotoResult =
  | { ok: true; storagePath: string; publicUrl: string | null }
  | { ok: false; code: string }

type ModerateBody = {
  ok?: boolean
  error?: string
  storage_path?: string
  public_url?: string | null
}

/**
 * Asks `moderate_brand_image` to check a holding JPEG.
 * The client sends only `holding_path`. A 401 is a dead session even when the
 * body says `not_authorized`, which is what the function itself returns.
 */
export async function moderateBrandPhoto(input: {
  holdingPath: string
}): Promise<ModerateBrandPhotoResult> {
  const match = HOLDING_PATH.exec(input.holdingPath)
  const brandText = match?.[1]
  const brandId = brandText == null ? Number.NaN : Number(brandText)
  if (
    !match ||
    brandText == null ||
    !Number.isSafeInteger(brandId) ||
    brandId <= 0 ||
    brandText !== String(brandId)
  ) {
    return { ok: false, code: 'invalid_path' }
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return { ok: false, code: 'check_failed' }

  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return { ok: false, code: 'session_expired' }

  let res: Response
  try {
    res = await fetch(`${base}/functions/v1/moderate_brand_image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ holding_path: input.holdingPath }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    return { ok: false, code: 'check_failed' }
  }

  if (res.status === 401) return { ok: false, code: 'session_expired' }

  let body: ModerateBody
  try {
    body = (await res.json()) as ModerateBody
  } catch {
    return { ok: false, code: 'check_failed' }
  }

  if (!res.ok || body.ok === false) {
    return { ok: false, code: body.error || 'check_failed' }
  }

  if (!body.storage_path || !isBrandPublishedPath(body.storage_path, brandId)) {
    return { ok: false, code: 'check_failed' }
  }

  return {
    ok: true,
    storagePath: body.storage_path,
    publicUrl: body.public_url ?? null,
  }
}
