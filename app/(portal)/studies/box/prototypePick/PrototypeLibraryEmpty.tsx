import Link from 'next/link'
import { readinessLabel } from '@/lib/prototypes/readiness'
import type { PrototypeListItem } from '@/lib/prototypes/types'

export default function PrototypeLibraryEmpty({
  notReady,
}: {
  notReady: PrototypeListItem[]
}) {
  return (
    <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.45 }}>
      <p style={{ margin: '0 0 8px' }}>
        No ready prototypes yet. A seatable sample needs a photo and a declared
        allergen list.
      </p>
      <Link href="/prototypes" className="cb-quiet-action">
        Open prototype library →
      </Link>
      {notReady.length > 0 ? (
        <p style={{ margin: '10px 0 0', fontSize: 12 }}>
          {notReady.length} in the library still{' '}
          {notReady.length === 1 ? 'needs' : 'need'} work (
          {readinessLabel(notReady[0].readiness).toLowerCase()}
          {notReady.length > 1 ? ', …' : ''}).
        </p>
      ) : null}
    </div>
  )
}
