import type { ConceptTestReport } from '@/lib/conceptReport/conceptTestTypes'
import { StoryChapter } from '@/components/reportStory/ReportStory'
import styles from '@/components/reportStory/reportStory.module.css'
import { DistributionRows } from './DistributionRows'
import { pct } from './storyFormat'

export function FirstLookChapter({
  report,
  verdict,
}: {
  report: ConceptTestReport
  verdict: ConceptTestReport['verdict'][number]
}) {
  const heroFirstLook =
    report.first_look.find((row) => row.ref === verdict.ref) ??
    report.first_look.find((row) => !row.is_benchmark)
  const benchmarkFirstLook = report.first_look.find((row) => row.is_benchmark)
  const firstLookTitle = heroFirstLook
    ? `${pct(heroFirstLook.top_two.share)} gave ${heroFirstLook.name} a positive first look.`
    : 'First-impression evidence is not available yet.'
  const firstLookLead =
    heroFirstLook && benchmarkFirstLook
      ? `${benchmarkFirstLook.name} was ${pct(
          benchmarkFirstLook.top_two.share,
        )} on the same top-two measure. These are descriptive first-look estimates, before any head-to-head choice.`
      : 'First look is asked before respondents make any head-to-head choice.'

  return (
    <StoryChapter
      id="first-look"
      number="02"
      kicker="First impression"
      title={firstLookTitle}
      lead={firstLookLead}
      context="Asked before head-to-head choice"
    >
      <div className={styles.evidenceGrid}>
        {heroFirstLook ? (
          <article className={styles.evidenceCard}>
            <p className={styles.cardEyebrow}>{heroFirstLook.name}</p>
            <h3 className={styles.cardTitle}>
              Full first-look distribution
            </h3>
            <DistributionRows rows={heroFirstLook.distribution} />
          </article>
        ) : null}
        {benchmarkFirstLook ? (
          <article className={styles.evidenceCard}>
            <p className={styles.cardEyebrow}>
              Benchmark · {benchmarkFirstLook.name}
            </p>
            <h3 className={styles.cardTitle}>
              Full first-look distribution
            </h3>
            <DistributionRows rows={benchmarkFirstLook.distribution} />
          </article>
        ) : null}
      </div>
    </StoryChapter>
  )
}
