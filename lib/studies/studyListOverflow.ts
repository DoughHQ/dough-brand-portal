import type { OperatorStudyLifecycleState, OperatorStudyRow } from '@/lib/studies/types'

export type StudyOverflowArgs = {
  canOperate: boolean
  canEndStudies: boolean
  busyId: string | null
  pending: boolean
  onEnd: (row: OperatorStudyRow) => void
  onWithdraw: (row: OperatorStudyRow) => void
}

function isRunningLifecycle(state: OperatorStudyLifecycleState): boolean {
  return state === 'active' || state === 'paused' || state === 'scheduled'
}

export function rowOverflow(row: OperatorStudyRow, args: StudyOverflowArgs) {
  const running = isRunningLifecycle(row.lifecycle_state)
  const busy = args.busyId === row.mission_id || args.pending
  const actions: { label: string; disabled: boolean; onClick: () => void }[] = []
  if (args.canEndStudies && running) {
    actions.push({ label: 'End study', disabled: busy, onClick: () => args.onEnd(row) })
  }
  if (args.canOperate) {
    actions.push({ label: 'Withdraw', disabled: busy, onClick: () => args.onWithdraw(row) })
  }
  return actions
}

export function showRowOverflow(
  args: Pick<StudyOverflowArgs, 'canOperate' | 'canEndStudies'>,
  row: OperatorStudyRow
): boolean {
  return (
    rowOverflow(row, {
      canOperate: args.canOperate,
      canEndStudies: args.canEndStudies,
      busyId: null,
      pending: false,
      onEnd: () => {},
      onWithdraw: () => {},
    }).length > 0
  )
}
