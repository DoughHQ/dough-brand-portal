import type {
  ExperiencedReportEnvelope,
  HeadlineWinRateRow,
} from '@/lib/experiencedReport/types'
import { formatOf100 } from '@/lib/experiencedReport/withheldCopy'
import { orderedHeadlineRows } from '@/lib/experiencedReport/headline'
import { ExperienceSplitLabel } from './ExperienceSplitLabel'
import { WithheldMetric } from './WithheldMetric'
import { CoinFlipTrack, SectionShell } from './deckChrome'
import { REPORT_SECTIONS } from './reportSections'
import { CiCaption, SectionEmpty } from './legacyDeckShared'

function HeadlineClaim({
  row,
  focalName,
}: {
  row: HeadlineWinRateRow
  focalName: string
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <ExperienceSplitLabel
        split={row.experience_split}
        focalName={focalName}
      />
      <WithheldMetric metric={row}>
        <div className="deck-enter-verdict">
          <div className="report-headline-figure">
            {row.value != null ? formatOf100(row.value) : '—'}
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--ink-muted)',
                marginLeft: 10,
              }}
            >
              of 100
            </span>
          </div>
          <CoinFlipTrack
            value={row.value ?? 0}
            ciLow={row.ci_low}
            ciHigh={row.ci_high}
            tone="own"
          />
          <CiCaption lo={row.ci_low} hi={row.ci_high} />
          {typeof row.n_decisive === 'number' && row.n_decisive > 0 ? (
            <p className="report-footnote" style={{ margin: '8px 0 0' }}>
              {row.n_wins != null ? `${row.n_wins} wins` : null}
              {row.n_wins != null && row.n_decisive != null ? ' · ' : null}
              {row.n_decisive} decisive
              {row.n_ties != null ? ` · ${row.n_ties} ties` : null}
            </p>
          ) : null}
        </div>
      </WithheldMetric>
    </div>
  )
}

export function LegacyVerdictSection({
  envelope,
  notes,
}: {
  envelope: ExperiencedReportEnvelope
  notes: string[]
}) {
  const { report } = envelope
  const rows = orderedHeadlineRows(report.headline_win_rate)
  const focalName = report.focal_product.name

  return (
    <SectionShell
      id={REPORT_SECTIONS[0].id}
      number={1}
      title={REPORT_SECTIONS[0].title}
      notes={notes}
    >
      {rows.length === 0 ? (
        <SectionEmpty />
      ) : (
        rows.map((row, i) => (
          <HeadlineClaim
            key={`${row.experience_split}-${i}`}
            row={row}
            focalName={focalName}
          />
        ))
      )}
    </SectionShell>
  )
}
