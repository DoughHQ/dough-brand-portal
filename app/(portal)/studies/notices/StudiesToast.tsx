import type { CSSProperties } from 'react'
import type { OperatorStudyRow } from '@/lib/studies/types'

const ghostBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  padding: '4px 0',
  color: 'var(--ink-50)',
}

export type ToastState =
  | { kind: 'plain'; message: string }
  | {
      kind: 'withdraw_undo'
      message: string
      missionId: string
      studySnapshot: OperatorStudyRow
    }

type Props = {
  toast: ToastState
  busyId: string | null
  pending: boolean
  onUndo: () => void
}

export default function StudiesToast({ toast, busyId, pending, onUndo }: Props) {
  return (
    <div
      role="status"
      style={{
        marginBottom: 20,
        fontSize: 13,
        color: 'var(--heading)',
        background: 'var(--sage-soft, var(--sage-pale))',
        border: '1px solid rgba(62, 107, 74, 0.2)',
        borderRadius: 'var(--r-md, 8px)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <span>{toast.message}</span>
      {toast.kind === 'withdraw_undo' ? (
        <button
          type="button"
          disabled={busyId === toast.missionId || pending}
          onClick={() => void onUndo()}
          style={{
            ...ghostBtn,
            color: 'var(--sage)',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          Undo
        </button>
      ) : null}
    </div>
  )
}
