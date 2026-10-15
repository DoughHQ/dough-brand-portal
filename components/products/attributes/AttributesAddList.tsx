import type { ReactNode } from 'react'
import type { DeclarableFacetRow } from '@/lib/facets/productFacets'
import { FacetChevronGlyph, FacetGlyph } from '@/components/products/facetGlyphs'
import type { ProductAttributesState } from './useProductAttributes'

export function AttributesAddList({
  empty,
  openAdd,
  setOpenAdd,
  renderClaim,
}: Pick<ProductAttributesState, 'empty' | 'openAdd' | 'setOpenAdd'> & {
  renderClaim: (row: DeclarableFacetRow, bare?: boolean) => ReactNode
}) {
  return (
    <section className="pf-room">
      <header className="pf-room__head">
        <h3 className="pf-room__title">You can add</h3>
        <p className="pf-room__lede">
          Only what applies — start with Flavour Notes, then the rest.
        </p>
      </header>
      <div className="pf-add-list">
        {empty.map((row) => {
          const open = openAdd === row.facet_type
          const isFlavor = row.facet_type === 'flavor_note'
          return (
            <div
              key={row.facet_type}
              className={`pf-add-row${open ? ' pf-add-row--open' : ''}${isFlavor ? ' pf-add-row--featured' : ''}`}
            >
              <button
                type="button"
                className="pf-add-row__hit"
                aria-expanded={open}
                onClick={() => setOpenAdd(open ? null : row.facet_type)}
              >
                <span className="pf-add-row__lead">
                  <span className="pf-add-row__icon" aria-hidden>
                    <FacetGlyph type={row.facet_type} size={18} />
                  </span>
                  <span className="pf-add-row__name">{row.display_name}</span>
                  {isFlavor ? (
                    <span className="pf-add-row__feature">Tasting</span>
                  ) : null}
                </span>
                <span className="pf-add-row__meta">
                  {row.requires_evidence ? (
                    <span className="pf-add-row__evidence">Needs evidence</span>
                  ) : isFlavor ? (
                    <span className="pf-add-row__optional">
                      {(row.available_values ?? []).length} options
                    </span>
                  ) : (
                    <span className="pf-add-row__optional">Optional</span>
                  )}
                  <span
                    className={`pf-add-row__chev${open ? ' pf-add-row__chev--open' : ''}`}
                    aria-hidden
                  >
                    <FacetChevronGlyph size={16} />
                  </span>
                </span>
              </button>
              {open ? (
                <div className="pf-add-row__body">{renderClaim(row, true)}</div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
