'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'

export type CompleteBrandOnboardingResult = { ok: true } | { ok: false }

/**
 * Marks the signed-in portal user's onboarding checklist done.
 * Never returns raw error text to the client.
 */
export async function completeBrandOnboardingAction(): Promise<CompleteBrandOnboardingResult> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('complete_brand_onboarding')
  if (error) {
    logHandledRpcFailure('complete_brand_onboarding', {
      code: error.code ?? null,
      message: error.message ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null,
    })
    return { ok: false }
  }
  revalidatePath('/dashboard')
  return { ok: true }
}
