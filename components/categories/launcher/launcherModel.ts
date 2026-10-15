import { type CategoryLauncherRow } from '@/lib/categoryLauncher'

export const SEARCH_DEBOUNCE_MS = 280

export function n(value: number): string {
  return Math.max(0, Math.trunc(value)).toLocaleString()
}

export function uniqueL1Count(rows: CategoryLauncherRow[]): number {
  const names = new Set<string>()
  for (const row of rows) {
    if (row.l1_name) names.add(row.l1_name)
  }
  return names.size
}

export function competeStatus(row: CategoryLauncherRow): 'live' | 'building' | 'empty' {
  if (row.entitled) return 'live'
  if (row.total_battles > 0) return 'building'
  return 'empty'
}
