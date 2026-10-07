import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import type {
  SafetyModerationAction,
  SafetyReportRow,
  SafetyReportsPage,
} from './safety.shared'

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  return null
}

function asNum(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function asStr(v: unknown): string | null {
  if (v == null) return null
  const s = String(v)
  return s.length > 0 ? s : null
}

function parseRow(raw: unknown): SafetyReportRow | null {
  const r = asRecord(raw)
  if (!r) return null
  const reportId = asNum(r.report_id)
  const createdAt = asStr(r.created_at)
  if (!reportId || !createdAt) return null
  const snap = asRecord(r.snapshot) ?? {}
  return {
    report_id: reportId,
    reporter_id: asNum(r.reporter_id),
    target_user_id: asNum(r.target_user_id),
    rec_id: r.rec_id == null ? null : asNum(r.rec_id),
    reason: asStr(r.reason) ?? 'other',
    note: asStr(r.note),
    surface: asStr(r.surface) ?? 'profile',
    snapshot: {
      display_name: asStr(snap.display_name),
      handle: asStr(snap.handle),
      bio: asStr(snap.bio),
      avatar_url: asStr(snap.avatar_url),
      rec_note: asStr(snap.rec_note),
      saved_note: asStr(snap.saved_note),
      product_id: snap.product_id == null ? null : asNum(snap.product_id),
    },
    status: asStr(r.status) ?? 'open',
    created_at: createdAt,
    updated_at: asStr(r.updated_at) ?? createdAt,
    alert_dispatched_at: asStr(r.alert_dispatched_at),
    target_display_name: asStr(r.target_display_name),
    target_handle: asStr(r.target_handle),
    target_avatar_url: asStr(r.target_avatar_url),
    target_user_status: asStr(r.target_user_status),
    reporter_display_name: asStr(r.reporter_display_name),
    reporter_handle: asStr(r.reporter_handle),
    prior_reports_on_target: asNum(r.prior_reports_on_target),
    closed_at: asStr(r.closed_at),
  }
}

export async function listOpenUserReports(opts?: {
  limit?: number
  beforeCreatedAt?: string | null
  beforeReportId?: number | null
}): Promise<SafetyReportsPage> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc('list_open_user_reports' as never, {
      p_limit: opts?.limit ?? 50,
      p_before_created_at: opts?.beforeCreatedAt ?? null,
      p_before_report_id: opts?.beforeReportId ?? null,
    } as never)
    if (error) {
      logHandledRpcFailure('list_open_user_reports', {
        code: error.code ?? null,
        message: error.message,
        details: error.details ?? null,
        hint: error.hint ?? null,
        reason: 'safety_desk',
      })
      return { ok: false, total: 0, rows: [], error: error.message }
    }
    const root = asRecord(data)
    if (!root || root.ok === false) {
      return { ok: false, total: 0, rows: [], error: asStr(root?.error) ?? 'failed' }
    }
    const rowsRaw = Array.isArray(root.rows) ? root.rows : []
    const rows = rowsRaw.map(parseRow).filter((r): r is SafetyReportRow => r != null)
    return { ok: true, total: asNum(root.total), rows }
  } catch (err) {
    return {
      ok: false,
      total: 0,
      rows: [],
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function getUserReport(reportId: number): Promise<{
  ok: boolean
  report?: SafetyReportRow
  actions?: SafetyModerationAction[]
  error?: string
}> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc('get_user_report' as never, {
      p_report_id: reportId,
    } as never)
    if (error) {
      return { ok: false, error: error.message }
    }
    const root = asRecord(data)
    if (!root || root.ok === false) {
      return { ok: false, error: asStr(root?.error) ?? 'not_found' }
    }
    const report = parseRow(root.report)
    if (!report) return { ok: false, error: 'parse_failed' }
    const actionsRaw = Array.isArray(root.actions) ? root.actions : []
    const actions: SafetyModerationAction[] = actionsRaw
      .map((a) => {
        const r = asRecord(a)
        if (!r) return null
        return {
          action_id: asNum(r.action_id),
          action: asStr(r.action) ?? '',
          actor_role: asStr(r.actor_role) ?? '',
          detail: asRecord(r.detail) ?? {},
          created_at: asStr(r.created_at) ?? '',
        }
      })
      .filter((a): a is SafetyModerationAction => a != null && a.action_id > 0)
    return { ok: true, report, actions }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function countOpenUserReports(): Promise<number> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc('count_open_user_reports' as never)
    if (error) return 0
    const n = typeof data === 'number' ? data : Number(data)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

export async function moderateReport(
  reportId: number,
  outcome: 'dismiss' | 'remove_content' | 'suspend',
  note?: string | null,
): Promise<{ ok: boolean; status?: string; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc('moderate_report' as never, {
      p_report_id: reportId,
      p_outcome: outcome,
      p_note: note ?? null,
    } as never)
    if (error) return { ok: false, error: error.message }
    const root = asRecord(data)
    if (!root || root.ok === false) {
      return { ok: false, error: asStr(root?.error) ?? 'failed' }
    }
    return { ok: true, status: asStr(root.status) ?? outcome }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function reinstateUser(
  userId: number,
  note?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc('reinstate_user' as never, {
      p_user_id: userId,
      p_note: note ?? null,
    } as never)
    if (error) return { ok: false, error: error.message }
    const root = asRecord(data)
    if (!root || root.ok === false) {
      return { ok: false, error: asStr(root?.error) ?? 'failed' }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
