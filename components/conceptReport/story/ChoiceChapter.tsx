import type { ConceptTestReport } from '@/lib/conceptReport/conceptTestTypes'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import styles from '@/components/reportStory/reportStory.module.css'
import { pct } from './storyFormat'

export function ChoiceChapter({ report }: { report: ConceptTestReport }) {
  const topMatter = report.what_matters?.items[0]
  const mattersTitle = topMatter
    ? `${topMatter.label} ranked first in stated package priorities.`
    : 'We do not yet know which design elements mattered most.'
  const svc = report.stated_vs_chosen
  const agreementTitle = svc
    ? `${pct(svc.top_pick_agreement)} of comparable stated top picks matched observed choices.`
    : 'Stated and observed choice agreement is not available yet.'

  return (
    <StoryChapter
      id="why"
      number="03"
      kicker="What shaped choice"
      title={mattersTitle}
      lead={
        topMatter
          ? 'These are relative MaxDiff priorities: what respondents selected as most and least important. They are not causal drivers of sales.'
          : (report.what_matters?.note ??
            'There are not enough MaxDiff answers to score package priorities responsibly.')
      }
      context={
        report.what_matters?.n_respondents
          ? `n=${report.what_matters.n_respondents}`
          : 'Evidence withheld until reportable'
      }
    >
      {report.what_matters?.items.length ? (
        <article
          className={`${styles.evidenceCard} ${styles.evidenceCardWide}`}
        >
          <p className={styles.cardEyebrow}>Relative priority</p>
          <h3 className={styles.cardTitle}>
            What respondents said mattered
          </h3>
          <div className={styles.rows}>
            {report.what_matters.items.map((item, index) => (
              <div
                className={styles.dataRow}
                key={item.value || item.label}
              >
                <div className={styles.rowLabel}>
                  <span>
                    #{item.rank ?? index + 1} · {item.label}
                  </span>
                  <strong>
                    {item.utility == null
                      ? 'Utility —'
                      : `Utility ${item.utility.toFixed(2)}`}
                  </strong>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.finePrint}>
            Utility is a relative model score, not a percentage or a
            forecast.
          </p>
        </article>
      ) : (
        <div className={styles.emptyState}>
          <strong>No priority ranking is shown</strong>
          <p>
            {report.what_matters?.note ??
              'The evidence has not reached the reporting requirement.'}{' '}
            The report does not fill this gap with open-text anecdotes.
          </p>
        </div>
      )}

      <div className={styles.evidenceGrid}>
        <article className={styles.evidenceCard}>
          <p className={styles.cardEyebrow}>Stated vs chosen</p>
          <h3 className={styles.cardTitle}>{agreementTitle}</h3>
          {svc ? (
            <>
              <div className={styles.bigNumber}>
                {pct(svc.top_pick_agreement)}
              </div>
              <p className={styles.cardText}>
                Top-pick comparison n={svc.n_top_pick_comparable}. Mean
                pairwise agreement was {pct(svc.mean_pair_agreement)} across{' '}
                {svc.n_rankings} rankings.
              </p>
            </>
          ) : (
            <p className={styles.cardText}>No comparable rankings yet.</p>
          )}
        </article>
        <article className={styles.evidenceCard}>
          <p className={styles.cardEyebrow}>What this means</p>
          <h3 className={styles.cardTitle}>
            Preference had some consistency.
          </h3>
          <p className={styles.cardText}>
            Agreement shows whether what people said they preferred aligned
            with what they chose in scored battles. It is a consistency
            check, not proof of future purchase.
          </p>
        </article>
      </div>
    </StoryChapter>
  )
}
