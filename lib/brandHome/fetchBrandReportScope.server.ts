import 'server-only'

import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import { timed } from '@/lib/perf'

export type BrandReportScope = {
  brandId: number
  l2NodeIds: number[]
  catalogRefreshedAt: string | null
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  return null
}

export const getBrandReportScope = cache(async (): Promise<BrandReportScope | null> => {
  return timed('brand.report.scope', async () => {
    try {
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase.rpc('get_brand_report_scope' as never)
      if (error) {
        logHandledRpcFailure('get_brand_report_scope', {
          code: error.code ?? null,
          message: error.message,
          details: error.details ?? null,
          hint: error.hint ?? null,
          reason: 'brand_report_scope',
        })
        return null
      }
      const r = asRecord(data)
      if (!r) return null
      const brandId = Number(r.brand_id)
      if (!Number.isFinite(brandId) || brandId <= 0) return null
      const idsRaw = r.l2_node_ids
      const l2NodeIds = Array.isArray(idsRaw)
        ? idsRaw.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)
        : []
      return {
        brandId,
        l2NodeIds,
        catalogRefreshedAt: r.catalog_refreshed_at == null ? null : String(r.catalog_refreshed_at),
      }
    } catch (err) {
      logHandledRpcFailure('get_brand_report_scope', {
        code: null,
        message: err instanceof Error ? err.message : String(err),
        details: null,
        hint: null,
        reason: 'brand_report_scope',
      })
      return null
    }
  })
})
