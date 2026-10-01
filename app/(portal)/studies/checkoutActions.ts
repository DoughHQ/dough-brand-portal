'use server'

import { revalidatePath } from 'next/cache'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { checkoutErrorMessage, recordPaymentArgs } from '@/lib/checkout/payment'
import { dollarsToCents } from '@/lib/checkout/money'
import { createServerSupabaseClient } from '@/lib/supabase-server'

async function requireStaff(): Promise<{ ok: true } | { ok: false; error: string }> {
  const scope = await getPortalBrandScope()
  if (!scope) return { ok: false, error: 'Not signed in.' }
  if (scope.portalUser.role !== 'dough_admin' || scope.isImpersonating) {
    return { ok: false, error: 'Only Dough staff can do this.' }
  }
  return { ok: true }
}

export async function recordStudyPaymentAction(input: {
  missionId: string
  reference: string
  waived: boolean
  amountCents: number
  currency: string
}): Promise<{ ok: true; alreadyRecorded: boolean } | { ok: false; error: string }> {
  const staff = await requireStaff()
  if (!staff.ok) return staff
  const reference = input.reference.trim()
  if (!reference) {
    return { ok: false, error: 'Add a reference: an invoice number, or why it was waived.' }
  }
  const supabase = await createServerSupabaseClient()
  const args = recordPaymentArgs({ ...input, reference })
  const { data, error } = await supabase.rpc('record_study_payment', args)
  if (error) return { ok: false, error: checkoutErrorMessage(error) }
  const root = data && typeof data === 'object' && !Array.isArray(data) ? data : null
  const already =
    root != null &&
    'already_recorded' in root &&
    (root as { already_recorded?: unknown }).already_recorded === true
  revalidatePath('/studies')
  revalidatePath(`/studies/${input.missionId}/checkout`)
  return { ok: true, alreadyRecorded: already }
}

export async function setStudyPriceAction(input: {
  dollars: string
}): Promise<{ ok: true; unitPriceCents: number } | { ok: false; error: string }> {
  const staff = await requireStaff()
  if (!staff.ok) return staff
  const cents = dollarsToCents(input.dollars)
  if (cents == null || cents < 100 || cents > 1_000_000) {
    return { ok: false, error: 'A price per response must be between $1 and $10,000.' }
  }
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('set_study_price', {
    p_test_type: 'concept',
    p_unit_price_cents: cents,
  })
  if (error) return { ok: false, error: checkoutErrorMessage(error) }
  const root = data && typeof data === 'object' && !Array.isArray(data) ? data : null
  const next =
    root != null && 'unit_price_cents' in root
      ? Number((root as { unit_price_cents?: unknown }).unit_price_cents)
      : cents
  revalidatePath('/studies')
  return { ok: true, unitPriceCents: Number.isFinite(next) ? next : cents }
}
