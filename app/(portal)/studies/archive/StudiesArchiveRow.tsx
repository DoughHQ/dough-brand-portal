import type { WithdrawnStudyRow } from '@/lib/studies/types'
import RowOverflowMenu from '../components/RowOverflowMenu'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(0, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type Props = {
  row: WithdrawnStudyRow
  showBrand: boolean
  busy: boolean
  onRestore: (missionId: string) => void
  onDelete: (row: WithdrawnStudyRow) => void
}

export default function StudiesArchiveRow({ row, showBrand, busy, onRestore, onDelete }: Props) {
  const canHardDelete = row.total_claims === 0
  const meta = [
    row.focal_product_name ?? 'No product',
    showBrand && row.brand_name ? row.brand_name : null,
    relativeTime(row.deleted_at),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="studies-archive-row">
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="studies-archive-name">{row.title}</div>
        <div className="studies-archive-meta">
          <span className="studies-withdrawn-badge">Withdrawn</span>
          {meta}
        </div>
      </div>
      <div className="studies-archive-actions">
        <button
          type="button"
          className="studies-archive-restore"
          disabled={busy}
          onClick={() => onRestore(row.mission_id)}
        >
          Restore
        </button>
        {canHardDelete ? (
          <RowOverflowMenu
            actions={[
              {
                label: 'Delete forever',
                tone: 'danger',
                disabled: busy,
                onClick: () => onDelete(row),
              },
            ]}
          />
        ) : null}
      </div>
    </div>
  )
}
