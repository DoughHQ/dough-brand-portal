import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { BrandMissionReportResult } from './types'

/** Portal report RPCs not yet in regenerated database.types.ts Functions block. */
type ReportRpcClient = {
  rpc(
    fn: 'get_brand_mission_report' | 'refresh_brand_mission_report',
    args: { p_mission_id: string }
  ): Promise<{ data: unknown; error: { message: string } | null }>
}

export async function getBrandMissionReport(
  missionId: string
): Promise<BrandMissionReportResult> {
  const supabase = (await createServerSupabaseClient()) as unknown as ReportRpcClient
  const { data, error } = await supabase.rpc('get_brand_mission_report', {
    p_mission_id: missionId,
  })
  if (error) throw new Error(error.message)
  return data as BrandMissionReportResult
}

export async function refreshBrandMissionReport(missionId: string): Promise<unknown> {
  const supabase = (await createServerSupabaseClient()) as unknown as ReportRpcClient
  const { data, error } = await supabase.rpc('refresh_brand_mission_report', {
    p_mission_id: missionId,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function getFocalProductDisplayName(
  productId: number
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('products')
    .select('product_name_display, product_name_short')
    .eq('product_id', productId)
    .maybeSingle()
  if (!data) return null
  return data.product_name_short ?? data.product_name_display ?? null
}
