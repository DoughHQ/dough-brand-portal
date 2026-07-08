export type ReportMetric = {
  value: number | null
  ci_low?: number | null
  ci_high?: number | null
  n_users?: number | null
  n_decisive?: number | null
  reportable?: boolean
  withheld_reason?: string | null
}

export type ProvenanceReliability = {
  consistency_rate?: number | null
  ci_low?: number | null
  ci_high?: number | null
  reportable?: boolean
  withheld_reason?: string | null
}

export type ProvenanceComposition = {
  n_users?: number | null
  headline?: ReportMetric
  reliability?: ProvenanceReliability
}

export type AttributeSignalRow = {
  opponent_product_id: number
  opponent_name: string
  opponent_brand: string
  value: number | null
  ci_low: number | null
  ci_high: number | null
  n_decisive: number | null
  n_users: number | null
  reportable: boolean
  withheld_reason: string | null
}

export type MissionReportRow = {
  focal_product_id: number
  snapshot_date: string
  total_completions: number
  effective_k_threshold: number
  min_cell_size_met: boolean
  elo_win_rate: number | null
  attribute_signals: AttributeSignalRow[]
  provenance_composition: ProvenanceComposition
  engagement_bias_disclosure: string
  computed_at: string
}

export type MissionReportLoadResult =
  | {
      ok: true
      report: MissionReportRow | null
      focalProductName: string | null
    }
  | {
      ok: false
      error: string
    }

/** @deprecated RPC response shapes */
export type MissionReportErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'NOT_A_PORTAL_USER'
  | 'NO_REPORT_YET'
  | 'FORBIDDEN'

export type BrandMissionReportSuccess = {
  mission_id: string
  brand_id: number
  focal_product_id: number
  snapshot_date: string
  is_current: boolean
  total_completions: number
  effective_k_threshold: number
  min_cell_size_met: boolean
  elo_win_rate: number | null
  competitive_map: Array<{
    opponent_name: string
    opponent_brand: string
    value: number | null
    ci_low: number | null
    ci_high: number | null
    n_decisive: number | null
    n_users: number | null
    reportable: boolean
    withheld_reason: string | null
  }>
  summary: {
    headline?: ReportMetric
    reliability?: ReportMetric
  }
  engagement_bias_disclosure: string
  computed_at: string
  viewer_role?: string
}

export type BrandMissionReportError = {
  error: MissionReportErrorCode
  detail?: string
}

export type BrandMissionReportResult = BrandMissionReportSuccess | BrandMissionReportError

export function isMissionReportError(
  result: BrandMissionReportResult
): result is BrandMissionReportError {
  return 'error' in result && typeof result.error === 'string'
}

export function isMissionReportSuccess(
  result: BrandMissionReportResult
): result is BrandMissionReportSuccess {
  return !isMissionReportError(result)
}

export function sortAttributeSignals(rows: AttributeSignalRow[]): AttributeSignalRow[] {
  return [...rows].sort((a, b) => {
    if (a.value == null && b.value == null) return 0
    if (a.value == null) return 1
    if (b.value == null) return -1
    return b.value - a.value
  })
}
