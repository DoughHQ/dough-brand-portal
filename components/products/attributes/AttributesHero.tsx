import { FacetInfoGlyph, FacetSearchGlyph } from '@/components/products/facetGlyphs'
import { PRODUCT_NAME } from '@/lib/brand'
import { FACETS_LEDE } from './attributesModel'
import type { ProductAttributesState } from './useProductAttributes'

export function AttributesHero({
  shopperItems,
}: Pick<ProductAttributesState, 'shopperItems'>) {
  return (
    <header className="pf-hero">
      <p className="pf-hero__kicker">Shopper discovery</p>
      <h2 className="pf-hero__title">Facets</h2>

      <div
        className={`pf-discovery${shopperItems.length === 0 ? ' pf-discovery--empty' : ''}`}
        role="region"
        aria-label="Shoppers can find this as"
        aria-live="polite"
      >
        <span className="pf-discovery__search" aria-hidden>
          <FacetSearchGlyph size={18} />
        </span>
        <div className="pf-discovery__body">
          <p className="pf-discovery__kicker">Shoppers can find this as</p>
          {shopperItems.length > 0 ? (
            <ul className="pf-discovery__chips">
              {shopperItems.map((item) => (
                <li key={`${item.facetType}:${item.value}`}>
                  <span className="pf-discovery__chip">{item.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pf-discovery__empty">
              Nothing shoppers can filter on yet — {PRODUCT_NAME} will fill what it can; you add the rest.
            </p>
          )}
        </div>
      </div>

      <details className="pf-hero__details">
        <summary>
          <span className="pf-hero__info" aria-hidden>
            <FacetInfoGlyph size={14} />
          </span>
          How this works
        </summary>
        <p>{FACETS_LEDE}</p>
      </details>
    </header>
  )
}
