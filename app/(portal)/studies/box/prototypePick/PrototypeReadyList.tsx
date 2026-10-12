import Link from 'next/link'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import PrototypeThumb from './PrototypeThumb'

export default function PrototypeReadyList({
  ready,
  taken,
  pickingId,
  onPick,
}: {
  ready: PrototypeListItem[]
  taken: Set<string>
  pickingId: string | null
  onPick: (item: PrototypeListItem) => void
}) {
  return (
    <>
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {ready.map((item) => {
        const isTaken = taken.has(item.id)
        const busy = pickingId === item.id
        return (
          <li key={item.id}>
            <button
              type="button"
              disabled={isTaken || busy}
              onClick={() => void onPick(item)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
                border: '1px solid var(--ink-10)',
                borderRadius: 10,
                padding: '10px 12px',
                background: isTaken ? 'var(--surface-1)' : 'var(--paper)',
                cursor: isTaken ? 'not-allowed' : 'pointer',
                opacity: isTaken ? 0.55 : 1,
              }}
            >
              <PrototypeThumb path={item.image_paths[0] ?? null} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--ink-80)',
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--ink-50)',
                    marginTop: 2,
                  }}
                >
                  {item.category_label ?? 'Uncategorized'}
                  {item.packaging === 'plain_sample' ? ' · Plain sample' : ' · Final packaging'}
                  {isTaken ? ' · Already in this box' : ''}
                  {busy ? ' · Adding…' : ''}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
    <p className="cb-field-note" style={{ margin: '10px 0 0' }}>
      Need a new sample?{' '}
      <Link href="/prototypes" className="cb-quiet-action">
        Manage library
      </Link>
    </p>
    </>
  )
}
