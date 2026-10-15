import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  declareProductFacet,
  withdrawProductFacetDeclaration,
} from '@/lib/facets/api'
import {
  facetValueLabel,
  isLiveDeclaredState,
  isPendingReviewState,
  type DeclarableFacetRow,
  type FacetDeclaredValue,
} from '@/lib/facets/productFacets'

export type FlavorNotesState = ReturnType<typeof useFlavorNotes>

export function useFlavorNotes({
  row,
  productId,
  canEdit,
  busyKey,
  setBusyKey,
  setError,
  onWrote,
}: {
  row: DeclarableFacetRow
  productId: number
  canEdit: boolean
  busyKey: string | null
  setBusyKey: (k: string | null) => void
  setError: (e: string | null) => void
  onWrote: () => Promise<void>
}) {
  const declared = row.declared_values ?? []
  const live = declared.filter((d) => isLiveDeclaredState(d.review_state))
  const pending = declared.filter((d) => isPendingReviewState(d.review_state))
  const available = row.available_values ?? []
  const showPicker = canEdit && available.length > 0
  const taken = useMemo(
    () => new Set([...live, ...pending].map((d) => d.value)),
    [live, pending],
  )

  const [draftValue, setDraftValue] = useState<string | null>(null)
  const [draftNote, setDraftNote] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNote, setEditNote] = useState('')
  const liveDeclarationIds = live.map((d) => d.declaration_id).join(',')
  const pendingDeclarationIds = pending.map((d) => d.declaration_id).join(',')

  useEffect(() => {
    setDraftValue(null)
    setDraftNote('')
    setEditingId(null)
    setEditNote('')
  }, [row.facet_type, liveDeclarationIds, pendingDeclarationIds])

  const draftLabel = draftValue
    ? facetValueLabel(row, draftValue, available.find((o) => o.value === draftValue)?.label)
    : null

  const busy = busyKey != null && busyKey.startsWith(`${row.facet_type}:`)

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

  const commitDraft = async () => {
    if (!showPicker || !draftValue) return
    const supabase = createClient()
    setBusyKey(`${row.facet_type}:declare`)
    setError(null)
    const res = await declareProductFacet(supabase, {
      productId,
      facetType: row.facet_type,
      facetValue: draftValue,
      brandNote: draftNote.trim() || null,
    })
    setBusyKey(null)
    if (res.error) {
      setError(res.error)
      return
    }
    setDraftValue(null)
    setDraftNote('')
    await onWrote()
  }

  const saveEdit = async (d: FacetDeclaredValue) => {
    if (!showPicker) return
    const next = editNote.trim()
    const prev = (d.brand_note ?? '').trim()
    if (next === prev) {
      setEditingId(null)
      return
    }
    // Re-declare same value updates brand_note when a non-empty note is sent.
    // Clearing a note isn't supported by the RPC (nullif skips empty) — leave as-is.
    if (!next) {
      setError('Tasting notes can’t be cleared here yet — withdraw and re-add if you need a blank note.')
      return
    }
    const supabase = createClient()
    setBusyKey(`${row.facet_type}:note-${d.declaration_id}`)
    setError(null)
    const res = await declareProductFacet(supabase, {
      productId,
      facetType: row.facet_type,
      facetValue: d.value,
      brandNote: next,
    })
    setBusyKey(null)
    if (res.error) {
      setError(res.error)
      return
    }
    setEditingId(null)
    setEditNote('')
    await onWrote()
  }

  const notes = [...live, ...pending]

  return {
    available,
    showPicker,
    taken,
    draftValue,
    setDraftValue,
    draftNote,
    setDraftNote,
    editingId,
    setEditingId,
    editNote,
    setEditNote,
    draftLabel,
    busy,
    onWithdraw,
    commitDraft,
    saveEdit,
    notes,
  }
}
