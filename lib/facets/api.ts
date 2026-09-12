import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import {
  messageFromFacetError,
  normalizeDeclaredValues,
  normalizeDerivedValues,
  type DeclarableFacetRow,
  type FacetAvailableValue,
  type FacetSummaryRow,
} from '@/lib/facets/productFacets'

type Client = SupabaseClient<Database>

const SUMMARY_CHUNK = 500

function normalizeDeclarableRow(raw: Record<string, unknown>): DeclarableFacetRow {
  const available = Array.isArray(raw.available_values)
    ? (raw.available_values as FacetAvailableValue[])
    : null
  return {
    facet_type: String(raw.facet_type ?? ''),
    display_name: String(raw.display_name ?? raw.facet_type ?? ''),
    cardinality: String(raw.cardinality ?? 'single'),
    polarity: String(raw.polarity ?? 'neutral'),
    assignability: String(raw.assignability ?? ''),
    editable: raw.editable !== false,
    requires_evidence: Boolean(raw.requires_evidence),
    available_values: available,
    derived_values: normalizeDerivedValues(raw.derived_values),
    declared_values: Array.isArray(raw.declared_values)
      ? normalizeDeclaredValues(raw.declared_values)
      : null,
  }
}

/** One batch call per chunk — never N+1 from card components. */
export async function fetchProductFacetSummaries(
  supabase: Client,
  productIds: number[],
): Promise<{ rows: FacetSummaryRow[]; error: string | null }> {
  const ids = [...new Set(productIds.filter((id) => Number.isFinite(id) && id > 0))]
  if (ids.length === 0) return { rows: [], error: null }

  const out: FacetSummaryRow[] = []
  for (let i = 0; i < ids.length; i += SUMMARY_CHUNK) {
    const chunk = ids.slice(i, i + SUMMARY_CHUNK)
    const { data, error } = await supabase.rpc('get_product_facet_summary', {
      p_product_ids: chunk,
    })
    if (error) {
      if ((error.hint || error.message || '').includes('BATCH_TOO_LARGE') && chunk.length > 1) {
        const mid = Math.ceil(chunk.length / 2)
        const left = await fetchProductFacetSummaries(supabase, chunk.slice(0, mid))
        if (left.error) return left
        const right = await fetchProductFacetSummaries(supabase, chunk.slice(mid))
        if (right.error) return right
        out.push(...left.rows, ...right.rows)
        continue
      }
      return { rows: out, error: messageFromFacetError(error) }
    }
    for (const row of (data ?? []) as FacetSummaryRow[]) {
      out.push(row)
    }
  }
  return { rows: out, error: null }
}

export async function fetchDeclarableFacets(
  supabase: Client,
  productId: number,
): Promise<{ rows: DeclarableFacetRow[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_declarable_facets_for_product', {
    p_product_id: productId,
  })
  if (error) return { rows: [], error: messageFromFacetError(error) }
  const rows = ((data ?? []) as Record<string, unknown>[]).map(normalizeDeclarableRow)
  return { rows, error: null }
}

export async function declareProductFacet(
  supabase: Client,
  args: {
    productId: number
    facetType: string
    facetValue: string
    evidenceUrl?: string | null
    evidenceNote?: string | null
  },
): Promise<{ declarationId: number | null; error: string | null }> {
  const { data, error } = await supabase.rpc('declare_product_facet', {
    p_product_id: args.productId,
    p_facet_type: args.facetType,
    p_facet_value: args.facetValue,
    p_evidence_url: args.evidenceUrl ?? undefined,
    p_evidence_note: args.evidenceNote ?? undefined,
  })
  if (error) return { declarationId: null, error: messageFromFacetError(error) }
  const id = typeof data === 'number' ? data : Number(data)
  return { declarationId: Number.isFinite(id) ? id : null, error: null }
}

export async function withdrawProductFacetDeclaration(
  supabase: Client,
  declarationId: number,
  supersede = false,
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.rpc('withdraw_product_facet_declaration', {
    p_declaration_id: declarationId,
    p_supersede: supersede,
  })
  if (error) return { ok: false, error: messageFromFacetError(error) }
  return { ok: true, error: null }
}
