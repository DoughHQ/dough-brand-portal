import type { BoxStudyDraft } from '@/lib/box/types'
import { isResolvedBoxSeat } from '@/lib/box/fieldSize'

export function priceReadinessLabel(draft: BoxStudyDraft): string | null {
  const seats = draft.fieldProducts.filter(isResolvedBoxSeat)
  if (seats.length < 2) return null
  if (seats.some((r) => r.packaging === 'plain_sample')) {
    return 'Taste-only box — price checks off'
  }
  const priced = seats.every(
    (r) => typeof r.price === 'number' && Number.isFinite(r.price) && r.price > 0
  )
  return priced
    ? 'All seats priced · price checks on'
    : 'Incomplete pricing · price checks off'
}
