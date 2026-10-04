'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { parseBrandPrototype, sanitizeAllergenList } from '@/lib/prototypes/parse'
import { prototypeReadiness } from '@/lib/prototypes/readiness'
import { humanizePrototypeError } from '@/lib/prototypes/errors'
import type {
  BrandPrototypeRow,
  PrototypeAllergenInput,
  PrototypeListItem,
  PrototypePackaging,
  PrototypeSaveInput,
} from '@/lib/prototypes/types'

type ActionOk<T> = { ok: true; data: T }
type ActionErr = { ok: false; error: string }
type ActionResult<T> = ActionOk<T> | ActionErr

async function requireBrandScope(): Promise<
  | { ok: true; brandId: number; supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> }
  | ActionErr
> {
  const scope = await getPortalBrandScope()
  if (!scope) return { ok: false, error: 'Sign in to manage prototypes.' }
  if (scope.portalUser.role === 'dough_admin' && !scope.isImpersonating) {
    return { ok: false, error: 'Impersonate a brand to manage its prototypes.' }
  }
  if (scope.effectiveBrandId == null) {
    return { ok: false, error: 'No brand selected.' }
  }
  const supabase = await createServerSupabaseClient()
  return { ok: true, brandId: scope.effectiveBrandId, supabase }
}

async function categoryLabels(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  nodeIds: number[]
): Promise<Map<number, string>> {
  const unique = [...new Set(nodeIds.filter((n) => Number.isFinite(n)))]
  const map = new Map<number, string>()
  if (unique.length === 0) return map
  const { data } = await supabase
    .from('taxonomy_nodes')
    .select('taxonomy_node_id, node_name_display')
    .in('taxonomy_node_id', unique)
  for (const row of data ?? []) {
    if (row.taxonomy_node_id != null && typeof row.node_name_display === 'string') {
      map.set(row.taxonomy_node_id, row.node_name_display)
    }
  }
  return map
}

function toListItem(row: BrandPrototypeRow, labels: Map<number, string>): PrototypeListItem {
  return {
    ...row,
    readiness: prototypeReadiness(row),
    category_label: labels.get(row.taxonomy_node_id) ?? null,
  }
}

export async function listBrandPrototypesAction(opts?: {
  includeArchived?: boolean
}): Promise<ActionResult<PrototypeListItem[]>> {
  const scope = await requireBrandScope()
  if (!scope.ok) return scope
  const { brandId, supabase } = scope

  let query = supabase
    .from('brand_prototypes')
    .select('*')
    .eq('brand_id', brandId)
    .order('updated_at', { ascending: false })

  if (!opts?.includeArchived) {
    query = query.is('archived_at', null)
  }

  const { data, error } = await query
  if (error) {
    return { ok: false, error: humanizePrototypeError(error) }
  }

  const rows = (data ?? [])
    .map(parseBrandPrototype)
    .filter((r): r is BrandPrototypeRow => r != null)
  const labels = await categoryLabels(
    supabase,
    rows.map((r) => r.taxonomy_node_id)
  )
  return { ok: true, data: rows.map((r) => toListItem(r, labels)) }
}

export async function saveBrandPrototypeAction(
  input: PrototypeSaveInput
): Promise<ActionResult<PrototypeListItem>> {
  const scope = await requireBrandScope()
  if (!scope.ok) return scope
  const { brandId, supabase } = scope

  if (input.brandId !== brandId) {
    return { ok: false, error: 'That prototype belongs to another brand.' }
  }
  const name = input.name.trim()
  if (!name) return { ok: false, error: 'Name the prototype.' }
  if (!Number.isFinite(input.taxonomyNodeId)) {
    return { ok: false, error: 'Pick a category.' }
  }
  const packaging: PrototypePackaging =
    input.packaging === 'final_packaging' ? 'final_packaging' : 'plain_sample'
  const price =
    input.plannedPrice != null && Number.isFinite(input.plannedPrice) && input.plannedPrice > 0
      ? input.plannedPrice
      : null

  const { data, error } = await supabase.rpc('save_brand_prototype', {
    p_prototype_id: input.prototypeId,
    p_brand_id: brandId,
    p_name: name,
    p_taxonomy_node_id: input.taxonomyNodeId,
    p_packaging: packaging,
    p_internal_label: input.internalLabel?.trim() || null,
    p_planned_price: price,
    p_image_paths: input.imagePaths.slice(0, 6),
  })

  if (error) return { ok: false, error: humanizePrototypeError(error) }
  const row = parseBrandPrototype(data)
  if (!row) return { ok: false, error: 'Saved, but the response was empty. Refresh and retry.' }
  const labels = await categoryLabels(supabase, [row.taxonomy_node_id])
  return { ok: true, data: toListItem(row, labels) }
}

export async function declarePrototypeAllergensAction(
  input: PrototypeAllergenInput
): Promise<ActionResult<PrototypeListItem>> {
  const scope = await requireBrandScope()
  if (!scope.ok) return scope
  const { brandId, supabase } = scope

  const contains = sanitizeAllergenList(input.contains)
  const mayContain = sanitizeAllergenList(input.mayContain).filter((c) => !contains.includes(c))

  const { error } = await supabase.rpc('declare_prototype_allergens', {
    p_prototype_id: input.prototypeId,
    p_contains: contains,
    p_may_contain: mayContain,
  })
  if (error) return { ok: false, error: humanizePrototypeError(error) }

  const { data, error: fetchError } = await supabase
    .from('brand_prototypes')
    .select('*')
    .eq('id', input.prototypeId)
    .eq('brand_id', brandId)
    .maybeSingle()
  if (fetchError) return { ok: false, error: humanizePrototypeError(fetchError) }
  const row = parseBrandPrototype(data)
  if (!row) return { ok: false, error: 'Declaration saved. Refresh to see it.' }
  const labels = await categoryLabels(supabase, [row.taxonomy_node_id])
  return { ok: true, data: toListItem(row, labels) }
}

export async function archiveBrandPrototypeAction(
  prototypeId: string
): Promise<ActionResult<{ prototypeId: string }>> {
  const scope = await requireBrandScope()
  if (!scope.ok) return scope
  const { supabase } = scope

  const { error } = await supabase.rpc('archive_brand_prototype', {
    p_prototype_id: prototypeId,
  })
  if (error) return { ok: false, error: humanizePrototypeError(error) }
  return { ok: true, data: { prototypeId } }
}
