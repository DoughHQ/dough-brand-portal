import type { OpponentRow } from '@/lib/experiencedReport/types'
import { formatOf100 } from '@/lib/experiencedReport/withheldCopy'
import { CombatantPortrait } from '@/components/conceptReport/CombatantPortrait'
import {
  ExperienceSplitLabel,
  experienceSplitLabel,
} from './ExperienceSplitLabel'
import { WithheldMetric } from './WithheldMetric'
import { CoinFlipTrack, SectionShell } from './deckChrome'
import { REPORT_SECTIONS } from './reportSections'
import { CiCaption, SectionEmpty } from './legacyDeckShared'

function uniqueSplitDetails(rows: OpponentRow[], focalName: string): string[] {
  const seen = new Set<string>()
  const details: string[] = []
  for (const row of rows) {
    if (!row.experience_split) continue
    const { detail } = experienceSplitLabel(row.experience_split, focalName)
    if (detail && !seen.has(detail)) {
      seen.add(detail)
      details.push(detail)
    }
  }
  return details
}

export function LegacyFieldSection({
  rows,
  focalName,
  notes,
}: {
  rows: OpponentRow[] | null
  focalName: string
  notes: string[]
}) {
  const ranked = [...(rows ?? [])].sort((a, b) => {
    if (a.reportable && b.reportable && a.value != null && b.value != null) {
      return b.value - a.value
    }
    if (a.reportable !== b.reportable) return a.reportable ? -1 : 1
    return a.opponent_name.localeCompare(b.opponent_name)
  })
  const splitKeys = [
    ...new Set(
      ranked
        .map((r) => r.experience_split)
        .filter((s): s is string => Boolean(s)),
    ),
  ]
  const mixedSplits = splitKeys.length > 1
  const hoistedDetails = uniqueSplitDetails(ranked, focalName)

  return (
    <SectionShell
      id={REPORT_SECTIONS[2].id}
      number={3}
      title={REPORT_SECTIONS[2].title}
      sub={[
        `${focalName} vs each named competitor — directional under one primary signal.`,
        ...hoistedDetails,
      ]}
      notes={notes}
    >
      {ranked.length === 0 ? (
        <SectionEmpty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {ranked.map((row) => (
            <div
              key={`${row.opponent_product_id ?? row.opponent_name}-${row.experience_split ?? ''}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 14,
                alignItems: 'start',
              }}
            >
              <CombatantPortrait
                name={row.opponent_name}
                battleIntent="direct_competitor"
                size={44}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: 'var(--ink)',
                    marginBottom: 2,
                  }}
                >
                  {row.opponent_name}
                </div>
                {row.opponent_brand ? (
                  <div className="report-footnote" style={{ marginBottom: 6 }}>
                    {row.opponent_brand}
                  </div>
                ) : null}
                {mixedSplits && row.experience_split ? (
                  <ExperienceSplitLabel
                    split={row.experience_split}
                    focalName={focalName}
                    showDetail={false}
                  />
                ) : null}
                <WithheldMetric metric={row}>
                  <CoinFlipTrack
                    value={row.value ?? 0}
                    ciLow={row.ci_low}
                    ciHigh={row.ci_high}
                    tone="own"
                  />
                  <CiCaption lo={row.ci_low} hi={row.ci_high} />
                </WithheldMetric>
              </div>
              <div style={{ textAlign: 'right', minWidth: 52 }}>
                {row.reportable && row.value != null ? (
                  <>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 28,
                        lineHeight: 1,
                        color: 'var(--heading)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatOf100(row.value)}
                    </div>
                    <div className="report-footnote" style={{ marginTop: 4 }}>
                      of 100
                    </div>
                  </>
                ) : (
                  <div className="report-footnote">Withheld</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}
