import type { RowPresence } from './proofChapters'

const PRESENCE_LABELS = {
  published: 'Published',
  private: 'Private',
  declined: 'Not reporting',
  not_started: '—',
} as const satisfies Record<RowPresence, string>

const PRESENCE_MODIFIERS = {
  published: 'public',
  private: 'private',
  declined: 'declined',
  not_started: 'idle',
} as const satisfies Record<RowPresence, string>

export function presenceLabel(presence: RowPresence): string {
  return PRESENCE_LABELS[presence]
}

export function presencePillClass(presence: RowPresence): string {
  return `tx-pill tx-pill--${PRESENCE_MODIFIERS[presence]}`
}
