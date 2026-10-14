import {
  fetchCheckoutField,
  fetchMissionCheckoutWindow,
  fetchStudyOrder,
} from '@/lib/checkout/load'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function loadCheckoutPage(missionId: string) {
  const supabase = await createServerSupabaseClient()
  const order = await fetchStudyOrder(supabase, missionId)

  if (!order) return null

  const [{ data: userData }, field, window] = await Promise.all([
    supabase.auth.getUser(),
    fetchCheckoutField(supabase, missionId),
    fetchMissionCheckoutWindow(supabase, missionId),
  ])

  return {
    order,
    designs: field.designs,
    products: field.products,
    email: userData.user?.email ?? null,
    fieldingDays: window.fieldingDays,
    expiresAt: window.expiresAt,
    missionStatus: window.status,
  }
}
