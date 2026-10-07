'use server'

import { listBrandProductsPage } from '@/lib/brandHome/fetchBrandProductsPage.server'
import { studyHref, type HomeStudyInput } from '@/lib/brandHome/selectHomeModel'
import type { CommandSearchItem } from '@/lib/portal-ui/commandSearch'
import { fetchOperatorStudiesPage } from '@/lib/studies/fetchOperatorStudies'
import { isConceptStudy } from '@/lib/checkout/status'
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

export async function searchPortalCommandAction(
  query: string,
): Promise<CommandSearchItem[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const needle = q.toLowerCase()
  const out: CommandSearchItem[] = []

  const [active, complete, products] = await Promise.all([
    fetchOperatorStudiesPage({ tab: 'active', limit: 25, includeDrafts: true }),
    fetchOperatorStudiesPage({ tab: 'complete', limit: 25 }),
    listBrandProductsPage({ limit: 20, search: q }),
  ])

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
