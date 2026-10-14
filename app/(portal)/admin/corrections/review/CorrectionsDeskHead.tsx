import Link from 'next/link'
import { correctionsDeskHref } from '@/lib/correctionsDesk'

export function CorrectionsDeskHead({
  filtered,
  focusId,
  queueLabel,
}: {
  filtered: boolean
  focusId: string | undefined
  queueLabel: string
}) {
  return (
    <div className="corr-head">
      <div>
        <div className="corr-kicker">Ops</div>
        <h1 className="corr-title">Corrections</h1>
      </div>
      <div className="corr-meta">
        {filtered ? (
          <span className="corr-filter">
            Filtered to this product
            <Link href={correctionsDeskHref({ focusId })}>Clear</Link>
          </span>
        ) : (
          <span>{queueLabel}</span>
        )}
      </div>
    </div>
  )
}
