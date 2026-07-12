export type CampaignRow = {
  id: string
  name: string
  campaign_code: string | null
  description: string | null
  starts_at: string | null
}

export type MissionRow = {
  id: string
  title: string
  status: string
  product_id: number | null
  starts_at: string | null
  expires_at: string | null
  brand_campaign_id: string
  mission_type?: string | null
}

export type MissionReportRow = {
  mission_id: string
  elo_win_rate: number | null
  total_completions: number | null
  min_cell_size_met: boolean
  snapshot_date: string | null
}

export type ProductRow = {
  product_id: number
  product_name_short: string | null
  brand_id: number
}

export type MissionReportStatus = 'ready' | 'gathering' | 'not_started'

export function mapReportStatus(report: MissionReportRow | undefined): MissionReportStatus {
  if (!report) return 'not_started'
  if (report.min_cell_size_met) return 'ready'
  return 'gathering'
}

export type StudiesLoadResult =
  | {
      ok: true
      campaigns: CampaignRow[]
      missionsByCampaign: Record<string, MissionRow[]>
      reportsByMission: Record<string, MissionReportRow>
      productsById: Record<number, ProductRow>
    }
  | {
      ok: false
      securityViolation: true
      detail: string
    }
  | {
      ok: false
      securityViolation: false
      error: string
    }

/** Row from list_operator_studies — tenancy enforced server-side by the RPC. */
export type OperatorStudyRow = {
  mission_id: string
  title: string
  status: 'active' | 'archived' | 'expired' | 'paused' | 'completed'
  is_finished: boolean
  brand_id: number | null
  brand_name: string | null
  focal_product_id: number | null
  focal_product_name: string | null
  template_code: string | null
  /** missions.mission_type — e.g. concept_test, brand_challenge. */
  mission_type?: string | null
  total_claims: number
  completed_claims: number
  /** Ordered completion count when set at publish; null = manual close only / unknown. */
  target_completions?: number | null
  created_at: string
  expires_at: string | null
}

/** Row from list_withdrawn_studies — tenancy enforced server-side by the RPC. */
export type WithdrawnStudyRow = {
  mission_id: string
  title: string
  status: string
  is_draft: boolean
  brand_id: number | null
  brand_name: string | null
  focal_product_id: number | null
  focal_product_name: string | null
  template_code: string | null
  total_claims: number
  completed_claims: number
  created_at: string
  deleted_at: string
}
