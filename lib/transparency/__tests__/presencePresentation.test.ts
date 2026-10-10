import { describe, expect, it } from 'vitest'
import type { RowPresence } from '../proofChapters'
import { presenceLabel, presencePillClass } from '../presencePresentation'

const cases: Array<{
  presence: RowPresence
  label: string
  className: string
}> = [
  {
    presence: 'published',
    label: 'Published',
    className: 'tx-pill tx-pill--public',
  },
  {
    presence: 'private',
    label: 'Private',
    className: 'tx-pill tx-pill--private',
  },
  {
    presence: 'declined',
    label: 'Not reporting',
    className: 'tx-pill tx-pill--declined',
  },
  {
    presence: 'not_started',
    label: '—',
    className: 'tx-pill tx-pill--idle',
  },
]

describe('transparency presence presentation', () => {
  it.each(cases)('maps $presence to stable copy and styling', ({ presence, label, className }) => {
    expect(presenceLabel(presence)).toBe(label)
    expect(presencePillClass(presence)).toBe(className)
  })
})
