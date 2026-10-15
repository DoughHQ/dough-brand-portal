import type { ConceptTestReport } from '@/lib/conceptReport/conceptTestTypes'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import styles from '@/components/reportStory/reportStory.module.css'

export function MethodChapter({ report }: { report: ConceptTestReport }) {
  const methodEntries = report.method ? Object.entries(report.method) : []

  return (
    <StoryChapter
      id="method"
      number="07"
      kicker="Trust the read"
      title="The rules were fixed before the result."
      lead="Confidence, bars, reporting floors, and the meaning of each measure stay visible so a compelling story never becomes an inflated one."
      context="Method appendix"
    >
      <div className={styles.methods}>
        {methodEntries.map(([label, copy]) => (
          <article className={styles.methodCard} key={label}>
            <h3>{label.replace(/_/g, ' ')}</h3>
            <p>{copy}</p>
          </article>
        ))}
        <article className={styles.methodCard}>
          <h3>Sample accounting</h3>
          <p>
            {report.sample.n_started} started · {report.sample.n_completed}{' '}
            completed · {report.sample.n_screened_out} screened out ·{' '}
            {report.sample.n_battles_excluded_for_timing} timing-flagged
            battles excluded.
          </p>
        </article>
      </div>
    </StoryChapter>
  )
}
