'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { fetchBoxDetail, type OperatorBoxDetail } from '@/lib/box/operatorDetail'
import type { BoxStatus } from '@/lib/box/operator'

async function assertOperator(): Promise<{ ok: true } | { ok: false; error: string }> {
  const scope = await getPortalBrandScope()
  if (!scope || scope.portalUser.role !== 'dough_admin' || scope.isImpersonating) {
    return { ok: false, error: 'Not authorized.' }
  }
  return { ok: true }
}

export async function reloadBoxDetailAction(
  boxId: string
): Promise<{ ok: true; detail: OperatorBoxDetail } | { ok: false; error: string }> {
  const gate = await assertOperator()
  if (!gate.ok) return gate
  const supabase = await createServerSupabaseClient()
  const res = await fetchBoxDetail(supabase, boxId)
  if (!res.ok) return { ok: false, error: res.error }
  return { ok: true, detail: res.detail }
}

export async function advanceBoxStatusAction(args: {
  boxId: string
  target: BoxStatus
  reason?: string
}): Promise<
  | { ok: true; detail: OperatorBoxDetail; message: string }
  | { ok: false; error: string }
> {
  const gate = await assertOperator()
  if (!gate.ok) return gate
  const supabase = await createServerSupabaseClient()

  const reason = args.reason?.trim()
  const { data, error } = await supabase.rpc('advance_box_status', {
    p_box_id: args.boxId,
    p_target: args.target,
    ...(reason ? { p_reason: reason } : {}),
  })
  if (error) {
    return { ok: false, error: humanizeStatusError(error.message) }
  }

  const root =
    data != null && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null
  const to = typeof root?.to_status === 'string' ? root.to_status : args.target
  let message = `Box is now ${to}.`
  if (to === 'closed' && root && typeof root.seats_used === 'number') {
    message = `Box closed. ${root.seats_used} seat${root.seats_used === 1 ? '' : 's'} used.`
  }

  const refreshed = await fetchBoxDetail(supabase, args.boxId)
  if (!refreshed.ok) {
    return { ok: false, error: refreshed.error }
  }
  return { ok: true, detail: refreshed.detail, message }
}

function humanizeStatusError(raw: string): string {
  if (raw.includes('not authorized')) return 'Not authorized.'
  if (raw.includes('frozen_field is empty')) return 'The field is empty — nothing to battle.'
  if (raw.includes('outside mission window')) return 'The mission window is not currently open.'
  if (raw.includes('still active')) return 'Some respondents are still in progress — you can’t close yet.'
  if (raw.includes('illegal box transition')) return 'That status change isn’t allowed from here.'
  if (raw.includes('is archived')) return 'This box is archived and can’t change.'
  return raw
}
