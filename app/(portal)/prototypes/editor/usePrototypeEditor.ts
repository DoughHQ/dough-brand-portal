import { useEffect, useState, useTransition } from 'react'
import { getTaxonomyNodeAction } from '@/app/(portal)/studies/audienceActions'
import type { TaxonomyNodeInfo } from '@/lib/studies/taxonomy'
import {
  archiveBrandPrototypeAction,
  declarePrototypeAllergensAction,
  saveBrandPrototypeAction,
} from '../actions'
import type { PrototypeListItem, PrototypePackaging } from '@/lib/prototypes/types'

export type PrototypeEditorState = ReturnType<typeof usePrototypeEditor>

export function usePrototypeEditor({
  brandId,
  initial,
  onClose,
  onSaved,
  onArchived,
}: {
  brandId: number
  initial: PrototypeListItem | null
  onClose: () => void
  onSaved: (row: PrototypeListItem) => void
  onArchived: (id: string) => void
}) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(initial?.name ?? '')
  const [internalLabel, setInternalLabel] = useState(initial?.internal_label ?? '')
  const [packaging, setPackaging] = useState<PrototypePackaging>(
    initial?.packaging ?? 'plain_sample'
  )
  const [price, setPrice] = useState(
    initial?.planned_price != null ? String(initial.planned_price) : ''
  )
  const [imagePaths, setImagePaths] = useState<string[]>(initial?.image_paths ?? [])
  const [node, setNode] = useState<TaxonomyNodeInfo | null>(null)
  const [taxonomyNodeId, setTaxonomyNodeId] = useState<number | null>(
    initial?.taxonomy_node_id ?? null
  )
  const [contains, setContains] = useState<string[]>(initial?.allergens_contains ?? [])
  const [mayContain, setMayContain] = useState<string[]>(initial?.allergens_may_contain ?? [])
  const [allergensDeclared, setAllergensDeclared] = useState(
    initial?.allergens_declared_at != null
  )
  const [error, setError] = useState<string | null>(null)
  const [prototypeId, setPrototypeId] = useState<string | null>(initial?.id ?? null)

  useEffect(() => {
    if (taxonomyNodeId == null) {
      setNode(null)
      return
    }
    let cancelled = false
    void getTaxonomyNodeAction(taxonomyNodeId).then((n) => {
      if (!cancelled) setNode(n)
    })
    return () => {
      cancelled = true
    }
  }, [taxonomyNodeId])

  function parsePrice(): number | null {
    const t = price.trim()
    if (!t) return null
    const n = Number(t)
    if (!Number.isFinite(n) || n <= 0) return null
    return Math.round(n * 100) / 100
  }

  function save(andDeclare: boolean) {
    setError(null)
    if (!name.trim()) {
      setError('Name the prototype.')
      return
    }
    if (taxonomyNodeId == null) {
      setError('Pick a category.')
      return
    }
    const plannedPrice = parsePrice()
    if (price.trim() && plannedPrice == null) {
      setError('Enter a valid shelf price, or leave it blank.')
      return
    }

    startTransition(async () => {
      const saved = await saveBrandPrototypeAction({
        prototypeId,
        brandId,
        name,
        internalLabel: internalLabel.trim() || null,
        taxonomyNodeId,
        packaging,
        plannedPrice,
        imagePaths,
      })
      if (!saved.ok) {
        setError(saved.error)
        return
      }
      setPrototypeId(saved.data.id)

      if (andDeclare || allergensDeclared) {
        if (!allergensDeclared) {
          onSaved(saved.data)
          onClose()
          return
        }
        const declared = await declarePrototypeAllergensAction({
          prototypeId: saved.data.id,
          contains,
          mayContain,
        })
        if (!declared.ok) {
          setError(declared.error)
          onSaved(saved.data)
          return
        }
        onSaved(declared.data)
        onClose()
        return
      }

      onSaved(saved.data)
      onClose()
    })
  }

  function archive() {
    if (!prototypeId) {
      onClose()
      return
    }
    if (!window.confirm('Archive this prototype? It will leave the active library.')) return
    startTransition(async () => {
      const result = await archiveBrandPrototypeAction(prototypeId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onArchived(prototypeId)
      onClose()
    })
  }

  return {
    pending,
    name,
    setName,
    internalLabel,
    setInternalLabel,
    packaging,
    setPackaging,
    price,
    setPrice,
    imagePaths,
    setImagePaths,
    node,
    setNode,
    taxonomyNodeId,
    setTaxonomyNodeId,
    contains,
    setContains,
    mayContain,
    setMayContain,
    allergensDeclared,
    setAllergensDeclared,
    error,
    prototypeId,
    save,
    archive,
  }
}
