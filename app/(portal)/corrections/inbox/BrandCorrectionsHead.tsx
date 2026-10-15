import Link from 'next/link'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import { correctionsDeskHref } from '@/lib/correctionsDesk'

export function BrandCorrectionsHead({
  headerLabel,
  canReviewInOps,
  focused,
}: {
  headerLabel: string
  canReviewInOps: boolean
  focused: CorrectionReviewRow | null
}) {
  return (
    <div className="corr-head">
      <div>
        <div className="corr-kicker">Catalog</div>
        <h1 className="corr-title">Corrections</h1>
      </div>
      <div className="corr-meta">
        <span>{headerLabel}</span>
        {canReviewInOps && focused ? (
          <Link href={correctionsDeskHref({ focusId: focused.id })}>Review in Ops</Link>
        ) : null}
      </div>
    </div>
  )
}
