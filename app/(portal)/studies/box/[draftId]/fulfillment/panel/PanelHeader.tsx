import type { BrandFulfillmentRow } from '@/lib/box/brandFulfillment'
import { downloadCsv } from './downloadCsv'
import { cardLabel, miniBtn } from './panelStyles'

export function PanelHeader({
  boxId,
  rows,
  pending,
}: {
  boxId: string
  rows: BrandFulfillmentRow[]
  pending: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 4,
      }}
    >
      <div style={{ ...cardLabel, marginBottom: 0 }}>
        Packing · {rows.length} seat{rows.length === 1 ? '' : 's'}
      </div>
      {rows.length > 0 ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => downloadCsv(rows, boxId)}
          style={{
            ...miniBtn(false),
            background: 'var(--paper)',
            color: 'var(--ink)',
            border: '1px solid var(--ink-10)',
          }}
        >
          Download CSV
        </button>
      ) : null}
    </div>
  )
}
