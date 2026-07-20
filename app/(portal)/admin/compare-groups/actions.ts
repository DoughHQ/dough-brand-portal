'use server'

import { revalidatePath } from 'next/cache'
import {
  checkCompareGroupSimilarity,
  createCompareGroup,
  getCompareGroupDetail,
  getCompareGroupMetrics,
  setCompareGroupMembers,
  updateCompareGroupFields,
} from '@/lib/compareGroups'
import type {
  ActionResult,
  CompareGroupDetail,
  CompareGroupMetrics,
  CreateCompareGroupInput,
  SimilarityResult,
  UpdateCompareGroupPatch,
} from '@/lib/compareGroups.shared'
import {
  listTaxonomyL2Parents,
  listTaxonomyL3Children,
  resolveTaxonomyL2Labels,
  searchTaxonomyNodes,
  type TaxonomyL2Label,
  type TaxonomyL2Parent,
  type TaxonomyL3Child,
  type TaxonomySearchHit,
} from '@/lib/taxonomy'

function fail(e: unknown): { ok: false; error: string } {
  const message = e instanceof Error ? e.message : 'Request failed'
  return { ok: false, error: message }
}

function revalidateGroup(id?: number) {
  revalidatePath('/admin/compare-groups')
  if (id != null) revalidatePath(`/admin/compare-groups/${id}`)
}

export async function getCompareGroupDetailAction(
  id: number
): Promise<ActionResult<CompareGroupDetail>> {
  try {
    const data = await getCompareGroupDetail(id)
    return { ok: true, data }
  } catch (e) {
    return fail(e)
  }
}

export async function getCompareGroupMetricsAction(
  id: number
): Promise<ActionResult<CompareGroupMetrics>> {
  try {
    const data = await getCompareGroupMetrics(id)
    return { ok: true, data }
  } catch (e) {
    return fail(e)
  }
}

export async function checkSimilarityAction(
  nodeIds: number[],
  question: string | null,
  excludeId: number | null
): Promise<ActionResult<SimilarityResult>> {
  try {
    const data = await checkCompareGroupSimilarity(nodeIds, question, excludeId)
    return { ok: true, data }
  } catch (e) {
    return fail(e)
  }
}

export async function createCompareGroupAction(
  input: CreateCompareGroupInput
): Promise<ActionResult<CompareGroupDetail>> {
  try {
    const data = await createCompareGroup(input)
    const id = data.group?.compare_group_id
    revalidateGroup(typeof id === 'number' ? id : undefined)
    return { ok: true, data }
  } catch (e) {
    return fail(e)
  }
}

export async function updateFieldsAction(
  id: number,
  patch: UpdateCompareGroupPatch
): Promise<ActionResult<CompareGroupDetail>> {
  try {
    const data = await updateCompareGroupFields(id, patch)
    revalidateGroup(id)
    return { ok: true, data }
  } catch (e) {
    return fail(e)
  }
}

export async function setMembersAction(
  id: number,
  nodeIds: number[],
  note?: string | null
): Promise<ActionResult<CompareGroupDetail>> {
  try {
    const data = await setCompareGroupMembers(id, nodeIds, note)
    revalidateGroup(id)
    return { ok: true, data }
  } catch (e) {
    return fail(e)
  }
}

export async function searchTaxonomyForPickerAction(
  query: string
): Promise<TaxonomySearchHit[]> {
  return searchTaxonomyNodes(query, 25)
}

export async function listL2ParentsAction(): Promise<TaxonomyL2Parent[]> {
  try {
    return await listTaxonomyL2Parents()
  } catch {
    return []
  }
}

export async function listL3ChildrenAction(l2Id: number): Promise<TaxonomyL3Child[]> {
  try {
    return await listTaxonomyL3Children(l2Id)
  } catch {
    return []
  }
}

export async function resolveL2LabelsAction(
  nodeIds: number[]
): Promise<TaxonomyL2Label[]> {
  try {
    return await resolveTaxonomyL2Labels(nodeIds)
  } catch {
    return []
  }
}
