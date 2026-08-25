export const CATEGORY_SCOPES = ['l2', 'l3', 'compare_group'] as const
export type CategoryScope = (typeof CATEGORY_SCOPES)[number]

export const CATEGORY_MODES = ['admin', 'brand'] as const
export type CategoryMode = (typeof CATEGORY_MODES)[number]

export type CatalogProduct = {
  product_id: number
  name: string
  brand: string | null
}

export type RankedProduct = {
  rank: number | null
  product_id: number
  name: string
  brand: string | null
  image_url: string | null
  elo: number | null
  elo_lo: number | null
  elo_hi: number | null
  beta: number | null
  se_cluster: number | null
  n_decisions: number | null
  n_raters: number | null
  is_focal: boolean
  is_suppressed: boolean
  ci_available: boolean
  ci_note: string | null
  note: string | null
  component_id: string | number | null
}

export type RankingComponent = {
  component_id: string | number
  is_primary: boolean
  size: number
  products: RankedProduct[]
}

export type Ranking = {
  primary_component_id: string | number | null
  components: RankingComponent[]
  undefeated: RankedProduct[]
  winless: RankedProduct[]
}

export type FocalCut = {
  product_id: number
  name: string
  elo: number | null
  elo_lo: number | null
  elo_hi: number | null
  above: RankedProduct[]
  tied: RankedProduct[]
  below: RankedProduct[]
  method_note: string | null
}

export type CategoryReportMeta = {
  scope: string
  scope_id: number | null
  scope_name: string
  as_of: string | null
  mode: string
  generated_at: string | null
  elo_note: string | null
  question_scope: Record<string, unknown> | null
}

export type EvidenceCoverage = {
  products_ranked: number | null
  products_with_battles: number | null
  products_active_in_scope: number | null
  note: string | null
}

export type EvidenceConcentration = {
  top3_battle_share: number | null
  battles_per_product_median: number | null
  note: string | null
}

export type EvidenceRaterConcentration = {
  max_single_rater_share: number | null
  note: string | null
}

export type EvidencePositionBalance = {
  instrumented_battles: number | null
  left_slot_win_share: number | null
  note: string | null
}

export type CategoryReportEvidence = {
  distinct_raters: number
  battles: number
  products_battled: number
  rater_threshold: number
  last_battle_at: string | null
  design_effect_mean: number | null
  coverage: EvidenceCoverage | null
  concentration: EvidenceConcentration | null
  rater_concentration: EvidenceRaterConcentration | null
  position_balance: EvidencePositionBalance | null
}

export type CategoryStatistics = {
  model: string | null
  elo_transform: string | null
  n_clusters: number | null
  design_effect_mean: number | null
  design_effect_note: string | null
  effective_n_total: number | null
  components_found: number | null
  separated_items: number | null
  items_with_ci: number | null
  items_total: number | null
  note: string | null
}

export type PairwisePair = {
  a_product_id: number
  a_name: string
  b_product_id: number
  b_name: string
  component_id: string | number
  p_a_beats_b: number | null
  observed_a_wins: number | null
  observed_b_wins: number | null
  observed_n: number | null
  directly_compared: boolean
}

export type CategoryPairwise = {
  note: string | null
  pairs: PairwisePair[]
}

export type CategoryReportGate = {
  passes: boolean
  reason: string
  message: string | null
}

export type CategoryReport = {
  meta: CategoryReportMeta
  evidence: CategoryReportEvidence
  catalog: CatalogProduct[]
  gate: CategoryReportGate
  ranking: Ranking | null
  focal: FocalCut | null
  statistics: CategoryStatistics | null
  pairwise: CategoryPairwise | null
}

export type CategoryReportLoadResult =
  | { ok: true; report: CategoryReport }
  | {
      ok: false
      code: 'ADMIN_ONLY' | 'FETCH_ERROR' | 'MALFORMED' | 'INVALID_PARAMS'
      detail?: string
    }
