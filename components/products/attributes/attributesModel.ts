import { filterDerivedValues, type DeclarableFacetRow } from '@/lib/facets/productFacets'
import { PRODUCT_NAME } from '@/lib/brand'

export const FACETS_LEDE =
  `We derive what we can from labels and ingredients. Add what only you know — it helps shoppers find your product. Allergens and ingredients are derived by ${PRODUCT_NAME} and can't be edited here.`

export function sectionHasContent(row: DeclarableFacetRow): boolean {
  const derived = filterDerivedValues(row.facet_type, row.derived_values)
  const declared = row.declared_values ?? []
  return derived.length > 0 || declared.length > 0
}

/** Flavour Notes first; evidence-heavy types later. */
export function sortOpenAttributes(a: DeclarableFacetRow, b: DeclarableFacetRow): number {
  if (a.facet_type === 'flavor_note') return -1
  if (b.facet_type === 'flavor_note') return 1
  if (a.requires_evidence !== b.requires_evidence) {
    return a.requires_evidence ? 1 : -1
  }
  return a.display_name.localeCompare(b.display_name)
}

export type EditorProps = {
  productId: number
  canEdit?: boolean
  onChanged?: () => void
}
