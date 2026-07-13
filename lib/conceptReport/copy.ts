import type {
  ConceptMissionReport,
  DecisionFrame,
  Finding,
  RelationshipToField,
  WinRateFieldRow,
} from './types'

const RELATIONSHIP_CLAUSE: Record<string, string> = {
  concept_leads_field: 'Your concept leads the field in this test.',
  concept_ahead_of_some_products: 'Your strongest concept is ahead of some real products.',
  products_lead_concepts: 'Real products currently lead your concepts.',
}

export function relationshipClause(value: RelationshipToField | string): string {
  return RELATIONSHIP_CLAUSE[value] ?? ''
}

export function battleIntentLabel(intent: string): string {
  switch (intent) {
    case 'own_concept_arm':
      return 'your concept'
    case 'direct_competitor':
      return 'competitor'
    case 'jtbd_incumbent':
      return 'alternative people reach for'
    default:
      return intent.replace(/_/g, ' ')
  }
}

export function isOwnConceptIntent(intent: string): boolean {
  return intent === 'own_concept_arm'
}

export function postureStatusLabel(posture: string): string {
  switch (posture) {
    case 'early_read':
      return 'Early read'
    case 'tie_break_needed':
      return 'Statistical tie'
    case 'concept_ahead':
      return 'Concept ahead'
    case 'mixed':
      return 'Mixed field'
    case 'products_lead':
      return 'Products lead'
    default:
      return posture.replace(/_/g, ' ')
  }
}

/** Thin sample — prefer finding.is_thin; fall back to warning / all unplaceable. */
export function isThinSampleReport(report: {
  finding: { is_thin?: boolean }
  min_cluster_warning: string
  win_rate_field: WinRateFieldRow[]
}): boolean {
  if (report.finding.is_thin === true) return true
  if (report.min_cluster_warning.trim().length > 0) return true
  if (report.win_rate_field.length === 0) return true
  return report.win_rate_field.every((row) => !row.placeable)
}

export function thinSampleBannerCopy(nRespondents: number): string {
  const n = Math.max(0, nRespondents)
  const label = n === 1 ? 'respondent' : 'respondents'
  return `Early read — only ${n} ${label}. Rankings below are directional and have no reliable margin yet. These numbers will move as more people complete.`
}

/** Confident verdict line — only when headline_kind allows and not thin. */
export function buildConfidentVerdictLine(finding: Finding): string {
  const topName = finding.top.display_name
  const topRate = finding.top.win_rate_of_100
  const rateBit =
    topRate != null ? `${topName} wins ${Math.round(topRate)} of 100` : topName

  if (finding.is_tie && finding.tie_with) {
    return `${rateBit}. ${topName} and ${finding.tie_with.display_name} are statistically tied at this sample — the data can't yet say which is preferred.`
  }

  const rel = relationshipClause(finding.relationship_to_field)
  return [rateBit + '.', rel].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

export function buildProvisionalVerdictLine(finding: Finding): string {
  return `So far, ${finding.top.display_name} is ahead — but this is far too early to rely on.`
}

/**
 * Whether the verdict may use confident copy.
 * Thin always wins over a contradictory confident headline_kind.
 */
export function isConfidentVerdict(
  frame: DecisionFrame,
  thin: boolean
): boolean {
  if (thin) return false
  return frame.headline_kind === 'confident'
}

/** Fallback when server omits decision_frame — templates only, no math. */
export function decisionFrameFromFinding(finding: Finding, thin: boolean): DecisionFrame {
  if (thin || finding.is_thin) {
    return {
      posture: 'early_read',
      action: 'Collect more respondents',
      rationale:
        'Point rankings have no reliable margin yet. Wait until intervals appear before treating any concept as ahead.',
      headline_kind: 'provisional',
    }
  }

  if (finding.is_tie) {
    const n = finding.suggested_additional_respondents
    return {
      posture: 'tie_break_needed',
      action:
        n != null
          ? `Collect about ${n} more respondents`
          : 'Collect more respondents to break the tie',
      rationale: `${finding.top.display_name} and ${finding.tie_with?.display_name ?? 'another competitor'} sit in overlapping ranges. Don’t force a single winner from this sample.`,
      headline_kind: 'provisional',
    }
  }

  if (finding.relationship_to_field === 'products_lead_concepts') {
    return {
      posture: 'products_lead',
      action: 'Iterate concepts, then retest',
      rationale:
        'Respondents preferred shelf products over your concept arms here. Change the work before spending on another head-to-head field. This is not a sales forecast.',
      headline_kind: 'confident',
    }
  }

  if (
    finding.relationship_to_field === 'concept_leads_field' ||
    finding.relationship_to_field === 'concept_ahead_of_some_products'
  ) {
    return {
      posture: 'concept_ahead',
      action: 'Advance the top concept into next research',
      rationale: `In this test, respondents preferred ${finding.top.display_name} over part or all of the field. Sensible next step: qual / pack / IHUT — not a launch recommendation.`,
      headline_kind: 'confident',
    }
  }

  return {
    posture: 'mixed',
    action: 'Review the evidence before deciding',
    rationale: 'Use the win rates below. Don’t force a call the sample can’t support.',
    headline_kind: 'provisional',
  }
}

export function formatPrice(raw: number | string | null | undefined): string | null {
  if (raw == null || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return null
  return `$${n.toFixed(2)}`
}

export function formatSnapshotDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export function formatPctPoint(rate: number): string {
  const pct = rate <= 1 ? rate * 100 : rate
  return `${Math.round(pct)}%`
}

export function monogramFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Status chip for cold open — thin dominates. */
export function findingStatusChip(
  finding: Finding,
  thin: boolean
): string {
  if (thin) return 'Early read'
  if (finding.is_tie) return 'Statistical tie'
  if (finding.relationship_to_field === 'products_lead_concepts') return 'Products lead'
  if (
    finding.relationship_to_field === 'concept_leads_field' ||
    finding.relationship_to_field === 'concept_ahead_of_some_products'
  ) {
    return 'Decisive in this sample'
  }
  return 'Mixed field'
}

export type { ConceptMissionReport }
