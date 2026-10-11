'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BoxFieldRow, BoxSeatRole, BoxStudyDraft } from '@/lib/box/types'
import type { AdminProductSearchResult } from '@/lib/queries'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import { boxFieldRowErrors, type BoxPublishFailure } from '@/lib/box/validity'
import {
  applyPrototypeToSeat,
  createPrototypeSeatFromItem,
} from '@/lib/box/applyPrototypeSeat'
import { hydrateBoxFieldRow } from '@/lib/box/hydrate'
import {
  canAddBoxProduct,
  isResolvedBoxSeat,
  MAX_BOX_FIELD_SIZE,
} from '@/lib/box/fieldSize'
import { isIdentityConfirmed } from '@/lib/productEntryMode'
import { createClient } from '@/lib/supabase'
import { catalogSeatFromPick } from './catalogSeat'
import type { Composer, ComposerIntent } from './types'

export function useContentsField({
  draft,
  onChange,
  publishFailure = null,
}: {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  publishFailure?: BoxPublishFailure | null
}) {
  const [composer, setComposer] = useState<Composer>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const prunedRef = useRef(false)

  // Drop any unresolved seats left by older Kind-toggle drafts (concept rule:
  // an open search box must never occupy a field seat).
  useEffect(() => {
    if (prunedRef.current) return
    const dirty = draft.fieldProducts.some((r) => !isResolvedBoxSeat(r))
    if (!dirty) {
      prunedRef.current = true
      return
    }
    prunedRef.current = true
    onChange({
      ...draft,
      fieldProducts: draft.fieldProducts.filter(isResolvedBoxSeat),
    })
  }, [draft, onChange])

  const rows = useMemo(
    () => draft.fieldProducts.filter(isResolvedBoxSeat),
    [draft.fieldProducts]
  )

  const takenProducts = useMemo(
    () =>
      new Set(
        rows
          .map((r) => r.product_id)
          .filter((id): id is number => id != null)
          .map(String)
      ),
    [rows]
  )
  const takenPrototypes = useMemo(
    () => new Set(rows.map((r) => r.prototype_id).filter((id): id is string => !!id)),
    [rows]
  )
  const rowErrors = useMemo(
    () => boxFieldRowErrors(draft, publishFailure),
    [draft, publishFailure]
  )

  const canAdd = canAddBoxProduct(draft)
  const overBy = Math.max(0, rows.length - MAX_BOX_FIELD_SIZE)
  const missingUpcCount = rows.filter(
    (r) => r.kind !== 'prototype' && r.product_id != null && !r.upc?.trim()
  ).length
  const unconfirmedCount = rows.filter(
    (r) =>
      r.kind !== 'prototype' &&
      r.product_id != null &&
      !!r.upc?.trim() &&
      !isIdentityConfirmed(r)
  ).length

  function commitRows(nextRows: BoxFieldRow[], extra?: Partial<BoxStudyDraft>) {
    const current = draftRef.current
    let taxonomyNodeId = extra?.taxonomyNodeId ?? current.taxonomyNodeId
    if (taxonomyNodeId == null) {
      const seed = nextRows.find(
        (r) => r.role === 'yours' && r.taxonomy_node_id != null
      )
      if (seed?.taxonomy_node_id != null) taxonomyNodeId = seed.taxonomy_node_id
    }
    const yoursCatalog = nextRows.find(
      (r) => r.role === 'yours' && r.kind !== 'prototype' && r.product_id != null
    )
    onChange({
      ...current,
      ...extra,
      taxonomyNodeId,
      focalProductId: yoursCatalog?.product_id ?? current.focalProductId,
      fieldProducts: nextRows,
    })
  }

  function patchRow(localId: string, next: BoxFieldRow) {
    commitRows(
      draftRef.current.fieldProducts.map((r) => (r.localId === localId ? next : r))
    )
  }

  function openComposer(intent: ComposerIntent, replace?: BoxFieldRow) {
    if (!replace && !canAddBoxProduct(draftRef.current)) return
    setComposer({
      intent,
      replaceLocalId: replace?.localId,
      previous: replace,
    })
  }

  function cancelComposer() {
    if (composer?.previous && composer.replaceLocalId) {
      patchRow(composer.replaceLocalId, composer.previous)
    }
    setComposer(null)
  }

  function upsertResolved(row: BoxFieldRow) {
    const current = draftRef.current
    if (composer?.replaceLocalId) {
      commitRows(
        current.fieldProducts.map((r) =>
          r.localId === composer.replaceLocalId
            ? { ...row, localId: composer.replaceLocalId, role: row.role }
            : r
        )
      )
    } else {
      commitRows([...current.fieldProducts.filter(isResolvedBoxSeat), row])
    }
    setComposer(null)
  }

  function addCatalog(p: AdminProductSearchResult, knownUpc?: string) {
    if (!composer) return
    const role: BoxSeatRole =
      composer.intent === 'competitor_catalog' ? 'competitor' : 'yours'
    const keepRole = composer.previous?.role
    const row = catalogSeatFromPick(p, keepRole ?? role, knownUpc)
    const provisionalLocalId = composer.replaceLocalId ?? row.localId
    const withId = { ...row, localId: provisionalLocalId }
    upsertResolved(withId)
    void hydrateBoxFieldRow(createClient(), withId, p, knownUpc).then((hydrated) => {
      if (draftRef.current.fieldProducts.some((r) => r.localId === provisionalLocalId)) {
        patchRow(provisionalLocalId, {
          ...hydrated,
          localId: provisionalLocalId,
          kind: 'product',
          role: withId.role,
        })
      }
    })
  }

  function addPrototype(item: PrototypeListItem, imageUrl: string | null) {
    if (!composer) return
    const role: BoxSeatRole = composer.previous?.role ?? 'yours'
    const row =
      composer.replaceLocalId && composer.previous
        ? applyPrototypeToSeat(composer.previous, item, { imageUrl, role })
        : createPrototypeSeatFromItem(item, { imageUrl, role })
    if (composer.replaceLocalId) {
      upsertResolved({ ...row, localId: composer.replaceLocalId })
    } else {
      upsertResolved(row)
    }
  }

  function removeRow(localId: string) {
    const current = draftRef.current
    const removed = current.fieldProducts.find((r) => r.localId === localId)
    const nextRows = current.fieldProducts.filter((r) => r.localId !== localId)
    commitRows(nextRows, {
      focalProductId:
        removed?.product_id != null && removed.product_id === current.focalProductId
          ? null
          : current.focalProductId,
    })
    if (composer?.replaceLocalId === localId) setComposer(null)
  }

  return {
    composer,
    rows,
    takenProducts,
    takenPrototypes,
    rowErrors,
    canAdd,
    overBy,
    missingUpcCount,
    unconfirmedCount,
    isEmpty: rows.length === 0,
    openComposer,
    cancelComposer,
    addCatalog,
    addPrototype,
    removeRow,
    patchRow,
  }
}
