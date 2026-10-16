import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { declareProductFacet, withdrawProductFacetDeclaration } from '@/lib/facets/api'
import {
  filterDerivedValues,
  isLiveDeclaredState,
  isPendingReviewState,
  rowIsPickerEditable,
  type DeclarableFacetRow,
} from '@/lib/facets/productFacets'

export function useClaimCard({
  row,
  productId,
  canEdit,
  setBusyKey,
  setError,
  onWrote,
}: {
  row: DeclarableFacetRow
  productId: number
  canEdit: boolean
  setBusyKey: (k: string | null) => void
  setError: (e: string | null) => void
  onWrote: () => Promise<void>
}) {
  const derived = filterDerivedValues(row.facet_type, row.derived_values)
  const declared = row.declared_values ?? []
  const live = declared.filter((d) => isLiveDeclaredState(d.review_state))
  const pending = declared.filter((d) => isPendingReviewState(d.review_state))
  const available = row.available_values ?? []
  const multi = row.cardinality === 'multi'
  const requiresEvidence = Boolean(row.requires_evidence)
  const showPicker = canEdit && rowIsPickerEditable(row)

  const liveValues = new Set(live.map((d) => d.value))
  const derivedSet = new Set(derived.map((d) => d.value))
  const taken = new Set([...liveValues, ...derivedSet])

  const [draftSingle, setDraftSingle] = useState<string | null>(live[0]?.value ?? null)
  const [pendingAdd, setPendingAdd] = useState<string | null>(null)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [evidenceNote, setEvidenceNote] = useState('')

  useEffect(() => {
    setDraftSingle(live[0]?.value ?? null)
    setPendingAdd(null)
    setEvidenceUrl('')
    setEvidenceNote('')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when the facet or declaration ids change; live is a new array every render
  }, [row.facet_type, live.map((d) => d.declaration_id).join(',')])

  const onWithdraw = async (declarationId: number) => {
    if (!showPicker) return
    const supabase = createClient()
    setBusyKey(`${row.facet_type}:w-${declarationId}`)
    setError(null)
    const res = await withdrawProductFacetDeclaration(supabase, declarationId, false)
    setBusyKey(null)
    if (res.error) {
      setError(res.error)
      return
    }
    await onWrote()
  }

  const declareValues = async (values: string[]) => {
    if (!showPicker || values.length === 0) return
    if (requiresEvidence && !evidenceUrl.trim()) {
      setError('Add a link to your certification.')
      return
    }
    const supabase = createClient()
    setBusyKey(`${row.facet_type}:declare`)
    setError(null)
    let mutated = false
    let failed = false
    for (const value of values) {
      const res = await declareProductFacet(supabase, {
        productId,
        facetType: row.facet_type,
        facetValue: value,
        evidenceUrl: requiresEvidence ? evidenceUrl.trim() : null,
        evidenceNote: requiresEvidence ? evidenceNote.trim() || null : null,
      })
      if (res.error) {
        setError(res.error)
        failed = true
        break
      }
      mutated = true
    }
    setBusyKey(null)
    if (!failed) {
      setPendingAdd(null)
      setEvidenceUrl('')
      setEvidenceNote('')
    }
    if (mutated) await onWrote()
  }

  const saveSingle = async () => {
    if (!showPicker) return
    const next = draftSingle
    const current = live[0]?.value ?? null
    if (next === current) return

    const supabase = createClient()
    setBusyKey(`${row.facet_type}:declare`)
    setError(null)
    let mutated = false

    for (const d of live) {
      if (next && d.value === next) continue
      const res = await withdrawProductFacetDeclaration(supabase, d.declaration_id, false)
      if (res.error) {
        setError(res.error)
        setBusyKey(null)
        if (mutated) await onWrote()
        return
      }
      mutated = true
    }

    if (next && !derivedSet.has(next)) {
      if (requiresEvidence && !evidenceUrl.trim()) {
        setError('Add a link to your certification.')
        setBusyKey(null)
        if (mutated) await onWrote()
        return
      }
      const res = await declareProductFacet(supabase, {
        productId,
        facetType: row.facet_type,
        facetValue: next,
        evidenceUrl: requiresEvidence ? evidenceUrl.trim() : null,
        evidenceNote: requiresEvidence ? evidenceNote.trim() || null : null,
      })
      if (res.error) {
        setError(res.error)
        setBusyKey(null)
        if (mutated) await onWrote()
        return
      }
      mutated = true
    }

    setBusyKey(null)
    if (mutated) await onWrote()
  }

  const singleDirty =
    (draftSingle ?? null) !== (live[0]?.value ?? null) &&
    !(draftSingle && derivedSet.has(draftSingle) && !live[0])

  return {
    derived,
    live,
    pending,
    available,
    multi,
    requiresEvidence,
    showPicker,
    taken,
    derivedSet,
    draftSingle,
    setDraftSingle,
    pendingAdd,
    setPendingAdd,
    evidenceUrl,
    setEvidenceUrl,
    evidenceNote,
    setEvidenceNote,
    onWithdraw,
    declareValues,
    saveSingle,
    singleDirty,
  }
}
