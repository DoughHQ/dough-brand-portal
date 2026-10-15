import { PRODUCT_NAME } from '@/lib/brand'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import { reduceDeskQueue, type DeskQueue, type DeskQueueAction } from '@/lib/correctionsDesk'

export type QueueState = DeskQueue<CorrectionReviewRow>
export type QueueAction = DeskQueueAction<CorrectionReviewRow>

export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  return reduceDeskQueue(state, action)
}

export function waitingLabel(count: number, hasMore: boolean, inView: number): string {
  if (count <= 0 && inView === 0) return 'Nothing waiting'
  if (count === 1) return `1 waiting on ${PRODUCT_NAME}`
  if (count > 0) return `${count} waiting on ${PRODUCT_NAME}`
  return `${inView} in view${hasMore ? ' · more' : ''}`
}
