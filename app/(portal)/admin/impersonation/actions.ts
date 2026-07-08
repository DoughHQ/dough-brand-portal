'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'

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
  if (!Number.isFinite(brandId)) {
    return { ok: false, error: 'INVALID_BRAND_ID' }
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { ok: false, error: 'NOT_AUTHENTICATED' }
  }

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') {
    return { ok: false, error: 'NOT_ADMIN' }
  }

  const { data, error } = await supabase.rpc('enter_brand_impersonation', {
    p_brand_id: brandId,
  })
  if (error) {
    return { ok: false, error: error.message }
  }

  const result = data as RpcEnterResult
  if (!result?.ok) {
    return { ok: false, error: result?.error ?? 'ENTER_FAILED' }
  }

  const { error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) {
    return { ok: false, error: 'REFRESH_FAILED' }
  }

  return {
    ok: true,
    brandId: result.brand_id ?? brandId,
    expiresAt: result.expires_at ?? '',
  }
}

export async function exitImpersonationAction(): Promise<ExitImpersonationResult> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { ok: false, error: 'NOT_AUTHENTICATED' }
  }

  const { data, error } = await supabase.rpc('exit_brand_impersonation')
  if (error) {
    return { ok: false, error: error.message }
  }

  const result = data as RpcExitResult
  if (!result?.ok) {
    return { ok: false, error: 'EXIT_FAILED' }
  }

  const { error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) {
    return { ok: false, error: 'REFRESH_FAILED' }
  }

  return {
    ok: true,
    wasImpersonating: Boolean(result.was_impersonating),
    brandId: result.brand_id,
  }
}
