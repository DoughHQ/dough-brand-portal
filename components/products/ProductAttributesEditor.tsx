'use client'

import { facetSupportsBrandNote, type DeclarableFacetRow } from '@/lib/facets/productFacets'
import { FlavorNotesPanel } from '@/components/products/FlavorNotesPanel'
import './productFacets.css'
import type { EditorProps } from './attributes/attributesModel'
import { AttributesAddList } from './attributes/AttributesAddList'
import { AttributesHero } from './attributes/AttributesHero'
import { ClaimCard } from './attributes/ClaimCard'
import { KnownTile } from './attributes/KnownTile'
import { useProductAttributes } from './attributes/useProductAttributes'

export { FACETS_LEDE } from './attributes/attributesModel'

/** Facets dossier — product detail tab only. */
export default function ProductAttributesEditor({
  productId,
  canEdit = true,
  onChanged,
}: EditorProps) {
  const {
    rows,
    loading,
    error,
    setError,
    busyKey,
    setBusyKey,
    openAdd,
    setOpenAdd,
    known,
    claims,
    empty,
    shopperItems,
    refreshAfterWrite,
    hasAny,
  } = useProductAttributes({ productId, onChanged })

  const renderClaim = (row: DeclarableFacetRow, bare = false) => {
    const shared = {
      row,
      productId,
      canEdit,
      busyKey,
      setBusyKey,
      setError,
      onWrote: refreshAfterWrite,
      bare,
    }
    if (facetSupportsBrandNote(row.facet_type)) {
      return <FlavorNotesPanel key={row.facet_type} {...shared} />
    }
    return <ClaimCard key={row.facet_type} {...shared} />
  }

  return (
    <div className="pf-dossier">
      <AttributesHero shopperItems={shopperItems} />

      {error ? <p className="pf-status__error">{error}</p> : null}
      {loading && !rows ? (
        <div className="pf-status__loading">Loading attributes…</div>
      ) : null}
      {!loading && rows && !hasAny ? (
        <div className="pf-status__empty">No attributes for this product yet.</div>
      ) : null}

      {known.length > 0 ? (
        <section className="pf-room pf-room--known">
          <div className="pf-known-grid">
            {known.map((row) => (
              <KnownTile key={row.facet_type} row={row} />
            ))}
          </div>
        </section>
      ) : null}

      {claims.length > 0 ? (
        <section className="pf-room">
          <div className="pf-claim-stack">{claims.map((row) => renderClaim(row))}</div>
        </section>
      ) : null}

      {empty.length > 0 ? (
        <AttributesAddList
          empty={empty}
          openAdd={openAdd}
          setOpenAdd={setOpenAdd}
          renderClaim={renderClaim}
        />
      ) : null}
    </div>
  )
}
