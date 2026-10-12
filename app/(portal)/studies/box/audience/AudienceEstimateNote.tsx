import { subHelp } from '@/components/studies/audience/styles'
import type { CountBoxQualifiersResult } from '@/lib/box/countQualifiers'

export default function AudienceEstimateNote({
  estimate,
}: {
  estimate: {
    count: CountBoxQualifiersResult | null
  }
}) {
  return (
    <>
      <p style={{ ...subHelp, margin: '0 0 24px', maxWidth: 560 }}>
        Live estimate against current users — grows as more people join
      </p>
      {estimate.count?.warning ? (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--amber)',
            margin: '-12px 0 24px',
            lineHeight: 1.4,
            maxWidth: 560,
          }}
        >
          {estimate.count.warning}
        </p>
      ) : null}
    </>
  )
}
