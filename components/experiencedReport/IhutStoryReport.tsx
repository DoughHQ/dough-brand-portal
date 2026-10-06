import type { ExperiencedReportEnvelope } from '@/lib/experiencedReport/types'
import { deriveDecisionStory } from '@/lib/experiencedReport/decisionStory'
import {
  deriveIhutNarrative,
  strongestAttributeDirection,
} from '@/lib/experiencedReport/ihutNarrative'
import type {
  IhutCoreReport,
  IhutCoreStrengthRow,
} from '@/lib/experiencedReport/ihutCoreTypes'
import {
  ReportFooter,
  ReportToolbar,
  SimulatedBanner,
  StoryChapter,
  StoryIndex,
  type ReportTone,
  type ScorecardItem,
} from '@/components/reportStory/ReportStory'
import styles from '@/components/reportStory/reportStory.module.css'
import { deriveDecisionStory } from '@/lib/experiencedReport/decisionStory'
import { deriveOverviewBrief } from '@/lib/experiencedReport/overviewBrief'
import {
  ClaimStack,
  DataGapNotice,
  DECISION_CHAPTER_LINKS,
  DecisionScorecardChapter,
  PriceValueChapter,
} from './DecisionChapters'
import { OverviewBottomLine } from './DecisionBrief'

type Props = {
  envelope: ExperiencedReportEnvelope
  report: IhutCoreReport
  backHref: string
  variant?: 'full' | 'preview'
}

function pct(value: number | null | undefined): string {
  return value == null ? '—' : `${Math.round(value * 1000) / 10}%`
}

function resultLabel(result: string): string {
  switch (result) {
    case 'cleared':
      return 'Cleared'
    case 'not_cleared':
      return 'Did not clear'
    case 'too_close_to_call':
      return 'Too close'
    case 'not_enough_responses':
      return 'Still forming'
    case 'not_tested':
      return 'No bar set'
    default:
      return result.replace(/_/g, ' ')
  }
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function rankFor(rows: IhutCoreStrengthRow[], ref: number) {
  return rows.find((row) => row.ref === ref) ?? null
}

function positionFinding(
  report: IhutCoreReport,
  productName: string,
  productRef: number,
) {
  const shelf = rankFor(report.promise_vs_delivery?.shelf ?? [], productRef)
  const taste = rankFor(report.promise_vs_delivery?.taste ?? [], productRef)
  const shelfRank = shelf?.rank ?? null
  const tasteRank = taste?.rank ?? null
  if (shelfRank == null && tasteRank != null) {
    return {
      title: `${productName} earned its position after tasting.`,
      lead: `It ranked #${tasteRank} in the taste experience. Packaging promise was not tested, so no promise-to-delivery movement is claimed.`,
    }
  }
  if (shelfRank == null || tasteRank == null) {
    return {
      title: 'Promise-to-delivery evidence is not available yet.',
      lead: 'The report will not invent a packaging-versus-experience story without both measurements.',
    }
  }
  if (tasteRank < shelfRank) {
    return {
      title: `${productName} gained ground after people tried it.`,
      lead: `It moved from #${shelfRank} on shelf promise to #${tasteRank} after tasting.`,
    }
  }
  if (tasteRank > shelfRank) {
    return {
      title: `${productName} lost ground after people tried it.`,
      lead: `It moved from #${shelfRank} on shelf promise to #${tasteRank} after tasting. The experience did not fully deliver the position the package created.`,
    }
  }
  return {
    title: `${productName} held its position from promise to delivery.`,
    lead: `It ranked #${shelfRank} both before and after tasting.`,
  }
}

function rankedNames(rows: IhutCoreStrengthRow[]): string {
  return [...rows]
    .filter((row) => row.rank != null)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((row) => `#${row.rank ?? '—'} ${row.name}`)
    .join(' · ')
}

function CountRows({
  rows,
  noun = 'response',
}: {
  rows: Array<{ answer: string; n: number }>
  noun?: string
}) {
  const max = Math.max(1, ...rows.map((row) => row.n))
  return (
    <div className={styles.rows}>
      {rows.map((row) => (
        <div className={styles.dataRow} key={row.answer}>
          <div className={styles.rowLabel}>
            <span>{row.answer}</span>
            <strong>
              {row.n} {noun}
              {row.n === 1 ? '' : 's'}
            </strong>
          </div>
          <div className={styles.rowTrack}>
            <div
              className={styles.rowFill}
              style={{ width: `${(row.n / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function IhutStoryReport({
  envelope,
  report,
  backHref,
  variant = 'full',
}: Props) {
  const story = deriveDecisionStory(envelope)
  const narrative = deriveIhutNarrative(report)
  const productName =
    story.productName ||
    narrative?.productName ||
    envelope.report.focal_product.name ||
    'The product'
  const snapshot = formatDate(envelope.snapshot_date)
  const metadata = [
    `IHUT · ${story.stageLabel}`,
    `${story.participation.nUsers} participant${
      story.participation.nUsers === 1 ? '' : 's'
    }`,
    snapshot ? `Snapshot ${snapshot}` : null,
  ].filter((value): value is string => Boolean(value))

  if (!narrative) {
    const overview = deriveOverviewBrief(envelope)
    overview.bottomLine = `The verdict on ${productName} is still forming.`
    overview.explanation =
      'The study exists, but the decision payload is not ready. This report will not fill the gap with a point estimate or a guess.'
    overview.interpretation =
      'Keep this read preliminary and return when the success-bar verdict is available.'
    overview.call = 'forming'
    overview.callLabel = 'Still forming'
    return (
      <div className={styles.page}>
        <main className={styles.shell}>
          <ReportToolbar backHref={backHref} />
          {envelope.is_simulated ? <SimulatedBanner /> : null}
          <OverviewBottomLine
            overview={overview}
            eyebrow="At-home product test · Decision brief"
            metadata={metadata}
          />
          {variant === 'full' ? <PriceValueChapter story={story} /> : null}
        </main>
      </div>
    )
  }

  const scoreItems: ScorecardItem[] = narrative.metrics.map((metric) => ({
    label: metric.label,
    value: pct(metric.value),
    interval:
      metric.lo == null || metric.hi == null
        ? undefined
        : `${pct(metric.lo)}–${pct(metric.hi)}`,
    intervalPrefix: 'Reported interval',
    context: `${metric.n ?? 0} answer${metric.n === 1 ? '' : 's'}`,
    resultLabel: resultLabel(metric.result),
    tone: metric.tone as ReportTone,
    claim: metric.claim,
    fill: metric.value,
    marker: metric.bar,
  }))
  const overview = deriveOverviewBrief(envelope)
  overview.bottomLine = story.headline
  overview.explanation = story.explanation
  overview.interpretation = story.implication
  if (narrative.overall === 'cleared') {
    overview.call = 'ahead'
    overview.callLabel = 'Cleared'
  } else if (narrative.overall === 'not_cleared') {
    overview.call = 'behind'
    overview.callLabel = 'Did not clear'
  } else if (narrative.overall === 'too_close_to_call') {
    overview.call = 'too_close'
    overview.callLabel = 'Too close'
  } else {
    overview.call = 'forming'
    overview.callLabel = 'Still forming'
  }
  const position = positionFinding(report, productName, narrative.productRef)
  const shelfRows = report.promise_vs_delivery?.shelf ?? []
  const tasteRows = report.promise_vs_delivery?.taste ?? []
  const attributeIssue = strongestAttributeDirection(
    report.attribute_penalties,
    narrative.productRef,
  )
  const heroReasons = [...report.taste_why].sort((a, b) => b.n - a.n)
  const heroBuyOrder = report.buy_order.find(
    (row) => row.ref === narrative.productRef,
  )
  const heroDay2 = report.day2.preference_hold
  const day2Available =
    report.day2.preference_hold.n > 0 ||
    report.day2.consumption.length > 0 ||
    report.day2.wear.length > 0
  const whyTitle = attributeIssue
    ? `${attributeIssue.claim} That is the clearest formulation watch-out.`
    : heroReasons[0]
      ? `${heroReasons[0].answer} was the most-cited reason behind the taste choice.`
      : 'The “why” evidence is still limited.'
  const day2Title =
    heroDay2.n > 0
      ? `${pct(heroDay2.same_favorite_share)} kept the same favorite on Day 2.`
      : 'Day 2 evidence is not available yet.'

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <ReportToolbar backHref={backHref} />
        {envelope.is_simulated ? <SimulatedBanner /> : null}
        <OverviewBottomLine
          overview={overview}
          eyebrow="At-home product test · Decision brief"
          metadata={metadata}
        />
        {variant === 'full' ? <StoryIndex links={[...DECISION_CHAPTER_LINKS]} /> : null}

        <DecisionScorecardChapter
          title={story.headline}
          lead="Each call below comes from the frozen server verdict. A favorable percentage is not relabeled as a pass when its interval or pre-set bar says otherwise."
          items={scoreItems}
          implication={story.implication}
        />

        {variant === 'full' ? (
          <>
            <StoryChapter
              id="field"
              number="02"
              kicker="Against whom?"
              title={position.title}
              lead={position.lead}
              context="Rank is relative to the tested field"
            >
              {shelfRows.length || tasteRows.length ? (
                <div className={styles.evidenceGrid}>
                  <article className={styles.evidenceCard}>
                    <p className={styles.cardEyebrow}>Before tasting</p>
                    <h3 className={styles.cardTitle}>Shelf promise</h3>
                    <p className={styles.cardText}>
                      {shelfRows.length
                        ? rankedNames(shelfRows)
                        : 'Not measured in this study.'}
                    </p>
                  </article>
                  <article className={styles.evidenceCard}>
                    <p className={styles.cardEyebrow}>After tasting</p>
                    <h3 className={styles.cardTitle}>Delivered experience</h3>
                    <p className={styles.cardText}>
                      {tasteRows.length
                        ? rankedNames(tasteRows)
                        : 'Not measured in this study.'}
                    </p>
                  </article>
                </div>
              ) : (
                <DataGapNotice
                  title="No promise-to-delivery comparison yet"
                  body="Both shelf and tasted positions are required before this report claims movement."
                />
              )}
              <p className={styles.finePrint}>
                Rank is shown because it is decision-readable. Underlying
                Bradley–Terry strengths are model scores, not percentages.
              </p>
            </StoryChapter>

            <StoryChapter
              id="diagnosis"
              number="03"
              kicker="Why?"
              title={whyTitle}
              lead="Directional diagnostics explain where to look next. They do not prove that changing one attribute will cause the verdict to move."
              context={`Hero product · ${productName}`}
            >
              <div className={styles.evidenceGrid}>
                <article className={styles.evidenceCard}>
                  <p className={styles.cardEyebrow}>Taste choice</p>
                  <h3 className={styles.cardTitle}>Reasons people gave</h3>
                  {heroReasons.length ? (
                    <CountRows rows={heroReasons.slice(0, 6)} noun="mention" />
                  ) : (
                    <p className={styles.cardText}>
                      No coded taste reasons are available for this product yet.
                    </p>
                  )}
                </article>
                <article className={styles.evidenceCard}>
                  <p className={styles.cardEyebrow}>Just-right diagnostics</p>
                  <h3 className={styles.cardTitle}>
                    Strongest directional issue
                  </h3>
                  {attributeIssue ? (
                    <>
                      <div className={styles.bigNumber}>
                        {pct(attributeIssue.share)}
                      </div>
                      <p className={styles.cardText}>{attributeIssue.claim}</p>
                    </>
                  ) : (
                    <p className={styles.cardText}>
                      No directional attribute issue is reportable yet.
                    </p>
                  )}
                </article>
                {heroBuyOrder ? (
                  <article className={styles.evidenceCard}>
                    <p className={styles.cardEyebrow}>Buy order</p>
                    <h3 className={styles.cardTitle}>Ranked first after tasting</h3>
                    <div className={styles.bigNumber}>
                      {pct(heroBuyOrder.first_share)}
                    </div>
                    <p className={styles.cardText}>
                      Share ranking {productName} first · n={heroBuyOrder.n}.
                      Preference order is not the same as buy-at-price intent.
                    </p>
                  </article>
                ) : null}
              </div>
            </StoryChapter>

            <PriceValueChapter story={story} />

            <StoryChapter
              id="durability"
              number="05"
              kicker="Did it hold?"
              title={day2Title}
              lead={
                day2Available
                  ? 'Day 2 shows whether the observed preference and experience held in the follow-up. It does not establish causality.'
                  : 'This report keeps the chapter visible so an absent follow-up is explicit, not silently omitted.'
              }
              context="Follow-up evidence"
            >
              {day2Available ? (
                <div className={styles.evidenceGrid}>
                  <article className={styles.evidenceCard}>
                    <p className={styles.cardEyebrow}>Preference hold</p>
                    <h3 className={styles.cardTitle}>Same choice as Day 1</h3>
                    <div className={styles.bigNumber}>
                      {pct(report.day2.preference_hold.same_favorite_share)}
                    </div>
                    <p className={styles.cardText}>
                      Same Day 1 favorite · n={report.day2.preference_hold.n}.
                    </p>
                  </article>
                  <article className={styles.evidenceCard}>
                    <p className={styles.cardEyebrow}>Consumption</p>
                    <h3 className={styles.cardTitle}>How much was used</h3>
                    {report.day2.consumption.length ? (
                      <CountRows rows={report.day2.consumption} />
                    ) : (
                      <p className={styles.cardText}>Not reported.</p>
                    )}
                  </article>
                  {report.day2.wear.length ? (
                    <article
                      className={`${styles.evidenceCard} ${styles.evidenceCardWide}`}
                    >
                      <p className={styles.cardEyebrow}>How it wore</p>
                      <h3 className={styles.cardTitle}>
                        Whether the experience grew or faded
                      </h3>
                      <CountRows rows={report.day2.wear} />
                    </article>
                  ) : null}
                </div>
              ) : (
                <DataGapNotice
                  title="No Day 2 response is included"
                  body="No hold, consumption, or wear claim is made from the Day 1 result."
                />
              )}
            </StoryChapter>

            <StoryChapter
              id="trust"
              number="06"
              kicker="How much should I trust it?"
              title="What this report can—and cannot—say."
              lead="These rules protect the decision from flattering reinterpretation. Price claims remain tested-offer intent, never demand."
              context="Transparent by design"
            >
              <ClaimStack
                claims={story.claims.filter((c) => c.kind === 'limitation')}
              />
              <div className={styles.methods}>
                <article className={styles.methodCard}>
                  <h3>Server verdict</h3>
                  <p>
                    The overall result and metric calls are rendered from the
                    frozen report payload. This page does not recompute or
                    upgrade them.
                  </p>
                </article>
                <article className={styles.methodCard}>
                  <h3>Success bars</h3>
                  <p>
                    Bars are the thresholds set before the read. Missing bars
                    are labeled “No bar set,” never backfilled after seeing
                    results.
                  </p>
                </article>
                <article className={styles.methodCard}>
                  <h3>Price decision floor</h3>
                  <p>
                    Under 10 answers: counts only. 10–29: descriptive small-base
                    evidence. A pass/fail price verdict requires at least 30
                    answers.
                  </p>
                </article>
                <article className={styles.methodCard}>
                  <h3>Scope</h3>
                  <p>
                    Findings describe this product, tested shelf price,
                    comparison field, and sample. They are not a launch
                    recommendation, elasticity curve, or sales forecast.
                  </p>
                </article>
              </div>
            </StoryChapter>
          </>
        ) : null}

        <ReportFooter
          left={`${productName} · ${story.stageLabel}${snapshot ? ` · ${snapshot}` : ''}`}
        />
      </main>
    </div>
  )
}
