'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { perfLog, perfNow, timed } from '@/lib/perf'

type RpcEnterResult = {
  ok: boolean
  error?: string
  brand_id?: number
  expires_at?: string
}

type RpcExitResult = {
  ok: boolean
  was_impersonating?: boolean
  brand_id?: number
}

export type EnterImpersonationResult =
  | { ok: true; brandId: number; expiresAt: string }
  | { ok: false; error: string }

export type ExitImpersonationResult =
  | { ok: true; wasImpersonating: boolean; brandId?: number }
  | { ok: false; error: string }

export async function enterImpersonationAction(
  brandId: number
): Promise<EnterImpersonationResult> {
  const tAll = perfNow()
  if (!Number.isFinite(brandId)) {
    return { ok: false, error: 'INVALID_BRAND_ID' }
  }

  const supabase = await createServerSupabaseClient()

  // Single auth+role check (getPortalUser already calls getUser)
  const portalUser = await timed('enter.getPortalUser', () => getPortalUser())
  if (!portalUser || portalUser.role !== 'dough_admin') {
    return { ok: false, error: !portalUser ? 'NOT_AUTHENTICATED' : 'NOT_ADMIN' }
  }

  const { data, error } = await timed('enter.rpc', async () =>
    supabase.rpc('enter_brand_impersonation', { p_brand_id: brandId })
  )
  if (error) {
    return { ok: false, error: error.message }
  }

  const result = data as RpcEnterResult
  if (!result?.ok) {
    return { ok: false, error: result?.error ?? 'ENTER_FAILED' }
  }

  const { error: refreshError } = await timed('enter.refreshSession', async () =>
    supabase.auth.refreshSession()
  )
  if (refreshError) {
    return { ok: false, error: 'REFRESH_FAILED' }
  }

  perfLog('enter.total', perfNow() - tAll, { brandId })
  return {
    ok: true,
    brandId: result.brand_id ?? brandId,
    expiresAt: result.expires_at ?? '',
  }
}

export async function exitImpersonationAction(): Promise<ExitImpersonationResult> {
  const tAll = perfNow()
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await timed('exit.getUser', async () => supabase.auth.getUser())
  if (userError || !user) {
    return { ok: false, error: 'NOT_AUTHENTICATED' }
  }

  const { data, error } = await timed('exit.rpc', async () =>
    supabase.rpc('exit_brand_impersonation')
  )
  if (error) {
    return { ok: false, error: error.message }
  }

  const result = data as RpcExitResult
  if (!result?.ok) {
    return { ok: false, error: 'EXIT_FAILED' }
  }

  const { error: refreshError } = await timed('exit.refreshSession', async () =>
    supabase.auth.refreshSession()
  )
  if (refreshError) {
    return { ok: false, error: 'REFRESH_FAILED' }
  }

  perfLog('exit.total', perfNow() - tAll)
  return {
    ok: true,
    wasImpersonating: Boolean(result.was_impersonating),
    brandId: result.brand_id,
  }
}
