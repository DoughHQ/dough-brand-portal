import type { WithdrawnStudyRow } from '@/lib/studies/types'
import ConfirmDialog from '../ConfirmDialog'

type Props = {
  row: WithdrawnStudyRow | null
  busy: boolean
  onCancel: () => void
  onConfirm: (row: WithdrawnStudyRow) => void
}

export default function DeleteStudyConfirm({ row, busy, onCancel, onConfirm }: Props) {
  return (
    <ConfirmDialog
      open={row != null}
      title="Delete forever?"
      body={
        row != null ? (
          <>
            Permanently delete “{row.title}”? This can&apos;t be undone.
          </>
        ) : null
      }
      confirmLabel="Delete forever"
      tone="destructive"
      busy={busy}
      onCancel={onCancel}
      onConfirm={() => {
        if (row != null) void onConfirm(row)
      }}
    />
  )
}
