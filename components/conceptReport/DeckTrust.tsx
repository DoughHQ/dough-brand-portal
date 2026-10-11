import type { ConceptMissionReport } from '@/lib/conceptReport/types'
import { formatPctPoint, formatSnapshotDate } from '@/lib/conceptReport/copy'
import { ExportReportButton } from './ExportReportButton'
import { DECK_WIDTH } from './conceptDeckShared'

export function DeckTrust({ report }: { report: ConceptMissionReport }) {
  return (
    <section
      style={{
        maxWidth: DECK_WIDTH,
        margin: '0 auto',
        padding: '24px 28px 64px',
        borderTop: '1px solid var(--mist)',
      }}
    >
      <details className="deck-trust-details">
        <summary
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--heading)',
            cursor: 'pointer',
            listStyle: 'none',
          }}
        >
          Evidence quality
        </summary>
        <ul
          style={{
            listStyle: 'none',
            margin: '16px 0 0',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {report.position_bias_check?.shown_first_win_rate != null ? (
            <li style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>
              <strong>Position bias</strong> —{' '}
              {formatPctPoint(report.position_bias_check.shown_first_win_rate)} shown-first win
              rate. Near 50% means card position didn’t drive who won.
            </li>
          ) : null}
          {report.achieved_pair_coverage?.mean_shown != null ? (
            <li style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>
              <strong>Pair coverage</strong> — each matchup shown ~
              {Math.round(report.achieved_pair_coverage.mean_shown)} times
              {report.achieved_pair_coverage.min_shown != null &&
              report.achieved_pair_coverage.max_shown != null
                ? ` (${report.achieved_pair_coverage.min_shown}–${report.achieved_pair_coverage.max_shown})`
                : ''}
              .
            </li>
          ) : null}
          {report.connectivity ? (
            <li style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink)' }}>
              <strong>
                {report.connectivity.fully_connected ? 'Fully comparable' : 'Partially connected'}
              </strong>
              {report.connectivity.fully_connected
                ? ` — all ${report.n_combatants} on one ranking.`
                : '.'}
            </li>
          ) : null}
          {report.design_effect_summary?.interpretation ? (
            <li style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-muted)' }}>
              {report.design_effect_summary.interpretation}
            </li>
          ) : null}
        </ul>
      </details>

      <footer
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid var(--mist)',
        }}
      >
        <ExportReportButton />
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'right' }}>
          {formatSnapshotDate(report.snapshot_date ?? report.computed_at) ? (
            <div>Snapshot {formatSnapshotDate(report.snapshot_date ?? report.computed_at)}</div>
          ) : null}
          <div>Frozen · reproducible</div>
        </div>
      </footer>
    </section>
  )
}
