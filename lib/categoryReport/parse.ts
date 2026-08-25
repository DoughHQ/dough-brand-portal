import type {
  CatalogProduct,
  CategoryPairwise,
  CategoryReport,
  CategoryReportEvidence,
  CategoryReportGate,
  CategoryReportMeta,
  CategoryStatistics,
  EvidenceConcentration,
  EvidenceCoverage,
  EvidencePositionBalance,
  EvidenceRaterConcentration,
  FocalCut,
  PairwisePair,
  RankedProduct,
  Ranking,
  RankingComponent,
} from './types'

function asObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

function asArray(raw: unknown): unknown[] {
  return Array.isArray(raw) ? raw : []
}

function asString(raw: unknown, fallback = ''): string {
  return typeof raw === 'string' ? raw : fallback
}

function asNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) {
    return Number(raw)
  }
  return null
}

function asBool(raw: unknown, fallback = false): boolean {
  return typeof raw === 'boolean' ? raw : fallback
}

export function unwrapPayload(data: unknown): Record<string, unknown> | null {
  if (data == null) return null
  if (typeof data === 'string') {
    try {
      return unwrapPayload(JSON.parse(data) as unknown)
    } catch {
      return null
    }
  }
  if (typeof data !== 'object' || Array.isArray(data)) return null
  return data as Record<string, unknown>
}

function parseProduct(raw: unknown): RankedProduct | null {
  const o = asObject(raw)
  if (!o) return null
  const product_id = asNumber(o.product_id)
  const name = asString(o.name).trim() || asString(o.product_name).trim()
  if (product_id == null || !name) return null

  const ci_available = asBool(o.ci_available, false)
  const elo = asNumber(o.elo)
  const elo_lo = asNumber(o.elo_lo)
  const elo_hi = asNumber(o.elo_hi)

  return {
    rank: asNumber(o.rank),
    product_id,
    name,
    brand: asString(o.brand).trim() || asString(o.brand_name).trim() || null,
    image_url: asString(o.image_url).trim() || null,
    elo,
    elo_lo,
    elo_hi,
    beta: asNumber(o.beta),
    se_cluster: asNumber(o.se_cluster),
    n_decisions: asNumber(o.n_decisions),
    n_raters: asNumber(o.n_raters),
    is_focal: asBool(o.is_focal, false),
    is_suppressed: asBool(o.is_suppressed, false),
    ci_available,
    ci_note: asString(o.ci_note).trim() || null,
    note: asString(o.note).trim() || null,
    component_id:
      typeof o.component_id === 'string' || typeof o.component_id === 'number'
        ? o.component_id
        : null,
  }
}

function parseComponent(raw: unknown): RankingComponent | null {
  const o = asObject(raw)
  if (!o) return null
  const component_id = o.component_id
  if (component_id == null || (typeof component_id !== 'string' && typeof component_id !== 'number')) {
    return null
  }
  const products: RankedProduct[] = []
  for (const item of asArray(o.products)) {
    const p = parseProduct(item)
    if (p) products.push(p)
  }
  return {
    component_id,
    is_primary: asBool(o.is_primary, false),
    size: asNumber(o.size) ?? products.length,
    products,
  }
}

function parseRanking(raw: unknown): Ranking | null {
  if (raw == null) return null
  const o = asObject(raw)
  if (!o) return null

  const components: RankingComponent[] = []
  for (const item of asArray(o.components)) {
    const c = parseComponent(item)
    if (c) components.push(c)
  }

  const undefeated: RankedProduct[] = []
  for (const item of asArray(o.undefeated)) {
    const p = parseProduct(item)
    if (p) undefeated.push(p)
  }
  const winless: RankedProduct[] = []
  for (const item of asArray(o.winless)) {
    const p = parseProduct(item)
    if (p) winless.push(p)
  }

  const primary = o.primary_component_id
  const primary_component_id =
    typeof primary === 'string' || typeof primary === 'number' ? primary : null

  return { primary_component_id, components, undefeated, winless }
}

function parseCatalog(raw: unknown): CatalogProduct[] {
  const rows: CatalogProduct[] = []
  for (const item of asArray(raw)) {
    const o = asObject(item)
    if (!o) continue
    const product_id = asNumber(o.product_id)
    const name = asString(o.name).trim() || asString(o.product_name).trim()
    if (product_id == null || !name) continue
    rows.push({
      product_id,
      name,
      brand: asString(o.brand).trim() || asString(o.brand_name).trim() || null,
    })
  }
  return rows
}

function parseFocal(raw: unknown): FocalCut | null {
  if (raw == null) return null
  const o = asObject(raw)
  if (!o) return null
  const product_id = asNumber(o.product_id)
  const name = asString(o.name).trim()
  if (product_id == null || !name) return null

  const list = (key: string): RankedProduct[] => {
    const rows: RankedProduct[] = []
    for (const item of asArray(o[key])) {
      const p = parseProduct(item)
      if (p) rows.push(p)
    }
    return rows
  }

  return {
    product_id,
    name,
    elo: asNumber(o.elo),
    elo_lo: asNumber(o.elo_lo),
    elo_hi: asNumber(o.elo_hi),
    above: list('above'),
    tied: list('tied'),
    below: list('below'),
    method_note: asString(o.method_note).trim() || null,
  }
}

function parseMeta(raw: unknown): CategoryReportMeta {
  const o = asObject(raw) ?? {}
  const qs = asObject(o.question_scope)
  return {
    scope: asString(o.scope),
    scope_id: asNumber(o.scope_id),
    scope_name: asString(o.scope_name).trim(),
    as_of: asString(o.as_of).trim() || null,
    mode: asString(o.mode),
    generated_at: asString(o.generated_at).trim() || null,
    elo_note: asString(o.elo_note).trim() || null,
    question_scope: qs,
  }
}

function parseCoverage(raw: unknown): EvidenceCoverage | null {
  const o = asObject(raw)
  if (!o) return null
  return {
    products_ranked: asNumber(o.products_ranked),
    products_with_battles: asNumber(o.products_with_battles),
    products_active_in_scope: asNumber(o.products_active_in_scope),
    note: asString(o.note).trim() || null,
  }
}

function parseConcentration(raw: unknown): EvidenceConcentration | null {
  const o = asObject(raw)
  if (!o) return null
  return {
    top3_battle_share: asNumber(o.top3_battle_share),
    battles_per_product_median: asNumber(o.battles_per_product_median),
    note: asString(o.note).trim() || null,
  }
}

function parseRaterConcentration(raw: unknown): EvidenceRaterConcentration | null {
  const o = asObject(raw)
  if (!o) return null
  return {
    max_single_rater_share: asNumber(o.max_single_rater_share),
    note: asString(o.note).trim() || null,
  }
}

function parsePositionBalance(raw: unknown): EvidencePositionBalance | null {
  const o = asObject(raw)
  if (!o) return null
  return {
    instrumented_battles: asNumber(o.instrumented_battles),
    left_slot_win_share: asNumber(o.left_slot_win_share),
    note: asString(o.note).trim() || null,
  }
}

function parseStatistics(raw: unknown): CategoryStatistics | null {
  const o = asObject(raw)
  if (!o) return null
  return {
    model: asString(o.model).trim() || null,
    elo_transform: asString(o.elo_transform).trim() || null,
    n_clusters: asNumber(o.n_clusters),
    design_effect_mean: asNumber(o.design_effect_mean),
    design_effect_note: asString(o.design_effect_note).trim() || null,
    effective_n_total: asNumber(o.effective_n_total),
    components_found: asNumber(o.components_found),
    separated_items: asNumber(o.separated_items),
    items_with_ci: asNumber(o.items_with_ci),
    items_total: asNumber(o.items_total),
    note: asString(o.note).trim() || null,
  }
}

function parsePair(raw: unknown): PairwisePair | null {
  const o = asObject(raw)
  if (!o) return null
  const a_product_id = asNumber(o.a_product_id)
  const b_product_id = asNumber(o.b_product_id)
  const a_name = asString(o.a_name).trim()
  const b_name = asString(o.b_name).trim()
  const component_id = o.component_id
  if (
    a_product_id == null ||
    b_product_id == null ||
    !a_name ||
    !b_name ||
    (typeof component_id !== 'string' && typeof component_id !== 'number')
  ) {
    return null
  }
  return {
    a_product_id,
    a_name,
    b_product_id,
    b_name,
    component_id,
    p_a_beats_b: asNumber(o.p_a_beats_b),
    observed_a_wins: asNumber(o.observed_a_wins),
    observed_b_wins: asNumber(o.observed_b_wins),
    observed_n: asNumber(o.observed_n),
    directly_compared: asBool(o.directly_compared, false),
  }
}

function parsePairwise(raw: unknown): CategoryPairwise | null {
  const o = asObject(raw)
  if (!o) return null
  const pairs: PairwisePair[] = []
  for (const item of asArray(o.pairs)) {
    const p = parsePair(item)
    if (p) pairs.push(p)
  }
  return {
    note: asString(o.note).trim() || null,
    pairs,
  }
}

function parseEvidence(raw: unknown): CategoryReportEvidence {
  const o = asObject(raw) ?? {}
  return {
    distinct_raters: asNumber(o.distinct_raters) ?? 0,
    battles: asNumber(o.battles) ?? 0,
    products_battled: asNumber(o.products_battled) ?? 0,
    rater_threshold: asNumber(o.rater_threshold) ?? 0,
    last_battle_at: asString(o.last_battle_at).trim() || null,
    design_effect_mean: asNumber(o.design_effect_mean),
    coverage: parseCoverage(o.coverage),
    concentration: parseConcentration(o.concentration),
    rater_concentration: parseRaterConcentration(o.rater_concentration),
    position_balance: parsePositionBalance(o.position_balance),
  }
}

function parseGate(raw: unknown): CategoryReportGate {
  const o = asObject(raw) ?? {}
  return {
    passes: asBool(o.passes, false),
    reason: asString(o.reason).trim() || 'unknown',
    message: asString(o.message).trim() || null,
  }
}

export function parseCategoryReport(raw: unknown): CategoryReport | null {
  const o = unwrapPayload(raw)
  if (!o) return null
  if (!asObject(o.meta) && !asObject(o.evidence) && !asObject(o.gate)) return null

  return {
    meta: parseMeta(o.meta),
    evidence: parseEvidence(o.evidence),
    catalog: parseCatalog(o.catalog),
    gate: parseGate(o.gate),
    ranking: parseRanking(o.ranking),
    focal: parseFocal(o.focal),
    statistics: parseStatistics(o.statistics),
    pairwise: parsePairwise(o.pairwise),
  }
}
