'use client'

import { isEvidenceRung, rungLabel, RUNG_TOOLTIPS } from '@/lib/productMaster/rungs'
import { chip } from '@/lib/productMaster/styles'

export function EvidenceRungChip({ rung }: { rung: string | null | undefined }) {
  if (!rung || !isEvidenceRung(rung)) return null
  const tip = RUNG_TOOLTIPS[rung]
  return (
    <span
      title={tip}
      style={{
        ...chip,
        marginLeft: 8,
        verticalAlign: 'middle',
        cursor: 'help',
        color: rung === 'human_verified' ? 'var(--sage)' : 'var(--ink-muted, rgba(28,38,32,0.55))',
        background:
          rung === 'human_verified'
            ? 'var(--sage-soft, rgba(62,107,74,0.12))'
            : 'var(--mist, #e7e4db)',
        textTransform: 'none',
        letterSpacing: 0,
      }}
    >
      {rungLabel(rung)}
    </span>
  )
}
