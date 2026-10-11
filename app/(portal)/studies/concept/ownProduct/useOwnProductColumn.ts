'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { ConceptArmRow } from '@/lib/concept/types'
import { armLabelForIndex, newConceptArm } from '@/lib/concept/defaults'
import type { AddAvailability } from '@/lib/concept/fieldSize'
import { FIELD_ADD_DESIGN_EVENT } from '@/lib/concept/studyMasthead'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'

export function useOwnProductColumn({
  arms,
  onArmsChange,
  priceMode,
  addVariant: addVariantAvailability,
  disabled,
}: {
  arms: ConceptArmRow[]
  onArmsChange: (next: ConceptArmRow[]) => void
  priceMode: boolean
  addVariant: AddAvailability
  disabled?: boolean
}) {
  const nameFocusRef = useRef<HTMLInputElement | null>(null)
  const [focusName, setFocusName] = useState(false)
  const [dragArmId, setDragArmId] = useState<string | null>(null)
  // Latches once setup begins so clearing a field never bounces back to the invitation.
  const [revealed, setRevealed] = useState(false)

  const configured = arms.some((a) => a.display_name.trim() || a.image_url)
  const showEmptyState = !configured && !revealed
  const multi = arms.length > 1

  useEffect(() => {
    if (focusName) {
      nameFocusRef.current?.focus()
      setFocusName(false)
    }
  }, [focusName, arms.length])

  const mastheadAddRef = useRef<() => void>(() => {})
  mastheadAddRef.current = () => {
    if (disabled) return
    if (!configured && !revealed) {
      startSetup()
      return
    }
    addVariant()
  }

  useEffect(() => {
    const root = document.getElementById(CONCEPT_ANCHORS.field)
    if (!root) return
    function onMastheadAdd() {
      mastheadAddRef.current()
    }
    root.addEventListener(FIELD_ADD_DESIGN_EVENT, onMastheadAdd)
    return () => root.removeEventListener(FIELD_ADD_DESIGN_EVENT, onMastheadAdd)
  }, [])

  /**
   * This action owns creation of the first product.
   *
   * A fresh draft now arrives with zero arms (Pass 3), so the common path here
   * is "make the first row". The `arms.length > 1` branch is legacy handling:
   * drafts stored before Pass 3 can still carry two blank seed rows, and those
   * collapse to one rather than leaving the operator owing two names.
   */
  function startSetup() {
    setRevealed(true)
    if (arms.length === 0) {
      onArmsChange([newConceptArm(0)])
    } else if (arms.length > 1) {
      onArmsChange([{ ...arms[0]!, arm_label: armLabelForIndex(0) }])
    }
    setFocusName(true)
  }

  function addVariant() {
    if (priceMode || !addVariantAvailability.allowed) return
    onArmsChange([...arms, newConceptArm(arms.length)])
    setFocusName(true)
  }

  function removeVariant(localId: string) {
    onArmsChange(
      arms
        .filter((a) => a.localId !== localId)
        .map((a, i) => ({ ...a, arm_label: armLabelForIndex(i) }))
    )
  }

  function patchArm(localId: string, patch: Partial<ConceptArmRow>) {
    onArmsChange(arms.map((a) => (a.localId === localId ? { ...a, ...patch } : a)))
  }

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return
    const next = [...arms]
    const from = next.findIndex((a) => a.localId === fromId)
    const to = next.findIndex((a) => a.localId === toId)
    if (from < 0 || to < 0) return
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item!)
    onArmsChange(next.map((a, i) => ({ ...a, arm_label: armLabelForIndex(i) })))
  }

  function onNameKeyDown(e: KeyboardEvent, isLast: boolean) {
    if (e.key === 'Enter' && isLast && !priceMode) {
      e.preventDefault()
      addVariant()
    }
  }

  return {
    nameFocusRef,
    dragArmId,
    setDragArmId,
    showEmptyState,
    multi,
    startSetup,
    addVariant,
    removeVariant,
    patchArm,
    reorder,
    onNameKeyDown,
  }
}
