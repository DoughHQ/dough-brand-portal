import { type ReactNode } from 'react'
import type { OverviewBrief } from '@/lib/experiencedReport/overviewBrief'
import type { FieldBrief, PreferenceBrief } from '@/lib/experiencedReport/fieldBrief'
import { OverviewBottomLine } from './OverviewBottomLine'

/** @deprecated Prefer OverviewBottomLine — kept for IHUT thin/forming states. */
export function DecisionBriefHeader({
  overview,
  eyebrow,
  metadata,
}: {
  overview: OverviewBrief
  eyebrow: string
  metadata: string[]
  /** unused legacy props accepted for gradual migrate */
  productName?: string
  headline?: string
  lede?: string
  implication?: string
  preference?: PreferenceBrief
  field?: FieldBrief
  price?: OverviewBrief['price']
  children?: ReactNode
}) {
  return (
    <OverviewBottomLine
      overview={overview}
      eyebrow={eyebrow}
      metadata={metadata}
    />
  )
}
