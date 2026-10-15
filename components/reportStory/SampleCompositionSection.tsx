import type { SampleComposition } from '@/lib/reportSampleComposition'
import { sampleCompositionLabel } from '@/lib/reportSampleComposition'
import { StoryChapter } from './ReportStory'
import styles from './reportStory.module.css'

function percentage(value: number | null): string {
  if (value == null) return '—'
  return `${Math.round(value * 1000) / 10}%`
}

function CompositionList({
  rows,
  kFloor,
}: {
  rows: SampleComposition['age_bands']
  kFloor: number
}) {
  if (rows.length === 0) {
    return <p className={styles.compositionEmpty}>No reportable groups yet.</p>
  }

  return (
    <div className={styles.compositionList}>
      {rows.map((row) => (
        <div className={styles.compositionRow} key={row.key}>
          <span>{sampleCompositionLabel(row.key)}</span>
          <span className={row.reportable ? styles.compositionValue : styles.compositionWithheld}>
            {row.reportable
              ? `${percentage(row.share)} · n=${row.n}`
              : `Withheld (n < ${kFloor})`}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SampleCompositionSection({
  composition,
  number,
}: {
  composition: SampleComposition | null
  number: string
}) {
  if (!composition) return null

  return (
    <StoryChapter
      id="sample-composition"
      number={number}
      kicker="Sample · Completers"
      title="Who took part."
      lead="Age and product relationship are shown only as anonymized group summaries. Exact birth dates, addresses, and participant identities are never part of this report."
      context={`${composition.n_in_cohort} completer${
        composition.n_in_cohort === 1 ? '' : 's'
      } · privacy floor k=${composition.k_floor}`}
    >
      <div className={styles.methods}>
        <article className={styles.methodCard}>
          <h3>Age range</h3>
          <CompositionList rows={composition.age_bands} kFloor={composition.k_floor} />
          {composition.n_missing_age > 0 ? (
            <p className={styles.compositionNote}>
              {composition.n_missing_age} completer
              {composition.n_missing_age === 1 ? '' : 's'} had no age available for this cut.
            </p>
          ) : null}
        </article>

        <article className={styles.methodCard}>
          <h3>Product relationship at claim</h3>
          {composition.brand_familiarity ? (
            <CompositionList
              rows={composition.brand_familiarity}
              kFloor={composition.k_floor}
            />
          ) : (
            <p className={styles.compositionEmpty}>
              This study had no focal product for a purchaser cut.
            </p>
          )}
        </article>
      </div>
      <p className={styles.finePrint}>
        Shares are frozen with the report. Groups below {composition.k_floor} people keep their
        count but withhold the percentage.
      </p>
    </StoryChapter>
  )
}
