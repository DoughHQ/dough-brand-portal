import type { ConceptTestReport } from '@/lib/conceptReport/conceptTestTypes'
import type { ConceptVerdictNarrative } from '@/lib/conceptReport/conceptTestNarrative'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import styles from '@/components/reportStory/reportStory.module.css'
import { DemandCurve } from './DemandCurve'
import { pct } from './storyFormat'

export function PriceChapter({
  report,
  narrative,
  verdict,
}: {
  report: ConceptTestReport
  narrative: ConceptVerdictNarrative
  verdict: ConceptTestReport['verdict'][number]
}) {
  const priceMetric = narrative.metrics.find((metric) => metric.key === 'price')
  const priceTitle =
    priceMetric?.result === 'too_close_to_call'
      ? `At $${verdict.price.anchor.toFixed(2)}, willingness to pay is still too close to call.`
      : (priceMetric?.claim ?? 'Price evidence is still forming.')

  return (
    <StoryChapter
      id="price"
      number="04"
      kicker="Price evidence"
      title={priceTitle}
      lead="The curve shows stated willingness to pay at or above each price. It describes this sample and question; it does not predict market demand."
      context="Stated willingness to pay"
    >
      <article
        className={`${styles.evidenceCard} ${styles.evidenceCardWide}`}
      >
        <p className={styles.cardEyebrow}>Demand curve</p>
        <h3 className={styles.cardTitle}>
          The share willing to pay narrows as price rises.
        </h3>
        <DemandCurve curves={report.price} />
      </article>
      <div className={styles.evidenceGrid}>
        {report.price.map((row) => (
          <article className={styles.evidenceCard} key={row.ref}>
            <p className={styles.cardEyebrow}>
              {row.is_benchmark ? 'Benchmark' : 'Test concept'}
            </p>
            <h3 className={styles.cardTitle}>{row.name}</h3>
            <div className={styles.bigNumber}>
              {row.report.below_reporting_floor
                ? 'Withheld'
                : (row.report.modal_band?.label ?? '—')}
            </div>
            <p className={styles.cardText}>
              {row.report.below_reporting_floor
                ? 'Below the reporting floor; no price story is inferred.'
                : `Most common stated price band${
                    row.report.n_answers
                      ? ` · n=${row.report.n_answers}`
                      : ''
                  }${
                    row.report.rejection_rate == null
                      ? ''
                      : ` · ${pct(row.report.rejection_rate)} rejected all shown prices`
                  }.`}
            </p>
          </article>
        ))}
      </div>
    </StoryChapter>
  )
}
