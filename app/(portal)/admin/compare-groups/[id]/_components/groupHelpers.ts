import type { CompareGroupDetail } from '@/lib/compareGroups.shared'

export function groupName(group: CompareGroupDetail['group']): string {
  const raw = group.compare_group_name_display ?? group.name
  return typeof raw === 'string' && raw.trim() ? raw : 'Untitled'
}

export function groupCode(group: CompareGroupDetail['group']): string | null {
  const raw = group.compare_group_code ?? group.code
  return typeof raw === 'string' && raw.trim() ? raw : null
}

export function groupStrategy(group: CompareGroupDetail['group']): string | null {
  const raw = group.group_strategy ?? group.strategy
  return typeof raw === 'string' && raw.trim() ? raw : null
}

export function groupQuestion(group: CompareGroupDetail['group']): string | null {
  const raw = group.consumer_question
  return typeof raw === 'string' && raw.trim() ? raw : null
}

export function groupDescription(group: CompareGroupDetail['group']): string | null {
  const raw = group.compare_group_description ?? group.description
  return typeof raw === 'string' ? raw : null
}

export function groupType(group: CompareGroupDetail['group']): string {
  const raw = group.compare_group_type ?? group.type
  return typeof raw === 'string' && raw.trim() ? raw : 'primary'
}

export function groupBattleLevel(group: CompareGroupDetail['group']): number {
  const raw = group.battle_level
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 1
}

export function groupStatus(group: CompareGroupDetail['group']): string {
  const raw = group.status
  return typeof raw === 'string' && raw.trim() ? raw : 'active'
}

export function groupVersion(group: CompareGroupDetail['group']): number | null {
  const raw = group.version
  return typeof raw === 'number' ? raw : null
}

export function sageTint(winRate: number | null | undefined, alpha = 1): string {
  if (winRate == null || !Number.isFinite(winRate)) {
    return 'rgba(62,107,74,0.08)'
  }
  const t = Math.max(0, Math.min(1, winRate))
  const min = 0.1
  const max = 0.55
  const a = min + (max - min) * t
  return `rgba(62,107,74,${a * alpha})`
}

export function fmtPct(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return '—'
  return `${Math.round(rate * 1000) / 10}%`
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 14) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtJsonValue(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'string') return v || '—'
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(fmtJsonValue).join(', ')
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}
