import type { ExperiencedReportEnvelope } from '@/lib/experiencedReport/types'
import { formatSnapshotDate } from '@/lib/experiencedReport/withheldCopy'
import {
  headlineStatusChip,
  leadHeadlineRow,
  stageChipLabel,
} from '@/lib/experiencedReport/headline'
import { participationLine } from '@/lib/experiencedReport/executiveSummary'
import { CombatantPortrait } from '@/components/conceptReport/CombatantPortrait'
import { ExportReportButton } from '@/components/conceptReport/ExportReportButton'
import { Chip } from './deckChrome'

export function LegacyDeckColdOpen({
  envelope,
  backHref,
}: {
  envelope: ExperiencedReportEnvelope
  backHref: string
}) {
  const { report } = envelope
  const focal = report.focal_product
  const stage = report.report_stage
  const status = headlineStatusChip(report.headline_win_rate)
  const lead = leadHeadlineRow(report.headline_win_rate)
  const nDecisive = lead?.n_decisive
  const metaParts = [participationLine(report.participation)]
  if (typeof nDecisive === 'number' && nDecisive > 0) {
    metaParts.push(`${nDecisive} choices`)
  }

  return (
    <header className="report-cold-open">
      <div className="report-cold-open-top">
        <a
          href={backHref}
          className="no-print"
          style={{
            fontSize: 12,
            color: 'var(--ink-faint)',
            textDecoration: 'none',
          }}
        >
          ← Back to studies
        </a>
        <div className="report-export no-print">
          <ExportReportButton />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <CombatantPortrait
          name={focal.name}
          battleIntent="own_concept_arm"
          size={56}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          {focal.brand ? (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--heading)',
                margin: '0 0 6px',
              }}
            >
              {focal.brand}
            </p>
          ) : null}
          <div className="report-title-row">
            <h1 className="deck-enter-title">{focal.name}</h1>
            <Chip tone="neutral">{stageChipLabel(stage)}</Chip>
            <Chip tone={status.tone}>{status.label}</Chip>
            {formatSnapshotDate(
              envelope.snapshot_date ?? envelope.computed_at,
            ) ? (
              <Chip>
                Snapshot{' '}
                {formatSnapshotDate(
                  envelope.snapshot_date ?? envelope.computed_at,
                )}
              </Chip>
            ) : null}
            <Chip>Frozen · reproducible</Chip>
          </div>
          <p className="report-body" style={{ margin: 0 }}>
            {metaParts.join(' · ')}
          </p>
        </div>
      </div>
    </header>
  )
}
