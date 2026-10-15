'use client'

import type { DeclarableFacetRow } from '@/lib/facets/productFacets'
import { NotesAdd } from '@/components/products/flavorNotes/NotesAdd'
import { NotesList } from '@/components/products/flavorNotes/NotesList'
import { useFlavorNotes } from '@/components/products/flavorNotes/useFlavorNotes'

type Props = {
  row: DeclarableFacetRow
  productId: number
  canEdit: boolean
  busyKey: string | null
  setBusyKey: (k: string | null) => void
  setError: (e: string | null) => void
  onWrote: () => Promise<void>
  bare?: boolean
}

/**
 * Flavour Notes — controlled vocabulary + optional tasting note per value.
 * Shoppers filter on the descriptor; the brand note is voice, not a filter key.
 */
export function FlavorNotesPanel({
  row,
  productId,
  canEdit,
  busyKey,
  setBusyKey,
  setError,
  onWrote,
  bare = false,
}: Props) {
  const flavor = useFlavorNotes({ row, productId, canEdit, busyKey, setBusyKey, setError, onWrote })
  const { available } = flavor

  const body = (
    <>
      <p className="pf-notes__lede">
        Pick descriptors shoppers can filter on. Add your own words for how it tastes —
        that note stays with the brand, not the filter.
      </p>

      <NotesList row={row} {...flavor} />

      <NotesAdd {...flavor} />
    </>
  )

  if (bare) return <div className="pf-claim pf-claim--bare pf-notes">{body}</div>

  return (
    <article className="pf-claim pf-notes">
      <div className="pf-claim__head">
        <div className="pf-claim__title-row">
          <h4 className="pf-claim__title">{row.display_name}</h4>
        </div>
        <span className="pf-claim__badge pf-claim__badge--soft">
          {available.length} descriptors
        </span>
      </div>
      {body}
    </article>
  )
}
