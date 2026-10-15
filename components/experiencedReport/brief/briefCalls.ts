import type { HeadToHeadRow, PreferenceBrief } from '@/lib/experiencedReport/fieldBrief'
import styles from '../decisionBrief.module.css'

export function callClass(call: PreferenceBrief['call']): string {
  switch (call) {
    case 'ahead':
      return styles.callAhead
    case 'behind':
      return styles.callBehind
    case 'too_close':
      return styles.callClose
    default:
      return styles.callForming
  }
}

export function h2hCallClass(call: HeadToHeadRow['call']): string {
  switch (call) {
    case 'win':
      return styles.h2hWin
    case 'loss':
      return styles.h2hLoss
    default:
      return styles.h2hClose
  }
}
