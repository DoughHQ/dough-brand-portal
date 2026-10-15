import type { ConceptTestReport } from '@/lib/conceptReport/conceptTestTypes'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import styles from '@/components/reportStory/reportStory.module.css'
import { DistributionRows } from './DistributionRows'
import { brandQuestionFinding } from './storyFormat'

export function VoicesChapter({ report }: { report: ConceptTestReport }) {
  return (
    <StoryChapter
      id="voices"
      number="05"
      kicker="In their words"
      title="The numbers set the decision; respondent voices add texture."
      lead="Open text can reveal language and hypotheses. It is never promoted into prevalence or used to overrule the scored result."
      context="Scrubbed verbatims"
    >
      {report.brand_questions.map((question) => (
        <article
          className={`${styles.evidenceCard} ${styles.evidenceCardWide}`}
          key={question.prompt}
        >
          <p className={styles.cardEyebrow}>
            {question.brand_written
              ? 'Written by you'
              : 'Diagnostic question'}
          </p>
          <h3 className={styles.cardTitle}>{question.prompt}</h3>
          <p className={styles.cardText}>
            {brandQuestionFinding(question)}
          </p>
          <DistributionRows
            rows={question.options.map((option) => ({
              label: option.option,
              n: option.n,
              share: question.n ? option.n / question.n : 0,
            }))}
          />
        </article>
      ))}
      {report.open_text?.answers.length ? (
        <div className={styles.quoteGrid}>
          {report.open_text.answers.map((answer, index) => (
            <blockquote
              className={styles.quoteCard}
              key={`${answer.text}-${index}`}
            >
              {answer.text}
            </blockquote>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>No open-text answers are available</strong>
          <p>No qualitative theme is inferred.</p>
        </div>
      )}
      {report.open_text?.scrub_note ? (
        <p className={styles.finePrint}>{report.open_text.scrub_note}</p>
      ) : null}
    </StoryChapter>
  )
}
