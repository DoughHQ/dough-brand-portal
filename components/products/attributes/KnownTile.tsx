import {
  facetValueLabel,
  filterDerivedValues,
  provenanceLabelFromSource,
  type DeclarableFacetRow,
  type FacetDerivedValue,
} from '@/lib/facets/productFacets'
import { FacetGlyph } from '@/components/products/facetGlyphs'

export function KnownTile({ row }: { row: DeclarableFacetRow }) {
  const derived = filterDerivedValues(row.facet_type, row.derived_values)
  return (
    <article className="pf-known">
      <div className="pf-known__head">
        <span className="pf-known__icon" aria-hidden>
          <FacetGlyph type={row.facet_type} size={16} />
        </span>
        <p className="pf-known__attr">{row.display_name}</p>
      </div>
      <ul className="pf-known__values">
        {derived.map((d: FacetDerivedValue) => (
          <li key={d.value}>
            <span className="pf-known__value">{facetValueLabel(row, d.value, d.label)}</span>
            <span className="pf-known__whisper">{provenanceLabelFromSource(d.source)}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
