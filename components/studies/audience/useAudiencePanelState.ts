'use client'

import { useEffect, useState } from 'react'
import type { AudienceEligibility } from './types'

function hasNarrowFilters(eligibility: AudienceEligibility) {
  return (
    eligibility.targetStates.length > 0 ||
    eligibility.targetCountries.length > 0 ||
    eligibility.requiredDietaryFlags.length > 0 ||
    eligibility.allowedGenders.length > 0 ||
    eligibility.minAge != null ||
    eligibility.maxAge != null ||
    eligibility.minAccountAgeDays != null
  )
}

export function useAudiencePanelState(eligibility: AudienceEligibility) {
  const narrowSet = hasNarrowFilters(eligibility)
  const [narrowOpen, setNarrowOpen] = useState(narrowSet)
  const [dietaryOpen, setDietaryOpen] = useState(
    eligibility.requiredDietaryFlags.length > 0
  )
  const [categoryOpen, setCategoryOpen] = useState(
    eligibility.qualifyingTaxonomyNodeId != null
  )

  useEffect(() => {
    if (narrowSet) setNarrowOpen(true)
  }, [narrowSet])

  useEffect(() => {
    if (eligibility.requiredDietaryFlags.length > 0) setDietaryOpen(true)
  }, [eligibility.requiredDietaryFlags.length])

  useEffect(() => {
    if (eligibility.qualifyingTaxonomyNodeId != null) setCategoryOpen(true)
  }, [eligibility.qualifyingTaxonomyNodeId])

  return {
    narrowSet,
    narrowOpen,
    setNarrowOpen,
    dietaryOpen,
    setDietaryOpen,
    categoryOpen,
    setCategoryOpen,
  }
}
