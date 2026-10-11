import type { ReactNode } from 'react'
import { WithheldMetric } from './WithheldMetric'

export function toOf100(value: number): number {
  return value <= 1 ? Math.round(value * 100) : Math.round(value)
}

export function CiCaption({
  lo,
  hi,
}: {
  lo: number | null
  hi: number | null
}) {
  if (lo == null || hi == null) return null
  const a = toOf100(lo)
  const b = toOf100(hi)
  return (
    <p className="report-footnote" style={{ margin: '8px 0 0' }}>
      Likely between {Math.min(a, b)} and {Math.max(a, b)} out of 100.
    </p>
  )
}

export function QuietNote({ children }: { children: ReactNode }) {
  return (
    <p
      className="report-footnote"
      style={{ margin: '12px 0 0', fontStyle: 'italic' }}
    >
      {children}
    </p>
  )
}

export function SectionEmpty({ reason }: { reason?: string | null }) {
  return (
    <WithheldMetric
      metric={{
        reportable: false,
        withheld_reason:
          reason?.trim() || 'Not enough responses yet to report this',
      }}
    />
  )
}
