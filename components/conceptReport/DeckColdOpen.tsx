import type { ConceptMissionReport } from '@/lib/conceptReport/types'
import { findingStatusChip, formatSnapshotDate } from '@/lib/conceptReport/copy'
import { Chip, DECK_WIDTH } from './conceptDeckShared'

export function DeckColdOpen({
  report,
  thin,
  backHref,
}: {
  report: ConceptMissionReport
  thin: boolean
  backHref: string
}) {
  const title = report.study_title?.trim() || 'Concept study report'
  const meta = [
    `${report.n_concepts} concept${report.n_concepts === 1 ? '' : 's'} vs ${report.n_products} shelf`,
    `${report.n_respondents} people`,
    `${report.n_decisive_battles} choices`,
  ].join(' · ')

  return (
    <header
      className="deck-cold-open"
      style={{
        position: 'relative',
        padding: '56px 28px 48px',
        background:
          'linear-gradient(165deg, #fffdf8 0%, var(--cream) 45%, rgba(62, 107, 74, 0.08) 100%)',
        borderBottom: '1px solid var(--mist)',
      }}
    >
      <div style={{ maxWidth: DECK_WIDTH, margin: '0 auto' }}>
        <a
          href={backHref}
          style={{
            fontSize: 12,
            color: 'var(--ink-faint)',
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: 28,
          }}
        >
          ← Back to studies
        </a>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <Chip tone={thin ? 'amber' : 'pro'}>{findingStatusChip(report.finding, thin)}</Chip>
          {formatSnapshotDate(report.snapshot_date ?? report.computed_at) ? (
            <Chip>Snapshot {formatSnapshotDate(report.snapshot_date ?? report.computed_at)}</Chip>
          ) : null}
          <Chip>Frozen · reproducible</Chip>
        </div>
        <h1
          className="deck-enter-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5.5vw, 52px)',
            fontWeight: 400,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            margin: '0 0 16px',
            maxWidth: 780,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 16,
            lineHeight: 1.5,
            color: 'var(--ink-muted)',
            margin: 0,
            maxWidth: 560,
          }}
        >
          {meta}
        </p>
      </div>
    </header>
  )
}
