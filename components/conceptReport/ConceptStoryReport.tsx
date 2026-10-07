'use client'

import type {
  ConceptTestReport,
  ConceptTestVerdictResult,
} from '@/lib/conceptReport/conceptTestTypes'
import { deriveConceptNarratives } from '@/lib/conceptReport/conceptTestNarrative'
import {
  ExecutiveMemo,
  ReportFooter,
  ReportToolbar,
  Scorecard,
  StoryChapter,
  StoryIndex,
  type ReportTone,
  type ScorecardItem,
} from '@/components/reportStory/ReportStory'
import styles from '@/components/reportStory/reportStory.module.css'

type Props = {
  report: ConceptTestReport
  backHref: string
}

function pct(value: number | null | undefined): string {
  return value == null ? '—' : `${Math.round(value * 1000) / 10}%`
}

function resultLabel(result: ConceptTestVerdictResult): string {
  switch (result) {
    case 'cleared':
      return 'Cleared'
    case 'not_cleared':
      return 'Did not clear'
    case 'too_close_to_call':
      return 'Too close'
    case 'not_enough_responses':
      return 'Still forming'
    default:
      return String(result).replace(/_/g, ' ')
  }
}

function DistributionRows({
  rows,
}: {
  rows: Array<{ label: string; share: number; n: number }>
}) {
  return (
    <div className={styles.rows}>
      {rows.map((row, index) => (
        <div className={styles.dataRow} key={row.label}>
          <div className={styles.rowLabel}>
            <span>{row.label}</span>
            <strong>
              {pct(row.share)} · n={row.n}
            </strong>
          </div>
          <div className={styles.rowTrack}>
            <div
              className={index < 2 ? styles.rowFill : styles.rowFillMuted}
              style={{
                width: `${Math.max(0, Math.min(100, row.share * 100))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

type Curve = ConceptTestReport['price'][number]

function DemandCurve({ curves }: { curves: Curve[] }) {
  const visible = curves.filter(
    (curve) =>
      !curve.report.below_reporting_floor &&
      (curve.report.demand_curve?.length ?? 0) > 0,
  )
  if (!visible.length) return null
  const allPoints = visible.flatMap((curve) => curve.report.demand_curve ?? [])
  const minPrice = Math.min(...allPoints.map((point) => point.price))
  const maxPrice = Math.max(...allPoints.map((point) => point.price))
  const span = Math.max(1, maxPrice - minPrice)
  const left = 48
  const right = 536
  const top = 18
  const bottom = 196
  const x = (price: number) =>
    left + ((price - minPrice) / span) * (right - left)
  const y = (share: number) => bottom - share * (bottom - top)
  const pathFor = (curve: Curve) =>
    (curve.report.demand_curve ?? [])
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L'
        return `${command}${x(point.price).toFixed(1)},${y(
          point.share_would_pay_gte,
        ).toFixed(1)}`
      })
      .join(' ')

  return (
    <>
      <svg
        className={styles.chart}
        viewBox="0 0 560 235"
        role="img"
        aria-label="Stated willingness-to-pay demand curves"
      >
        {[0, 0.5, 1].map((share) => (
          <g key={share}>
            <line
              className={styles.chartGrid}
              x1={left}
              x2={right}
              y1={y(share)}
              y2={y(share)}
            />
            <text
              className={styles.chartLabel}
              x={left - 9}
              y={y(share) + 3}
              textAnchor="end"
            >
              {pct(share)}
            </text>
          </g>
        ))}
        {[minPrice, maxPrice].map((price) => (
          <text
            className={styles.chartLabel}
            x={x(price)}
            y={bottom + 24}
            textAnchor={price === minPrice ? 'start' : 'end'}
            key={price}
          >
            ${price.toFixed(2)}
          </text>
        ))}
        {visible.map((curve, curveIndex) => (
          <g key={curve.ref}>
            <path
              className={
                curveIndex === 0 ? styles.chartLine : styles.chartLineMuted
              }
              d={pathFor(curve)}
            />
            {(curve.report.demand_curve ?? []).map((point) => (
              <circle
                className={
                  curveIndex === 0 ? styles.chartPoint : styles.chartPointMuted
                }
                cx={x(point.price)}
                cy={y(point.share_would_pay_gte)}
                r="3.5"
                key={`${point.price}-${point.share_would_pay_gte}`}
              />
            ))}
          </g>
        ))}
      </svg>
      <div className={styles.legend}>
        {visible.map((curve, index) => (
          <span key={curve.ref}>
            <i
              className={
                index === 0 ? styles.legendSwatch : styles.legendSwatchMuted
              }
            />
            {curve.name}
          </span>
        ))}
      </div>
    </>
  )
}

function brandQuestionFinding(
  question: ConceptTestReport['brand_questions'][number],
): string {
  if (!question.options.length) return 'No answers are available yet.'
  const max = Math.max(...question.options.map((option) => option.n))
  const leaders = question.options.filter((option) => option.n === max)
  if (leaders.length === 1) {
    return `${leaders[0].option} led with ${max} of ${question.n} answers.`
  }
  return `${leaders.map((option) => option.option).join(', ')} tied at ${max} each.`
}

export function ConceptTestReportDeck({ report, backHref }: Props) {
  const narratives = deriveConceptNarratives(report)
  const narrative = narratives[0]
  const verdict = report.verdict[0]

  if (!narrative || !verdict) {
    return (
      <div className={styles.page}>
        <main className={styles.shell}>
          <ReportToolbar
            backHref={backHref}
            reportKind="Concept test"
            share={{
              productName: 'Concept',
              finding: 'The concept verdict is still forming.',
              implication: 'Return when the decision payload is ready.',
            }}
          />
          <ExecutiveMemo
            eyebrow="Concept test · Decision brief"
            headline="The concept verdict is still forming."
            lede="There is no frozen design verdict to interpret yet. This report will not substitute activity counts for a decision."
            implication="Return when the decision payload is ready."
            metadata={[`${report.sample.n_started} started`]}
          />
        </main>
      </div>
    )
  }

  const scoreItems: ScorecardItem[] = narrative.metrics.map((metric) => {
    const context =
      metric.key === 'head_to_head'
        ? `${verdict.head_to_head.wins}–${verdict.head_to_head.losses} · n=${verdict.head_to_head.n_respondents}`
        : metric.key === 'liking'
          ? `${verdict.liking.mode.replace(/_/g, ' ')}${
              verdict.liking.n_paired ? ` · n=${verdict.liking.n_paired}` : ''
            }`
          : `Stated willingness to pay · n=${verdict.price.n}`
    const fill =
      metric.key === 'head_to_head'
        ? verdict.head_to_head.win_share
        : metric.key === 'price'
          ? verdict.price.share_conservative
          : null
    const marker =
      metric.key === 'head_to_head'
        ? verdict.head_to_head.bar
        : metric.key === 'price'
          ? verdict.price.bar
          : null
    return {
      label: metric.label,
      value: metric.value,
      interval: metric.interval,
      context,
      resultLabel: resultLabel(metric.result),
      tone: metric.tone as ReportTone,
      claim: metric.claim,
      fill,
      marker,
    }
  })
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
  const topMatter = report.what_matters?.items[0]
  const mattersTitle = topMatter
    ? `${topMatter.label} ranked first in stated package priorities.`
    : 'We do not yet know which design elements mattered most.'
  const svc = report.stated_vs_chosen
  const agreementTitle = svc
    ? `${pct(svc.top_pick_agreement)} of comparable stated top picks matched observed choices.`
    : 'Stated and observed choice agreement is not available yet.'
  const priceMetric = narrative.metrics.find((metric) => metric.key === 'price')
  const priceTitle =
    priceMetric?.result === 'too_close_to_call'
      ? `At $${verdict.price.anchor.toFixed(2)}, willingness to pay is still too close to call.`
      : (priceMetric?.claim ?? 'Price evidence is still forming.')
  const methodEntries = report.method ? Object.entries(report.method) : []

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <ReportToolbar
          backHref={backHref}
          reportKind="Concept test"
          share={{
            productName: narrative.name || 'Concept',
            finding: narrative.headline,
            implication: narrative.implication,
          }}
        />
        <ExecutiveMemo
          eyebrow="Concept test · Decision brief"
          headline={narrative.headline}
          lede={narrative.explanation}
          implication={narrative.implication}
          metadata={[
            `${report.sample.n_started} participant${
              report.sample.n_started === 1 ? '' : 's'
            } started`,
            report.benchmark
              ? `Benchmark · ${report.benchmark.name}`
              : 'No benchmark',
            '95% confidence',
          ]}
        />
        <StoryIndex
          links={[
            { href: '#decision', label: '01 · The decision' },
            { href: '#first-look', label: '02 · First impression' },
            { href: '#why', label: '03 · What shaped choice' },
            { href: '#price', label: '04 · Price evidence' },
          ]}
        />

        <StoryChapter
          id="decision"
          number="01"
          kicker="The decision"
          title={narrative.headline}
          lead="The overall call comes from the frozen server verdict. The three cards show exactly why: choice, liking, and stated willingness to pay at your tested price."
          context="Pre-set bars · 95% confidence"
        >
          <Scorecard items={scoreItems} />
          <div className={styles.callout}>
            <span className={styles.calloutLabel}>Decision discipline</span>
            <p>{narrative.implication}</p>
          </div>
        </StoryChapter>

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

        <StoryChapter
          id="method"
          number="06"
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

        <ReportFooter left={`${verdict.name} · Concept decision report`} />
      </main>
    </div>
  )
}
