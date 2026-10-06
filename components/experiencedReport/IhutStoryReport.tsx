import type { CSSProperties } from 'react'
import type { ExperiencedReportEnvelope } from '@/lib/experiencedReport/types'
import {
  deriveIhutNarrative,
  strongestAttributeDirection,
} from '@/lib/experiencedReport/ihutNarrative'
import type {
  IhutCoreReport,
  IhutCoreStrengthRow,
} from '@/lib/experiencedReport/ihutCoreTypes'
import {
  ExecutiveMemo,
  ReportFooter,
  ReportToolbar,
  Scorecard,
  SimulatedBanner,
  StoryChapter,
  StoryIndex,
  type ReportTone,
  type ScorecardItem,
} from '@/components/reportStory/ReportStory'
import styles from '@/components/reportStory/reportStory.module.css'

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

function BarRows({
  rows,
  mutedRefs = [],
}: {
  rows: Array<{
    key: string
    label: string
    value: number | null
    note?: string
  }>
  mutedRefs?: string[]
}) {
  return (
    <div className={styles.rows}>
      {rows.map((row) => (
        <div className={styles.dataRow} key={row.key}>
          <div className={styles.rowLabel}>
            <span>{row.label}</span>
            <strong>
              {pct(row.value)}
              {row.note ? ` · ${row.note}` : ''}
            </strong>
          </div>
          <div className={styles.rowTrack}>
            <div
              className={
                mutedRefs.includes(row.key)
                  ? styles.rowFillMuted
                  : styles.rowFill
              }
              style={
                {
                  width: `${Math.max(0, Math.min(100, (row.value ?? 0) * 100))}%`,
                } as CSSProperties
              }
            />
          </div>
        </div>
      ))}
    </div>
  )
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
  const narrative = deriveIhutNarrative(report)
  const productName =
    narrative?.productName ||
    envelope.report.focal_product.name ||
    'The product'
  const stage = envelope.report.report_stage.is_final
    ? 'Final read'
    : 'Preliminary read'
  const snapshot = formatDate(envelope.snapshot_date)
  const metadata = [
    `IHUT · ${stage}`,
    `${envelope.report.participation.n_users} participant${
      envelope.report.participation.n_users === 1 ? '' : 's'
    }`,
    snapshot ? `Snapshot ${snapshot}` : null,
  ].filter((value): value is string => Boolean(value))

  if (!narrative) {
    return (
      <div className={styles.page}>
        <main className={styles.shell}>
          <ReportToolbar backHref={backHref} />
          {envelope.is_simulated ? <SimulatedBanner /> : null}
          <ExecutiveMemo
            eyebrow="At-home product test · Decision brief"
            headline={`The verdict on ${productName} is still forming.`}
            lede="The study exists, but the decision payload is not ready. This report will not fill the gap with a point estimate or a guess."
            implication="Keep this read preliminary and return when the success-bar verdict is available."
            metadata={metadata}
          />
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
  const heroExpectation = report.expectation_vs_experience.find(
    (row) => row.ref === narrative.productRef,
  )
  const heroDay2 = report.day2.preference_hold
  const hasDay2 =
    report.day2.preference_hold.n > 0 ||
    report.day2.consumption.length > 0 ||
    report.day2.wear.length > 0
  const priceMetric = narrative.metrics.find((metric) => metric.key === 'price')
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
        <ExecutiveMemo
          eyebrow="At-home product test · Decision brief"
          headline={narrative.headline}
          lede={narrative.explanation}
          implication={narrative.implication}
          metadata={metadata}
        />
        {variant === 'full' ? (
          <StoryIndex
            links={[
              { href: '#decision', label: '01 · The decision' },
              { href: '#promise', label: '02 · Promise vs delivery' },
              { href: '#why', label: '03 · Why it happened' },
              { href: '#commercial', label: '04 · Commercial signal' },
            ]}
          />
        ) : null}

        <StoryChapter
          id="decision"
          number="01"
          kicker="The decision"
          title={narrative.headline}
          lead="Each call below comes from the frozen server verdict. A favorable percentage is not relabeled as a pass when its interval or pre-set bar says otherwise."
          context="Pre-set bars · unchanged"
        >
          <Scorecard items={scoreItems} />
          <div className={styles.callout}>
            <span className={styles.calloutLabel}>Decision discipline</span>
            <p>{narrative.implication}</p>
          </div>
        </StoryChapter>

        {variant === 'full' ? (
          <>
            <StoryChapter
              id="promise"
              number="02"
              kicker="Promise vs delivery"
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
                <div className={styles.emptyState}>
                  <strong>No promise-to-delivery comparison yet</strong>
                  <p>
                    Both shelf and tasted positions are required before this
                    report claims movement.
                  </p>
                </div>
              )}
              <p className={styles.finePrint}>
                Rank is shown because it is decision-readable. Underlying
                Bradley–Terry strengths are model scores, not percentages, and
                are not presented as respondent shares.
              </p>
            </StoryChapter>

            <StoryChapter
              id="why"
              number="03"
              kicker="Why it happened"
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
              </div>
            </StoryChapter>

            <StoryChapter
              id="commercial"
              number="04"
              kicker="Commercial signal"
              title={
                priceMetric?.claim ??
                'The tested price signal is still forming.'
              }
              lead="This is stated willingness to buy at the tested price—not a revenue forecast, repeat-purchase rate, or guarantee of in-market conversion."
              context="Observed in this study"
            >
              <div className={styles.evidenceGrid}>
                <article className={styles.evidenceCard}>
                  <p className={styles.cardEyebrow}>Buy order</p>
                  <h3 className={styles.cardTitle}>
                    Ranked first after tasting
                  </h3>
                  <div className={styles.bigNumber}>
                    {pct(heroBuyOrder?.first_share)}
                  </div>
                  <p className={styles.cardText}>
                    {heroBuyOrder
                      ? `Share ranking ${productName} first after tasting · n=${heroBuyOrder.n}.`
                      : 'No buy-order evidence is available yet.'}
                  </p>
                </article>
                <article className={styles.evidenceCard}>
                  <p className={styles.cardEyebrow}>Expectation met</p>
                  <h3 className={styles.cardTitle}>
                    Liked it and expected good
                  </h3>
                  <div className={styles.bigNumber}>
                    {pct(heroExpectation?.liked_and_expected_good_share)}
                  </div>
                  <p className={styles.cardText}>
                    This is the specific conjunction measured—not a general
                    claim that the product “delivered.”
                  </p>
                </article>
              </div>
            </StoryChapter>

            <StoryChapter
              id="day-two"
              number="05"
              kicker="Did it last?"
              title={day2Title}
              lead={
                hasDay2
                  ? 'Day 2 shows whether the observed preference and experience held in the follow-up. It does not establish causality.'
                  : 'This report keeps the chapter visible so an absent follow-up is explicit, not silently omitted.'
              }
              context="Follow-up evidence"
            >
              {hasDay2 ? (
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
                <div className={styles.emptyState}>
                  <strong>No Day 2 response is included</strong>
                  <p>
                    No hold, consumption, or wear claim is made from the Day 1
                    result.
                  </p>
                </div>
              )}
            </StoryChapter>

            <StoryChapter
              id="method"
              number="06"
              kicker="Trust the read"
              title="What this report can—and cannot—say."
              lead="The method sits last, but it is not fine-print theater. These rules protect the decision from flattering reinterpretation."
              context="Transparent by design"
            >
              <div className={styles.methods}>
                <article className={styles.methodCard}>
                  <h3>Server verdict</h3>
                  <p>
                    The overall result and all three metric calls are rendered
                    from the frozen report payload. This page does not recompute
                    or upgrade them.
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
                  <h3>Sample floor</h3>
                  <p>
                    A metric needs at least 10 answers to receive a decision
                    call. Smaller bases remain “Still forming.”
                  </p>
                </article>
                <article className={styles.methodCard}>
                  <h3>Scope</h3>
                  <p>
                    Findings describe this product, price, comparison field, and
                    sample. They are not a launch recommendation or sales
                    forecast.
                  </p>
                </article>
              </div>
            </StoryChapter>
          </>
        ) : null}

        <ReportFooter
          left={`${productName} · ${stage}${snapshot ? ` · ${snapshot}` : ''}`}
        />
      </main>
    </div>
  )
}
