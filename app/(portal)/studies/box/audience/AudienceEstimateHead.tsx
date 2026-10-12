import { optionalAffordance } from '@/components/studies/audience/styles'
import type { CountBoxQualifiersResult } from '@/lib/box/countQualifiers'

export default function AudienceEstimateHead({
  estimate,
}: {
  estimate: {
    count: CountBoxQualifiersResult | null
    headline: string
    loading: boolean
    qualifyingUsers: number | undefined
  }
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 8,
      }}
    >
      <p style={{ ...optionalAffordance, margin: 0 }}>
        All filters are optional. Leave them blank to let anyone qualify.
      </p>
      <div
        aria-live="polite"
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 20,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: estimate.count?.below_viable_floor
            ? 'var(--amber)'
            : 'var(--ink-80)',
          opacity:
            estimate.loading && estimate.qualifyingUsers != null ? 0.55 : 1,
          lineHeight: 1.2,
        }}
      >
        {estimate.headline}
      </div>
    </div>
  )
}
