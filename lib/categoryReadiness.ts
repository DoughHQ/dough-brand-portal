import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ReadinessRow } from './categoryReadiness.shared'
import { isReadinessStatus } from './categoryReadiness.shared'

export class CategoryReadinessError extends Error {
  code?: string
  hint?: string
  adminOnly: boolean

  constructor(message: string, opts?: { code?: string; hint?: string; adminOnly?: boolean }) {
    super(message)
    this.name = 'CategoryReadinessError'
    this.code = opts?.code
    this.hint = opts?.hint
    this.adminOnly = Boolean(opts?.adminOnly)
  }
}

function isAdminOnly(error: { message?: string; hint?: string; code?: string }): boolean {
  const blob = `${error.message ?? ''} ${error.hint ?? ''} ${error.code ?? ''}`.toLowerCase()
  return blob.includes('admin-only') || blob.includes('admin only')
}

function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '')
}

function nullableText(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s.length ? s : null
}

function mapRow(
  raw: Record<string, unknown>,
  kind: 'l2' | 'l3'
): ReadinessRow {
  const statusRaw = text(raw.status)
  return {
    nodeId: num(kind === 'l2' ? raw.l2_node_id : raw.l3_node_id),
    l1Name: kind === 'l2' ? nullableText(raw.l1_name) : null,
    name: text(kind === 'l2' ? raw.l2_name : raw.l3_name),
    battles: num(raw.battles),
    distinctRaters: num(raw.distinct_raters),
    productsBattled: num(raw.products_battled),
    raters7d: num(raw.raters_7d),
    raters30d: num(raw.raters_30d),
    studyBattlesExcluded: num(raw.study_battles_excluded),
    compareGroupBattles: num(raw.compare_group_battles),
    compareGroupRaters: num(raw.compare_group_raters),
    lastBattleAt: nullableText(raw.last_battle_at),
    raterThreshold: num(raw.rater_threshold),
    status: isReadinessStatus(statusRaw) ? statusRaw : statusRaw,
  }
}

export async function fetchReadinessL2(): Promise<ReadinessRow[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('admin_category_readiness_l2')
  if (error) {
    throw new CategoryReadinessError(error.message, {
      code: error.code,
      hint: error.hint,
      adminOnly: isAdminOnly(error),
    })
  }
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>, 'l2'))
}

export async function fetchReadinessL3(l2NodeId: number): Promise<ReadinessRow[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('admin_category_readiness_l3', {
    p_l2_node_id: l2NodeId,
  })
  if (error) {
    throw new CategoryReadinessError(error.message, {
      code: error.code,
      hint: error.hint,
      adminOnly: isAdminOnly(error),
    })
  }
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>, 'l3'))
}
