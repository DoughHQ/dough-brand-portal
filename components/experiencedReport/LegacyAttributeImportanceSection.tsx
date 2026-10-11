import type { AttributeImportance } from '@/lib/experiencedReport/types'
import { WithheldMetric } from './WithheldMetric'
import { BipolarTrack, SectionShell } from './deckChrome'
import { REPORT_SECTIONS } from './reportSections'
import { SectionEmpty } from './legacyDeckShared'

export function LegacyAttributeImportanceSection({
  data,
  notes,
}: {
  data: AttributeImportance | null
  notes: string[]
}) {
  const attrs = data?.attributes ?? []

  return (
    <SectionShell
      id={REPORT_SECTIONS[3].id}
      number={4}
      title={REPORT_SECTIONS[3].title}
      sub={
        data?.interpretation ??
        'Best-minus-worst importance — compelling vs objectionable.'
      }
      notes={notes}
    >
      {attrs.length === 0 ? (
        <SectionEmpty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="bipolar-labels" style={{ marginBottom: 4 }}>
            <span>Objectionable</span>
            <span>Compelling</span>
          </div>
          {attrs.map((a) => {
            const score = a.bw_score
            const nearZero = score != null && Math.abs(score) < 0.05

            return (
              <div key={a.attribute}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontWeight: 500, color: 'var(--ink)' }}>
                    {a.attribute}
                  </span>
                  {a.reportable && score != null ? (
                    <span
                      style={{
                        color: nearZero
                          ? 'var(--ink-muted)'
                          : score < 0
                            ? 'var(--clay)'
                            : 'var(--sage)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {score > 0 ? '+' : ''}
                      {score.toFixed(2)}
                    </span>
                  ) : null}
                </div>
                <WithheldMetric metric={a}>
                  <BipolarTrack
                    score={score}
                    ciLow={a.bw_ci_low}
                    ciHigh={a.bw_ci_high}
                  />
                </WithheldMetric>
              </div>
            )
          })}
        </div>
      )}
    </SectionShell>
  )
}
