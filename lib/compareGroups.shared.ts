/** Client-safe types for compare-groups admin. No server imports. */

export type CompareGroupScope = 'curated_active' | 'all' | 'synthetic' | 'deprecated'

export type CompareGroupType = 'primary' | 'alternative' | 'benchmark' | 'display'

export type CompareGroupPeakBucket = 'morning' | 'afternoon' | 'evening' | 'late'

export type CompareGroupListItem = {
  compare_group_id: number
  code: string | null
  name: string | null
  strategy: string | null
  status: string | null
  type: string | null
  version: number | null
  battle_level: number | null
  consumer_question: string | null
  has_question: boolean | null
  node_count: number
  battle_count: number
  product_count: number
  respondent_count: number
  /** Present after list_compare_groups peak-TOD migration; optional for older RPC. */
  has_time_priors?: boolean | null
  peak_bucket?: CompareGroupPeakBucket | string | null
  peak_hours?: number[] | null
  max_prior_weight?: number | null
}

export type CompareGroupListResult = {
  scope: string
  count: number
  groups: CompareGroupListItem[]
}

export type CompareGroupNode = {
  taxonomy_node_id: number
  node_name: string | null
  node_level: number | null
  path_names: string | null
  l2_node_name: string | null
  priority: number | null
  membership_id: number | null
}

export type CompareGroupRevision = {
  revision_id: number
  change_type: string | null
  field_name: string | null
  old_value: unknown
  new_value: unknown
  version_after: number | null
  actor_kind: string | null
  actor_user_id: string | null
  note: string | null
  changed_at: string
}

export type CompareGroupDetail = {
  group: Record<string, unknown> & {
    compare_group_id: number
    code?: string | null
    name?: string | null
    consumer_question?: string | null
    description?: string | null
    compare_group_type?: string | null
    type?: string | null
    battle_level?: number | null
    status?: string | null
    strategy?: string | null
    version?: number | null
  }
  nodes: CompareGroupNode[]
  recent_revisions: CompareGroupRevision[]
}

export type CompareGroupMetrics = {
  compare_group_id: number
  headline: {
    total_battles: number
    decided_battles: number
    product_count: number
    respondent_count: number
    skip_battles: number
    last_battle_at: string | null
  }
  per_product: Array<{
    product_id: number
    product_name: string | null
    node_id: number | null
    node_name: string | null
    battles: number
    wins: number
    losses: number
    win_rate: number | null
    avg_elo_before: number | null
  }>
  per_node: Array<{
    node_id: number
    node_name: string | null
    products_in_node: number
    node_wins: number
    node_battles: number
    node_win_rate: number | null
  }>
  observed_time_of_day: Array<{ hour: number; dow: number; battles: number }>
  editorial_time_priors: Array<{
    hour: number
    dow: number
    weight: number
    source: string | null
  }>
  notes: {
    metric_class: string | null
    disclaimer: string | null
  }
}

export type SimilarityRelation =
  | 'identical'
  | 'candidate_subset'
  | 'candidate_superset'
  | 'near_identical'
  | 'overlapping'

export type SimilaritySeverity = 'high' | 'medium' | 'low'

export type NodeWarning = {
  compare_group_id: number
  name: string | null
  strategy: string | null
  existing_node_count: number
  candidate_node_count: number
  shared_nodes: number
  symmetric_difference: number
  jaccard: number
  relation: SimilarityRelation
  severity: SimilaritySeverity
}

export type QuestionWarning = {
  compare_group_id: number
  name: string | null
  question: string | null
  full_similarity: number
  slug_similarity: number
}

export type SimilarityResult = {
  candidate_node_count: number
  node_warnings: NodeWarning[]
  question_warnings: QuestionWarning[]
  has_warnings: boolean
}

export type SelectedNode = {
  taxonomy_node_id: number
  node_name_display: string
  path_names_csv: string
  l2_node_name: string
}

export type CreateCompareGroupInput = {
  name: string
  question?: string | null
  nodeIds: number[]
  description?: string | null
  type?: CompareGroupType | string | null
  battleLevel?: number | null
  note?: string | null
}

export type UpdateCompareGroupPatch = {
  name?: string | null
  question?: string | null
  description?: string | null
  type?: CompareGroupType | string | null
  battleLevel?: number | null
  status?: 'active' | 'deprecated' | null
  note?: string | null
}

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }
