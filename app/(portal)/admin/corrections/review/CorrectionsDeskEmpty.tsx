import Link from 'next/link'
import { correctionsDeskHref } from '@/lib/correctionsDesk'

export function CorrectionsDeskEmpty({
  loadingMore,
  filtered,
}: {
  loadingMore: boolean
  filtered: boolean
}) {
  return (
    <div className="corr-empty">
      {loadingMore ? (
        <p className="corr-empty-title">Loading next…</p>
      ) : filtered ? (
        <>
          <p className="corr-empty-title">Nothing pending on this product</p>
          <p className="corr-empty-body">
            The filter is on. Completing a case here does not jump into the global inbox.
          </p>
          <Link href={correctionsDeskHref()} className="corr-empty-link">
            Open the full queue
          </Link>
        </>
      ) : (
        <>
          <p className="corr-empty-title">Inbox zero</p>
          <p className="corr-empty-body">No corrections waiting for review.</p>
        </>
      )}
    </div>
  )
}
