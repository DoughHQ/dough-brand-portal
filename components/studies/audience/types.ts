export type AudienceEligibility = {
  targetStates: string[]
  targetCountries: string[]
  requiredDietaryFlags: string[]
  allowedGenders: string[]
  minAge: number | null
  maxAge: number | null
  minAccountAgeDays: number | null
  qualifyingTaxonomyNodeId: number | null
  qualifyingNodeLabel: string | null
  minCategoryBattles: number | null
  minCategoryTries: number | null
  minCategoryLevel: number | null
}

export type PatchAudienceEligibility = (
  next: Partial<AudienceEligibility>
) => void
