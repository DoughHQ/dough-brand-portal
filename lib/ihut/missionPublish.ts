/**
 * Types for preview_mission_feasibility + publish_mission_from_template.
 * Preview is hypothetical — never treat it as the published panel.
 *
 * publish_mission_from_template has ONE error channel: PostgREST `error`.
 * Every failure raises. `data` is always the success shape.
 *
 * publish success includes a frozen `panel` array (same member shape as preview),
 * ordered by position — not just panel_size. No second query needed.
 *
 * preview_mission_feasibility keeps { runnable, reason }. That is not an error
 * channel — runnable:false is a normal render path. It raises only for
 * TEMPLATE_NOT_FOUND / TEMPLATE_NOT_PUBLISHED / NOT_A_BRAND_PORTAL_USER.
 *
 * Panel member nullability:
 *   Structural: position, role, product_id, product, brand
 *   Display (soft): price_tier, why, provenance, parent — null/missing → ''
 *   curated: boolean when present; else inferred from provenance containing "curated"
 */

export type PreviewPanelMember = {
  position: number
  role: string
  product_id: number
  product: string
  brand: string
  parent: unknown
  /** Empty when the product has no computed tier. */
  price_tier: string
  curated: boolean
  /** Selection provenance from publish/preview (e.g. curated_anchor_tier). */
  provenance: string
  /** Empty when the RPC omits a selection rationale. */
  why: string
}

export type PreviewProtocol = {
  scoring_rounds: number
  reliability_repeats: number
  total_rounds: number
  panel_size_required: number
}

export type PreviewMissionFeasibility = {
  runnable: boolean
  /** Empty when runnable; code/message when not (e.g. PANEL_INFEASIBLE). */
  reason: string
  panel: PreviewPanelMember[]
  pool: { shortfall: number }
  panel_composition: { disclosure: string }
  price_cents: number
  protocol: PreviewProtocol
}

export type PublishMissionResult = {
  published: boolean
  mission_id: string
  panel_size: number
  /** Frozen panel from publish — same shape as preview, ordered by position. */
  panel: PreviewPanelMember[]
  battle_protocol_question_id?: string
  scoring_rounds?: number
  /** Ordered completion count when set at publish. */
  target_completions?: number | null
}

export type CreateCampaignDraftResult = {
  campaignId: string
  missionId: string | null
  protocolId: string | null
}

export const RPC_ERROR_CODES = [
  'TEMPLATE_NOT_FOUND',
  'FOCAL_HAS_NO_NODE',
  'NODE_MISMATCH',
  'TEMPLATE_NOT_PUBLISHED',
  'TEMPLATE_HAS_NO_BATTLE',
  'PANEL_INFEASIBLE',
  'NO_AUTHOR',
  'CAMPAIGN_NOT_FOUND',
  'CAMPAIGN_DELETED',
  'CROSS_TENANT_ACCESS_DENIED',
  'NOT_A_BRAND_PORTAL_USER',
  'NOT_AUTHENTICATED',
  'NOT_AUTHORIZED',
  'FORBIDDEN',
  'INVALID_TARGET_COMPLETIONS',
] as const

export type RpcErrorCode = (typeof RPC_ERROR_CODES)[number]

export class PublishError extends Error {
  readonly code: string | null
  readonly hint: string | null

  constructor(message: string, code?: string | null, hint?: string | null) {
    super(message)
    this.name = 'PublishError'
    this.code = code ?? null
    this.hint = hint ?? null
  }
}

function requireObject(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`missing object at ${path}`)
  }
  return value as Record<string, unknown>
}

function requireBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`missing boolean at ${path}`)
  }
  return value
}

function requireNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`missing number at ${path}`)
  }
  return value
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new Error(`missing string at ${path}`)
  }
  return value
}

/** Display / optional text — null, undefined, or non-string → ''. */
function stringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function parseCurated(r: Record<string, unknown>): boolean {
  if (typeof r.curated === 'boolean') return r.curated
  const provenance = stringOrEmpty(r.provenance).toLowerCase()
  return provenance.includes('curated')
}

function parsePanelMember(row: unknown, index: number): PreviewPanelMember {
  const r = requireObject(row, `panel[${index}]`)
  return {
    position: requireNumber(r.position, `panel[${index}].position`),
    role: requireString(r.role, `panel[${index}].role`),
    product_id: requireNumber(r.product_id, `panel[${index}].product_id`),
    product: requireString(r.product, `panel[${index}].product`),
    brand: requireString(r.brand, `panel[${index}].brand`),
    parent: r.parent ?? null,
    price_tier: stringOrEmpty(r.price_tier),
    curated: parseCurated(r),
    provenance: stringOrEmpty(r.provenance),
    why: stringOrEmpty(r.why),
  }
}

function parsePanelArray(raw: unknown, path: string): PreviewPanelMember[] {
  if (!Array.isArray(raw)) {
    throw new Error(`missing array at ${path}`)
  }
  return raw
    .map((row, i) => parsePanelMember(row, i))
    .sort((a, b) => a.position - b.position)
}

function parseProtocol(raw: unknown): PreviewProtocol {
  const protocol = requireObject(raw, 'protocol')
  return {
    scoring_rounds: requireNumber(protocol.scoring_rounds, 'protocol.scoring_rounds'),
    reliability_repeats: requireNumber(protocol.reliability_repeats, 'protocol.reliability_repeats'),
    total_rounds: requireNumber(protocol.total_rounds, 'protocol.total_rounds'),
    panel_size_required: requireNumber(protocol.panel_size_required, 'protocol.panel_size_required'),
  }
}

/** Prefer error.hint — that is where RAISE EXCEPTION USING HINT puts the code. */
export function extractRpcErrorCode(
  hint: string | null | undefined,
  message?: string | null | undefined
): RpcErrorCode | null {
  const haystacks = [hint, message].filter(Boolean) as string[]
  for (const hay of haystacks) {
    for (const code of RPC_ERROR_CODES) {
      if (hay.includes(code)) return code
    }
  }
  return null
}

export function humanizeRpcError(
  hint: string | null | undefined,
  message?: string | null | undefined
): string {
  const code = extractRpcErrorCode(hint, message)
  switch (code) {
    case 'CROSS_TENANT_ACCESS_DENIED':
      return 'That campaign belongs to another brand. No mission was created.'
    case 'PANEL_INFEASIBLE':
      return 'This category does not have enough competitors for a study yet.'
    case 'TEMPLATE_NOT_FOUND':
    case 'TEMPLATE_NOT_PUBLISHED':
      return 'That study template is not available.'
    case 'TEMPLATE_HAS_NO_BATTLE':
      return 'That template has no battle step and cannot be published.'
    case 'FOCAL_HAS_NO_NODE':
      return 'This product has no category node and cannot anchor a study.'
    case 'NODE_MISMATCH':
      return 'The category node does not match this product.'
    case 'NO_AUTHOR':
      return 'You need to sign in again.'
    case 'CAMPAIGN_NOT_FOUND':
    case 'CAMPAIGN_DELETED':
      return 'That campaign is gone. Create a new one and try again.'
    case 'NOT_A_BRAND_PORTAL_USER':
    case 'NOT_AUTHORIZED':
    case 'FORBIDDEN':
      return 'You are not allowed to do that for this brand.'
    case 'NOT_AUTHENTICATED':
      return 'You need to sign in again.'
    case 'INVALID_TARGET_COMPLETIONS':
      return 'Enter at least 1 completion for this study.'
    default:
      return (hint ?? message)?.trim() || 'Something went wrong. Please try again.'
  }
}

export function parsePreviewMissionFeasibility(data: unknown): PreviewMissionFeasibility {
  const root = requireObject(data, 'preview_mission_feasibility')
  if (!Array.isArray(root.panel)) {
    throw new Error('preview_mission_feasibility: missing array at panel')
  }
  const pool = requireObject(root.pool, 'pool')
  const panelComposition = requireObject(root.panel_composition, 'panel_composition')

  return {
    runnable: requireBoolean(root.runnable, 'runnable'),
    reason: stringOrEmpty(root.reason),
    panel: parsePanelArray(root.panel, 'panel'),
    pool: {
      shortfall: requireNumber(pool.shortfall, 'pool.shortfall'),
    },
    panel_composition: {
      disclosure: stringOrEmpty(panelComposition.disclosure),
    },
    price_cents: requireNumber(root.price_cents, 'price_cents'),
    protocol: parseProtocol(root.protocol),
  }
}

/**
 * Success shape only. Call only when PostgREST `error` is null.
 * Reads frozen `panel` from the response directly (same member shape as preview).
 * Older responses that only returned panel_size (int) will still fail here — that
 * contract is retired; deploy the RPC that returns panel[].
 *
 * If the UI previously showed a parse error, check whether the mission already
 * went live before retrying — the DB may have succeeded while the client failed.
 */
export function parsePublishSuccess(data: unknown): PublishMissionResult {
  const root = requireObject(data, 'publish_mission_from_template')
  if (typeof root.published !== 'boolean') {
    throw new Error('publish_mission_from_template: missing boolean at published')
  }
  if (typeof root.mission_id !== 'string' || root.mission_id.length === 0) {
    throw new Error('publish_mission_from_template: missing string at mission_id')
  }

  const panel = parsePanelArray(root.panel, 'panel')
  const panelSize =
    typeof root.panel_size === 'number' && Number.isFinite(root.panel_size)
      ? root.panel_size
      : panel.length

  const result: PublishMissionResult = {
    published: root.published,
    mission_id: root.mission_id,
    panel_size: panelSize,
    panel,
  }

  if (typeof root.battle_protocol_question_id === 'string') {
    result.battle_protocol_question_id = root.battle_protocol_question_id
  }
  if (typeof root.scoring_rounds === 'number' && Number.isFinite(root.scoring_rounds)) {
    result.scoring_rounds = root.scoring_rounds
  }
  if (
    root.target_completions === null ||
    (typeof root.target_completions === 'number' && Number.isFinite(root.target_completions))
  ) {
    result.target_completions = root.target_completions as number | null
  }

  return result
}

export function parseCreateCampaignDraftResult(data: unknown): CreateCampaignDraftResult {
  const root = requireObject(data, 'create_campaign_draft')
  if (typeof root.campaign_id !== 'string' || root.campaign_id.length === 0) {
    throw new Error('create_campaign_draft returned no campaign_id')
  }
  return {
    campaignId: root.campaign_id,
    missionId: root.mission_id == null ? null : String(root.mission_id),
    protocolId: root.protocol_id == null ? null : String(root.protocol_id),
  }
}

/**
 * Golden payloads that mirror live RPC nullability / publish panel contract.
 * Call assertPreviewParserContract() from CI or `npx tsx` when a runner exists.
 */
export const PREVIEW_PARSER_FIXTURES = {
  runnableWithNullDisplay: {
    runnable: true,
    reason: null,
    panel: [
      {
        position: 0,
        role: 'focal',
        product_id: 1,
        product: 'Gatorade Lemon Lime',
        brand: 'Gatorade',
        parent: null,
        price_tier: null,
        curated: true,
        why: null,
      },
    ],
    pool: { shortfall: 0 },
    panel_composition: { disclosure: null },
    price_cents: 500000,
    protocol: {
      scoring_rounds: 8,
      reliability_repeats: 2,
      total_rounds: 10,
      panel_size_required: 6,
    },
  },
  infeasibleWithReason: {
    runnable: false,
    reason: 'PANEL_INFEASIBLE',
    panel: [],
    pool: { shortfall: 3 },
    panel_composition: { disclosure: '' },
    price_cents: 500000,
    protocol: {
      scoring_rounds: 8,
      reliability_repeats: 2,
      total_rounds: 10,
      panel_size_required: 6,
    },
  },
} as const

/** Publish success with frozen panel[] (not panel_size-only). */
export const PUBLISH_PARSER_FIXTURE = {
  published: true,
  mission_id: '8af06c0a-0000-4000-8000-000000000001',
  panel_size: 7,
  battle_protocol_question_id: 'de000000-0000-4000-d000-000000000001',
  scoring_rounds: 8,
  panel: [
    {
      position: 1,
      role: 'scoring',
      product_id: 1,
      product: 'Powerade Mountain Berry Blast',
      brand: 'POWERADE',
      price_tier: null,
      provenance: 'curated_anchor_tier',
    },
    {
      position: 2,
      role: 'scoring',
      product_id: 2,
      product: 'Zero Calorie Soda',
      brand: 'ZEVIA',
      price_tier: '$$',
      provenance: 'pool',
    },
  ],
} as const

/** Throws if the parser regresses on known live nullability / publish panel. */
export function assertPreviewParserContract(): void {
  const ok = parsePreviewMissionFeasibility(PREVIEW_PARSER_FIXTURES.runnableWithNullDisplay)
  if (!ok.runnable) throw new Error('fixture: expected runnable')
  if (ok.reason !== '') throw new Error('fixture: reason should coerce to empty')
  if (ok.panel[0]?.price_tier !== '') throw new Error('fixture: price_tier should coerce to empty')
  if (ok.panel[0]?.why !== '') throw new Error('fixture: why should coerce to empty')

  const bad = parsePreviewMissionFeasibility(PREVIEW_PARSER_FIXTURES.infeasibleWithReason)
  if (bad.runnable) throw new Error('fixture: expected not runnable')
  if (bad.reason !== 'PANEL_INFEASIBLE') throw new Error('fixture: reason should pass through')

  let threw = false
  try {
    parsePreviewMissionFeasibility({ runnable: true })
  } catch {
    threw = true
  }
  if (!threw) throw new Error('fixture: missing panel must hard-fail')

  const published = parsePublishSuccess(PUBLISH_PARSER_FIXTURE)
  if (published.panel.length !== 2) throw new Error('fixture: publish panel length')
  if (!published.panel[0]?.curated) throw new Error('fixture: provenance should imply curated')
  if (published.panel[0]?.provenance !== 'curated_anchor_tier') {
    throw new Error('fixture: provenance should pass through')
  }
  if (published.panel_size !== 7) throw new Error('fixture: panel_size from response')

  // Old panel_size-only response must still fail loudly (contract retired).
  let oldThrew = false
  try {
    parsePublishSuccess({
      published: true,
      mission_id: 'x',
      panel_size: 7,
    })
  } catch {
    oldThrew = true
  }
  if (!oldThrew) throw new Error('fixture: panel_size-only publish must hard-fail')
}
