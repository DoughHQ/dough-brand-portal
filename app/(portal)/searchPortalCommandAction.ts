'use server'

import { listStudyDraftsAction } from '@/app/(portal)/studies/drafts/actions'
import { listBrandProductsPage } from '@/lib/brandHome/fetchBrandProductsPage.server'
import { studyHref, type HomeStudyInput } from '@/lib/brandHome/selectHomeModel'
import { competeCategoriesFromLauncher } from '@/lib/categoryLauncher'
import { fetchBrandCategoryLauncherServer } from '@/lib/categoryLauncher.server'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'
import type { CommandSearchItem } from '@/lib/portal-ui/commandSearch'
import { fetchOperatorStudiesPage } from '@/lib/studies/fetchOperatorStudies'
import { isConceptStudy } from '@/lib/checkout/status'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { operatorStudiesBrandId } from '@/lib/studies/operatorScope'
import type { OperatorStudyRow } from '@/lib/studies/types'

function studyToHomeInput(row: OperatorStudyRow): HomeStudyInput {
  return {
    mission_id: row.mission_id,
    title: row.title,
    lifecycle_state: row.lifecycle_state,
    test_type: row.test_type,
    mission_type: row.mission_type,
    completed_claims: row.completed_claims,
    total_claims: row.total_claims,
    target_completions: row.target_completions,
    order_status: row.order_status,
  }
}

function matchesQuery(hay: string, q: string): boolean {
  return hay.toLowerCase().includes(q)
}

function draftHrefPlaceholder(testType: string): string {
  return testType === 'concept' ? '/studies/concept/new' : '/studies/box/new'
}

async function draftItems(needle: string | null): Promise<CommandSearchItem[]> {
  const listed = await listStudyDraftsAction()
  if (!listed.ok) return []
  const out: CommandSearchItem[] = []
  for (const d of listed.drafts) {
    const title = (d.title?.trim() || 'Untitled draft').slice(0, 80)
    const kind = d.test_type === 'concept' ? 'Concept' : 'IHUT'
    if (needle && !matchesQuery(`${title} ${kind} draft`, needle)) continue
    out.push({
      id: `draft-${d.id}`,
      label: title,
      href: draftHrefPlaceholder(d.test_type),
      group: 'Drafts',
      keywords: `${kind} draft resume continue`,
      draftId: d.id,
    })
    if (out.length >= 8) break
  }
  return out
}

async function categoryItems(needle: string | null): Promise<CommandSearchItem[]> {
  try {
    const launcher = await fetchBrandCategoryLauncherServer(needle)
    const compete = competeCategoriesFromLauncher(launcher)
    const browse = launcher.browse ?? []
    const byId = new Map<number, (typeof compete)[number]>()
    for (const row of [...compete, ...browse]) {
      if (!byId.has(row.l2_id)) byId.set(row.l2_id, row)
    }
    const rows = [...byId.values()]
    const out: CommandSearchItem[] = []
    for (const row of rows) {
      const hay = `${row.l2_name} ${row.l1_name ?? ''}`
      if (needle && !matchesQuery(hay, needle)) continue
      out.push({
        id: `category-${row.l2_id}`,
        label: row.l2_name,
        href: brandCategoryOverviewHref(row.l2_id),
        group: 'Categories',
        keywords: `${row.l1_name ?? ''} category ${row.entitled ? 'entitled' : ''}`,
      })
      if (out.length >= 8) break
    }
    return out
  } catch {
    return []
  }
}

/**
 * Empty-query bootstrap for ⌘K: drafts + categories (recents are client-side).
 */
export async function bootstrapPortalCommandAction(): Promise<CommandSearchItem[]> {
  const scope = await getPortalBrandScope()
  if (!scope) return []

  const [drafts, categories] = await Promise.all([
    draftItems(null),
    categoryItems(null),
  ])
  return [...drafts.slice(0, 5), ...categories.slice(0, 6)]
}

export async function searchPortalCommandAction(
  query: string,
): Promise<CommandSearchItem[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const scope = await getPortalBrandScope()
  if (!scope) return []
  const brandId = operatorStudiesBrandId(scope)

  const needle = q.toLowerCase()
  const out: CommandSearchItem[] = []

  const [active, complete, products, drafts, categories] = await Promise.all([
    fetchOperatorStudiesPage({
      tab: 'active',
      limit: 25,
      includeDrafts: true,
      brandId,
    }),
    fetchOperatorStudiesPage({ tab: 'complete', limit: 25, brandId }),
    listBrandProductsPage({ limit: 20, search: q }),
    draftItems(needle),
    categoryItems(needle),
  ])

  out.push(...drafts)

  const studyRows: OperatorStudyRow[] = [
    ...(active.ok ? active.page.rows : []),
    ...(complete.ok ? complete.page.rows : []),
  ]

  const seenMissions = new Set<string>()
  for (const row of studyRows) {
    if (seenMissions.has(row.mission_id)) continue
    seenMissions.add(row.mission_id)
    const title = row.title || 'Untitled study'
    const brand = row.brand_name ?? ''
    const product = row.focal_product_name ?? ''
    if (!matchesQuery(`${title} ${brand} ${product}`, needle)) continue
    const { href } = studyHref(studyToHomeInput(row))
    const kind = isConceptStudy(row) ? 'Concept' : 'Study'
    out.push({
      id: `study-${row.mission_id}`,
      label: title,
      href,
      group: 'Studies',
      keywords: `${kind} ${brand} ${product} ${row.lifecycle_state}`,
    })
    if (out.filter((i) => i.group === 'Studies').length >= 8) break
  }

  for (const item of products?.items ?? []) {
    out.push({
      id: `product-${item.productId}`,
      label: item.name,
      href: `/products/${item.productId}`,
      group: 'Products',
      keywords: `${item.category ?? ''} ${item.l2Name ?? ''} ${item.l3Name ?? ''}`,
    })
  }

  out.push(...categories)

  // Completed studies with report destinations also surface under Reports when matching.
  for (const row of complete.ok ? complete.page.rows : []) {
    const title = row.title || 'Untitled study'
    if (!matchesQuery(title, needle)) continue
    if (
      row.lifecycle_state !== 'completed' &&
      row.lifecycle_state !== 'expired' &&
      row.lifecycle_state !== 'archived'
    ) {
      continue
    }
    const { href } = studyHref(studyToHomeInput(row))
    if (!href.includes('/report') && !href.startsWith('/reports/')) continue
    out.push({
      id: `report-${row.mission_id}`,
      label: `${title} · results`,
      href,
      group: 'Reports',
      keywords: `report results ${row.focal_product_name ?? ''}`,
    })
    if (out.filter((i) => i.group === 'Reports').length >= 6) break
  }

  return out
}
