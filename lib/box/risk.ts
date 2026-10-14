/**
 * Box risk declaration (A2). The brand answers what is in the box; the server
 * also derives alcohol from taxonomy (taxonomy_box_risk) and refuses restricted
 * categories (cannabis/hemp, nicotine, kratom). The server is authoritative —
 * these helpers only shape the draft, the wire, and the builder's readiness.
 */
import type { BoxStudyDraft } from './types'

export type BoxRiskDeclarationDraft = {
  /** null = not answered yet. Forced true when taxonomy detects alcohol. */
  containsAlcohol: boolean | null
  containsCaffeine: boolean | null
  noProhibitedSubstances: boolean
  alcoholShippingCompliant: boolean
}

export type BoxRiskDeclarationWire = {
  contains_alcohol: boolean
  contains_caffeine: boolean
  no_prohibited_substances: true
  alcohol_shipping_compliant?: true
}

/** Server verdict per taxonomy node, from taxonomy_box_risk. */
export type BoxTaxonomyRiskValue = 'alcohol' | 'restricted' | null

export type BoxTaxonomyRisk =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'unavailable' }
  | { status: 'ready'; alcohol: boolean; restrictedNodeIds: number[] }

export const ALCOHOL_MIN_AGE = 21

export function createEmptyRiskDeclaration(): BoxRiskDeclarationDraft {
  return {
    containsAlcohol: null,
    containsCaffeine: null,
    noProhibitedSubstances: false,
    alcoholShippingCompliant: false,
  }
}

function boolOrNull(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null
}

export function sanitizeRiskDeclaration(raw: unknown): BoxRiskDeclarationDraft {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return createEmptyRiskDeclaration()
  }
  const r = raw as Record<string, unknown>
  return {
    containsAlcohol: boolOrNull(r.containsAlcohol),
    containsCaffeine: boolOrNull(r.containsCaffeine),
    noProhibitedSubstances: r.noProhibitedSubstances === true,
    alcoholShippingCompliant: r.alcoholShippingCompliant === true,
  }
}

/** Box category plus every resolved seat's category, deduped, in order. */
export function boxRiskNodeIds(draft: BoxStudyDraft): number[] {
  const ids: number[] = []
  const push = (id: number | null | undefined) => {
    if (typeof id === 'number' && Number.isSafeInteger(id) && !ids.includes(id)) {
      ids.push(id)
    }
  }
  push(draft.taxonomyNodeId)
  for (const row of draft.fieldProducts) {
    if (row.kind === 'prototype') push(row.prototypeSnapshot?.taxonomy_node_id)
    else push(row.taxonomy_node_id)
  }
  return ids
}

export function summarizeTaxonomyRisk(
  verdicts: ReadonlyArray<{ nodeId: number; risk: BoxTaxonomyRiskValue }>
): Extract<BoxTaxonomyRisk, { status: 'ready' }> {
  return {
    status: 'ready',
    alcohol: verdicts.some((v) => v.risk === 'alcohol'),
    restrictedNodeIds: verdicts
      .filter((v) => v.risk === 'restricted')
      .map((v) => v.nodeId),
  }
}

export function alcoholDetected(risk: BoxTaxonomyRisk): boolean {
  return risk.status === 'ready' && risk.alcohol
}

/**
 * Throws the server's HINT code when the declaration is incomplete, so the
 * publish action maps it through the same copy as a server refusal.
 */
export function riskDeclarationToWire(
  decl: BoxRiskDeclarationDraft
): BoxRiskDeclarationWire {
  if (decl.containsAlcohol == null || decl.containsCaffeine == null) {
    throw new Error('RISK_DECLARATION_REQUIRED')
  }
  if (!decl.noProhibitedSubstances) throw new Error('RISK_DECLARATION_REQUIRED')
  const wire: BoxRiskDeclarationWire = {
    contains_alcohol: decl.containsAlcohol,
    contains_caffeine: decl.containsCaffeine,
    no_prohibited_substances: true,
  }
  if (decl.containsAlcohol) {
    if (!decl.alcoholShippingCompliant) {
      throw new Error('ALCOHOL_SHIPPING_ATTESTATION_REQUIRED')
    }
    wire.alcohol_shipping_compliant = true
  }
  return wire
}

export type BoxRiskOutstanding = {
  /** Blocks publish. */
  blocking: string[]
  /** Shown, never blocks — the server re-checks taxonomy on publish. */
  soft: string[]
}

export function boxRiskOutstanding(
  decl: BoxRiskDeclarationDraft,
  risk: BoxTaxonomyRisk
): BoxRiskOutstanding {
  const blocking: string[] = []
  const soft: string[] = []
  if (risk.status === 'ready' && risk.restrictedNodeIds.length > 0) {
    blocking.push(
      'Runoff can’t ship cannabis, hemp, CBD, nicotine, or kratom products. Remove them from the box.'
    )
  }
  if (risk.status === 'unavailable') {
    soft.push('Couldn’t check the box’s categories. Runoff checks them again when you publish.')
  }
  const alcohol = decl.containsAlcohol === true || alcoholDetected(risk)
  if (decl.containsAlcohol == null && !alcoholDetected(risk)) {
    blocking.push('Say whether anything in the box contains alcohol.')
  }
  if (decl.containsCaffeine == null) {
    blocking.push('Say whether anything in the box contains caffeine.')
  }
  if (!decl.noProhibitedSubstances) {
    blocking.push('Confirm nothing in the box contains THC, CBD, nicotine, or kratom.')
  }
  if (alcohol && !decl.alcoholShippingCompliant) {
    blocking.push('Confirm you can legally ship alcohol with an adult signature.')
  }
  return { blocking, soft }
}

/** Short line for summaries and the published dialog. */
export function riskFlagsLabel(flags: readonly string[]): string | null {
  const parts: string[] = []
  if (flags.includes('alcohol')) parts.push(`${ALCOHOL_MIN_AGE}+ · Contains alcohol`)
  if (flags.includes('caffeine')) parts.push('Contains caffeine')
  return parts.length ? parts.join(' · ') : null
}
