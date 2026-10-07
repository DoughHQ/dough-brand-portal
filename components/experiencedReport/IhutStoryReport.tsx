import type { ExperiencedReportEnvelope } from '@/lib/experiencedReport/types'
import { deriveDecisionStory } from '@/lib/experiencedReport/decisionStory'
import { deriveIhutNarrative } from '@/lib/experiencedReport/ihutNarrative'
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
import { deriveOverviewBrief } from '@/lib/experiencedReport/overviewBrief'
import {
  ClaimStack,
  DecisionScorecardChapter,
  PriceValueChapter,
} from './DecisionChapters'
import { OverviewBottomLine } from './DecisionBrief'
import {
  AttributeEvidenceChapter,
  BuyOrderEvidenceChapter,
  Day2EvidenceChapter,
  EVIDENCE_PACK_LINKS,
  EvidencePackHeader,
  EvidenceToc,
  ExpectationEvidenceChapter,
  FieldEvidenceChapter,
  LikingEvidenceChapter,
  WhyEvidenceChapter,
} from './IhutEvidencePack'

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
          <ReportToolbar
            backHref={backHref}
            reportKind="At-home product test"
            share={{
              productName,
              finding: overview.bottomLine,
              implication: overview.interpretation,
              snapshotLabel: snapshot,
            }}
          />
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

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <ReportToolbar
          backHref={backHref}
          reportKind="At-home product test"
          share={{
            productName,
            finding: overview.bottomLine || story.headline,
            implication: overview.interpretation || story.implication,
            snapshotLabel: snapshot,
          }}
        />
        {envelope.is_simulated ? <SimulatedBanner /> : null}
        <OverviewBottomLine
          overview={overview}
          eyebrow="At-home product test · Decision brief"
          metadata={metadata}
        />
        {variant === 'full' ? (
          <StoryIndex links={[...EVIDENCE_PACK_LINKS]} />
        ) : null}

        <DecisionScorecardChapter
          title={story.headline}
          lead="Each call below comes from the frozen server verdict. A favorable percentage is not relabeled as a pass when its interval or pre-set bar says otherwise."
          items={scoreItems}
          implication={story.implication}
        />

        {variant === 'full' ? (
          <>
            <EvidencePackHeader pageCount={9} />
            <EvidenceToc />

            <FieldEvidenceChapter
              report={report}
              productName={productName}
              productRef={narrative.productRef}
              positionTitle={position.title}
              positionLead={position.lead}
              number="02"
            />

            <LikingEvidenceChapter
              report={report}
              productRef={narrative.productRef}
              number="03"
            />

            <AttributeEvidenceChapter
              report={report}
              productName={productName}
              productRef={narrative.productRef}
              number="04"
            />

            <WhyEvidenceChapter report={report} number="05" />

            <BuyOrderEvidenceChapter
              report={report}
              productRef={narrative.productRef}
              number="06"
            />

            <ExpectationEvidenceChapter
              report={report}
              productRef={narrative.productRef}
              number="07"
            />

            <PriceValueChapter story={story} number="08" />

            <Day2EvidenceChapter report={report} number="09" />

            <StoryChapter
              id="trust"
              number="10"
              kicker="Method · Trust"
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
                  <h3>Evidence pack</h3>
                  <p>
                    Measure sections page every frozen share, rank, attribute,
                    and coded reason. Empty measures stay visible as gaps —
                    they are not filled with estimates.
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
