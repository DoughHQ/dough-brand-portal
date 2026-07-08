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
