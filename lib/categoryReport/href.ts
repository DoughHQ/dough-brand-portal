import type { CategoryMode, CategoryScope } from './types'

export type PreviewQuery = {
  scope?: CategoryScope | null
  id?: number | null
  focal?: number | null
  mode?: CategoryMode
}

export function previewDashboardHref(q: PreviewQuery): string {
  const params = new URLSearchParams()
  if (q.scope) params.set('scope', q.scope)
  if (q.id != null) params.set('id', String(q.id))
  params.set('mode', q.mode ?? 'admin')
  if (q.focal != null) params.set('focal', String(q.focal))
  const qs = params.toString()
  return qs ? `/admin/report-preview?${qs}` : '/admin/report-preview'
}

/** Admin instrument sheet. */
export function readinessPreviewHref(scope: 'l2' | 'l3', nodeId: number): string {
  return previewDashboardHref({ scope, id: nodeId, mode: 'admin' })
}

/** Brand Overview surface (same payload, destination layout). */
export function overviewPreviewHref(scope: 'l2' | 'l3', nodeId: number): string {
  return previewDashboardHref({ scope, id: nodeId, mode: 'brand' })
}

/** Live brand Category Overview destination. */
export function brandCategoryOverviewHref(
  l2NodeId: number,
  focal?: number | null
): string {
  const params = new URLSearchParams()
  if (focal != null) params.set('focal', String(focal))
  const qs = params.toString()
  return qs ? `/categories/${l2NodeId}?${qs}` : `/categories/${l2NodeId}`
}

export function brandCategoriesIndexHref(): string {
  return '/categories'
}
