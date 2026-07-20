import type { EvidenceRung } from './types'

export const RUNG_TOOLTIPS: Record<EvidenceRung, string> = {
  synthetic: 'fabricated to fill a blank',
  inferred: 'a model guessed this',
  imported: 'third-party import, unreviewed',
  authoritative: 'curated source',
  brand_added: 'you filled a blank',
  brand_stated: 'you stated this',
  brand_verified: 'you stated this, domain verified',
  human_verified: 'Dough checked this against the label photo',
}

export function isEvidenceRung(value: string | null | undefined): value is EvidenceRung {
  return !!value && value in RUNG_TOOLTIPS
}

export function rungLabel(rung: string): string {
  return rung.replace(/_/g, ' ')
}
