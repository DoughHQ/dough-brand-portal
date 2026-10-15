import type { BoxTab } from '@/lib/box/operator'

export const TAB_KEYS: BoxTab[] = ['draft', 'live', 'closed']
export const TAB_LABELS: Record<BoxTab, string> = {
  draft: 'Draft',
  live: 'Live',
  closed: 'Closed',
}

export const GRID = 'minmax(220px, 2.4fr) 130px 130px 120px 110px'

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(0, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function parseTab(raw: string | null): BoxTab {
  if (raw === 'draft' || raw === 'live' || raw === 'closed') return raw
  return 'live'
}
