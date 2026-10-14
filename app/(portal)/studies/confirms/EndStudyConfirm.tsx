import type { OperatorStudyRow } from '@/lib/studies/types'
import type { EndStudyResult } from '@/lib/studies/endStudy'
import EndStudyDialog from '../components/EndStudyDialog'

type Props = {
  row: OperatorStudyRow | null
  onCancel: () => void
  onError: (message: string) => void
  onFinished: (row: OperatorStudyRow, result: EndStudyResult) => void
}

export default function EndStudyConfirm({ row, onCancel, onError, onFinished }: Props) {
  return (
    <EndStudyDialog
      open={row != null}
      missionId={row?.mission_id ?? null}
      title={row?.title || 'Untitled study'}
      onCancel={onCancel}
      onError={onError}
      onFinished={(result) => {
        if (row != null) onFinished(row, result)
      }}
    />
  )
}
