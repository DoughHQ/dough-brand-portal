import {
  ALCOHOL_MIN_AGE,
  alcoholDetected,
  type BoxRiskDeclarationDraft,
  type BoxTaxonomyRisk,
} from '@/lib/box/risk'

export function summarizeRiskSection(
  decl: BoxRiskDeclarationDraft,
  taxonomyRisk: BoxTaxonomyRisk
): string {
  const alcohol = decl.containsAlcohol === true || alcoholDetected(taxonomyRisk)
  const parts: string[] = []
  if (alcohol) parts.push(`${ALCOHOL_MIN_AGE}+ · Contains alcohol`)
  if (decl.containsCaffeine) parts.push('Contains caffeine')
  if (parts.length) return parts.join(' · ')
  if (decl.containsAlcohol === false && decl.containsCaffeine === false) {
    return 'No alcohol or caffeine'
  }
  return 'Not answered yet'
}
