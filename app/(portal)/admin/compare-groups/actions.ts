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
import { isDoughAdminRequest } from '@/lib/portal/isDoughAdminRequest'

const NOT_AUTHORIZED = 'Not authorized.'

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
  if (!(await isDoughAdminRequest())) return { ok: false, error: NOT_AUTHORIZED }
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
  if (!(await isDoughAdminRequest())) return { ok: false, error: NOT_AUTHORIZED }
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
  if (!(await isDoughAdminRequest())) return { ok: false, error: NOT_AUTHORIZED }
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
  if (!(await isDoughAdminRequest())) return { ok: false, error: NOT_AUTHORIZED }
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
  if (!(await isDoughAdminRequest())) return { ok: false, error: NOT_AUTHORIZED }
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
  if (!(await isDoughAdminRequest())) return { ok: false, error: NOT_AUTHORIZED }
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
  if (!(await isDoughAdminRequest())) return []
  return searchTaxonomyNodes(query, 25)
}

export async function listL2ParentsAction(): Promise<TaxonomyL2Parent[]> {
  if (!(await isDoughAdminRequest())) return []
  try {
    return await listTaxonomyL2Parents()
  } catch {
    return []
  }
}

export async function listL3ChildrenAction(l2Id: number): Promise<TaxonomyL3Child[]> {
  if (!(await isDoughAdminRequest())) return []
  try {
    return await listTaxonomyL3Children(l2Id)
  } catch {
    return []
  }
}

export async function resolveL2LabelsAction(
  nodeIds: number[]
): Promise<TaxonomyL2Label[]> {
  if (!(await isDoughAdminRequest())) return []
  try {
    return await resolveTaxonomyL2Labels(nodeIds)
  } catch {
    return []
  }
}
