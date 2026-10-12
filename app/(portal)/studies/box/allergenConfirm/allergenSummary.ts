import {
  ALLERGEN_LABELS,
  type AllergenCode,
} from '@/lib/box/allergens'

function labelList(codes: Iterable<string>): string {
  return [...codes]
    .map((c) => ALLERGEN_LABELS[c as AllergenCode] ?? c)
    .join(', ')
}

export function summaryLine(contains: Set<string>, mayContain: Set<string>): string {
  if (contains.size === 0 && mayContain.size === 0) return 'None declared'
  const parts: string[] = []
  if (contains.size > 0) parts.push(`Contains ${labelList(contains)}`)
  if (mayContain.size > 0) parts.push(`May contain ${labelList(mayContain)}`)
  return parts.join(' · ')
}
