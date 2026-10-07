'use server'

import {
  countOpenUserReports,
  getUserReport,
  listOpenUserReports,
  moderateReport,
  reinstateUser,
} from '@/lib/safety'
import type { SafetyModerationAction, SafetyReportRow, SafetyReportsPage } from '@/lib/safety.shared'
import { getPortalUser } from '@/lib/queries'

async function requireDoughAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') {
    return { ok: false, error: 'not_authorized' }
  }
  return { ok: true }
}

export async function listOpenSafetyReportsAction(opts?: {
  beforeCreatedAt?: string | null
  beforeReportId?: number | null
}): Promise<SafetyReportsPage> {
  const gate = await requireDoughAdmin()
  if (!gate.ok) return { ok: false, total: 0, rows: [], error: gate.error }
  return listOpenUserReports({
    limit: 50,
    beforeCreatedAt: opts?.beforeCreatedAt,
    beforeReportId: opts?.beforeReportId,
  })
}

export async function getSafetyReportAction(reportId: number): Promise<{
  ok: boolean
  report?: SafetyReportRow
  actions?: SafetyModerationAction[]
  error?: string
}> {
  const gate = await requireDoughAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }
  return getUserReport(reportId)
}

export async function moderateSafetyReportAction(
  reportId: number,
  outcome: 'dismiss' | 'remove_content' | 'suspend',
  note?: string | null,
): Promise<{ ok: boolean; status?: string; error?: string }> {
  const gate = await requireDoughAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }
  return moderateReport(reportId, outcome, note)
}

export async function reinstateUserAction(
  userId: number,
  note?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireDoughAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }
  return reinstateUser(userId, note)
}

export async function countOpenSafetyReportsAction(): Promise<number> {
  const gate = await requireDoughAdmin()
  if (!gate.ok) return 0
  return countOpenUserReports()
}
