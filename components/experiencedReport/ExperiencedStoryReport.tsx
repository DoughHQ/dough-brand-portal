import type { CSSProperties } from "react";
import {
  ExecutiveMemo,
  ReportFooter,
  ReportToolbar,
  SimulatedBanner,
  StoryChapter,
  StoryIndex,
} from "@/components/reportStory/ReportStory";
import story from "@/components/reportStory/reportStory.module.css";
import {
  asUnit,
  deriveExecutiveSummary,
  pickTopDriver,
} from "@/lib/experiencedReport/executiveSummary";
import { deriveExperiencedNarrative } from "@/lib/experiencedReport/experiencedNarrative";
import type {
  AttributeImportance,
  DriverRow,
  ExperiencedReportEnvelope,
  OpponentRow,
  RepurchaseSessionMetric,
} from "@/lib/experiencedReport/types";
import viz from "./experiencedStory.module.css";

type Props = {
  envelope: ExperiencedReportEnvelope;
  backHref: string;
  variant?: "full" | "preview";
};

function pct(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(asUnit(value) * 100).toFixed(digits)}%`;
}

function numberValue(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function clampUnit(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, asUnit(value)));
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function splitLabel(split: string): string {
  if (split === "experienced_vs_experienced") return "Consumed vs consumed";
  if (split === "experienced_vs_hypothetical")
    return "Consumed vs hypothetical";
  return split.replace(/_/g, " ");
}

function displayLabel(value: string): string {
  const label = value.replace(/_/g, " ").trim();
  return label ? `${label[0].toUpperCase()}${label.slice(1)}` : "Evidence";
}

function PreferenceDial({
  value,
  low,
  high,
}: {
  value: number;
  low: number | null;
  high: number | null;
}) {
  const share = clampUnit(value);
  const lo = low == null ? null : clampUnit(low);
  const hi = high == null ? null : clampUnit(high);
  const angle = Math.PI * (1 - share);
  const pointX = 180 + 130 * Math.cos(angle);
  const pointY = 165 - 130 * Math.sin(angle);
  const intervalStart = lo == null || hi == null ? 0 : Math.min(lo, hi) * 100;
  const intervalWidth = lo == null || hi == null ? 0 : Math.abs(hi - lo) * 100;

  return (
    <svg
      className={viz.preferenceDial}
      viewBox="0 0 360 205"
      role="img"
      aria-label={`Chosen ${pct(value)}; ${
        low != null && high != null
          ? `likely range ${pct(low)} to ${pct(high)}`
          : "interval unavailable"
      }`}
    >
      <path
        className={viz.dialRail}
        d="M50 165 A130 130 0 0 1 310 165"
        pathLength="100"
      />
      {intervalWidth > 0 ? (
        <path
          className={viz.dialInterval}
          d="M50 165 A130 130 0 0 1 310 165"
          pathLength="100"
          strokeDasharray={`${intervalWidth} ${100 - intervalWidth}`}
          strokeDashoffset={-intervalStart}
        />
      ) : null}
      <path
        className={viz.dialValue}
        d="M50 165 A130 130 0 0 1 310 165"
        pathLength="100"
        strokeDasharray={`${share * 100} ${100 - share * 100}`}
      />
      <line className={viz.dialMidline} x1="180" x2="180" y1="24" y2="50" />
      <circle className={viz.dialPoint} cx={pointX} cy={pointY} r="7" />
      <text className={viz.dialText} x="180" y="142">
        {pct(value)}
      </text>
      <text className={viz.dialSubtext} x="180" y="162">
        chosen after use
      </text>
      <text className={viz.dialSubtext} x="50" y="190">
        0%
      </text>
      <text className={viz.dialSubtext} x="180" y="190">
        even
      </text>
      <text className={viz.dialSubtext} x="310" y="190">
        100%
      </text>
    </svg>
  );
}

function ComparisonChart({
  rows,
  productName,
}: {
  rows: OpponentRow[];
  productName: string;
}) {
  const reportable = rows
    .filter((row) => row.reportable && row.value != null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  if (!reportable.length) {
    return (
      <div className={viz.emptyVisual}>
        <div>
          <strong>No named comparison is reportable yet</strong>
          The field chart appears when opponent-level evidence clears its floor.
        </div>
      </div>
    );
  }

  return (
    <div
      className={viz.comparisonChart}
      role="img"
      aria-label={`${productName} experienced preference against each named competitor`}
    >
      {reportable.map((row) => {
        const value = clampUnit(row.value);
        const lo = row.ci_low == null ? value : clampUnit(row.ci_low);
        const hi = row.ci_high == null ? value : clampUnit(row.ci_high);
        return (
          <div
            className={viz.comparisonRow}
            key={`${row.opponent_name}-${row.experience_split}`}
          >
            <div className={viz.comparisonName}>
              <strong>{row.opponent_name}</strong>
              <span>{splitLabel(row.experience_split ?? "")}</span>
            </div>
            <div className={viz.rangeTrack}>
              <span
                className={viz.rangeBand}
                style={{
                  left: `${Math.min(lo, hi) * 100}%`,
                  width: `${Math.abs(hi - lo) * 100}%`,
                }}
              />
              <span
                className={viz.rangePoint}
                style={{ left: `${value * 100}%` }}
              />
            </div>
            <div className={viz.comparisonValue}>{pct(value)}</div>
          </div>
        );
      })}
      <div className={viz.axis} aria-hidden="true">
        <div className={viz.axisScale}>
          <span>0%</span>
          <span>50% even</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

type DriverDatum = {
  label: string;
  won: number;
  lost: number;
};

function driverData(
  wonRows: DriverRow[],
  lostRows: DriverRow[],
): DriverDatum[] {
  const byKey = new Map<string, DriverDatum>();
  for (const row of wonRows) {
    if (!row.reportable || row.share == null) continue;
    const key = row.driver.trim().toLowerCase();
    byKey.set(key, {
      label: row.driver,
      won: clampUnit(row.share),
      lost: byKey.get(key)?.lost ?? 0,
    });
  }
  for (const row of lostRows) {
    if (!row.reportable || row.share == null) continue;
    const key = row.driver.trim().toLowerCase();
    const current = byKey.get(key);
    byKey.set(key, {
      label: current?.label ?? row.driver,
      won: current?.won ?? 0,
      lost: clampUnit(row.share),
    });
  }
  return [...byKey.values()]
    .sort((a, b) => Math.max(b.won, b.lost) - Math.max(a.won, a.lost))
    .slice(0, 8);
}

function DriverChart({ won, lost }: { won: DriverRow[]; lost: DriverRow[] }) {
  const rows = driverData(won, lost);
  const max = Math.max(0.01, ...rows.flatMap((row) => [row.won, row.lost]));
  if (!rows.length) {
    return (
      <div className={viz.emptyVisual}>
        <div>
          <strong>The reasons are still forming</strong>
          No choice reason clears the reporting requirement yet.
        </div>
      </div>
    );
  }
  return (
    <div className={viz.driverChart}>
      <div className={viz.driverLegend}>
        <span>When chosen against</span>
        <span>When chosen</span>
      </div>
      {rows.map((row) => (
        <div className={viz.driverRow} key={row.label}>
          <div className={viz.driverLabel}>{row.label}</div>
          <div className={viz.divergingTrack}>
            <div className={viz.negativeHalf}>
              {row.lost > 0 ? (
                <span
                  className={viz.negativeBar}
                  style={{ width: `${(row.lost / max) * 100}%` }}
                >
                  <span className={viz.barNumberLeft}>{pct(row.lost)}</span>
                </span>
              ) : null}
            </div>
            <div className={viz.positiveHalf}>
              {row.won > 0 ? (
                <span
                  className={viz.positiveBar}
                  style={{ width: `${(row.won / max) * 100}%` }}
                >
                  <span className={viz.barNumberRight}>{pct(row.won)}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttributeChart({ data }: { data: AttributeImportance | null }) {
  const rows = (data?.attributes ?? [])
    .filter((row) => row.reportable && row.bw_score != null)
    .sort((a, b) => Math.abs(b.bw_score ?? 0) - Math.abs(a.bw_score ?? 0))
    .slice(0, 8);
  const max = Math.max(0.01, ...rows.map((row) => Math.abs(row.bw_score ?? 0)));

  if (!rows.length) {
    return (
      <div className={viz.emptyVisual}>
        <div>
          <strong>No attribute priority is reportable yet</strong>
          This report will not infer category priorities from isolated comments.
        </div>
      </div>
    );
  }

  return (
    <div className={viz.attributeChart}>
      {rows.map((row) => {
        const score = row.bw_score ?? 0;
        const width = (Math.abs(score) / max) * 100;
        return (
          <div className={viz.attributeRow} key={row.attribute}>
            <div className={viz.attributeName}>{row.attribute}</div>
            <div className={viz.attributeTrack}>
              <div className={viz.attributeNegative}>
                {score < 0 ? (
                  <span
                    className={viz.attributeFillNegative}
                    style={{ width: `${width}%` }}
                  />
                ) : null}
              </div>
              <div className={viz.attributePositive}>
                {score > 0 ? (
                  <span
                    className={viz.attributeFillPositive}
                    style={{ width: `${width}%` }}
                  />
                ) : null}
              </div>
            </div>
            <div className={viz.attributeValue}>
              {score > 0 ? "+" : ""}
              {score.toFixed(2)}
            </div>
          </div>
        );
      })}
      <div className={viz.attributeAxis} aria-hidden="true">
        <span>More objectionable</span>
        <span>More compelling</span>
      </div>
    </div>
  );
}

type SessionMetrics = {
  session: number;
  definite: number | null;
  topTwo: number | null;
  no: number | null;
};

function repurchaseSessions(rows: RepurchaseSessionMetric[]): SessionMetrics[] {
  const sessions = new Map<number, SessionMetrics>();
  for (const row of rows) {
    if (!row.reportable || row.rate == null) continue;
    const current = sessions.get(row.session_number) ?? {
      session: row.session_number,
      definite: null,
      topTwo: null,
      no: null,
    };
    const rate = clampUnit(row.rate);
    if (row.metric === "definite_yes") current.definite = rate;
    if (row.metric === "top_two_box") current.topTwo = rate;
    if (row.metric === "no") current.no = rate;
    sessions.set(row.session_number, current);
  }
  return [...sessions.values()].sort((a, b) => a.session - b.session);
}

function RepurchaseChart({ rows }: { rows: RepurchaseSessionMetric[] }) {
  const sessions = repurchaseSessions(rows);
  if (!sessions.length) {
    return (
      <div className={viz.emptyVisual}>
        <div>
          <strong>No buy-again signal is reportable yet</strong>
          The chart appears when the response base clears its floor.
        </div>
      </div>
    );
  }
  const left = 48;
  const right = 572;
  const top = 20;
  const bottom = 210;
  const y = (value: number) => bottom - value * (bottom - top);
  const slot = (right - left) / sessions.length;
  const barWidth = Math.min(28, slot / 5);

  return (
    <>
      <svg
        className={viz.buyChart}
        viewBox="0 0 620 250"
        role="img"
        aria-label="Buy-again intent by session"
      >
        {[0, 0.5, 1].map((value) => (
          <g key={value}>
            <line
              className={viz.chartGrid}
              x1={left}
              x2={right}
              y1={y(value)}
              y2={y(value)}
            />
            <text
              className={viz.chartAxisText}
              x={left - 8}
              y={y(value) + 3}
              textAnchor="end"
            >
              {pct(value)}
            </text>
          </g>
        ))}
        {sessions.map((session, index) => {
          const center = left + slot * index + slot / 2;
          const metrics = [
            {
              value: session.definite,
              className: viz.definiteBar,
              offset: -barWidth - 3,
              label: "Definitely yes",
            },
            {
              value: session.topTwo,
              className: viz.maybeBar,
              offset: 0,
              label: "Yes or maybe",
            },
            {
              value: session.no,
              className: viz.noBar,
              offset: barWidth + 3,
              label: "No",
            },
          ];
          return (
            <g key={session.session}>
              {metrics.map((metric) =>
                metric.value == null ? null : (
                  <rect
                    className={metric.className}
                    x={center + metric.offset - barWidth / 2}
                    y={y(metric.value)}
                    width={barWidth}
                    height={bottom - y(metric.value)}
                    rx="3"
                    key={metric.label}
                  >
                    <title>{`Session ${session.session} · ${
                      metric.label
                    } · ${pct(metric.value)}`}</title>
                  </rect>
                ),
              )}
              <text
                className={viz.chartAxisText}
                x={center}
                y={bottom + 22}
                textAnchor="middle"
              >
                Session {session.session}
              </text>
            </g>
          );
        })}
      </svg>
      <div className={viz.chartLegend}>
        <span>
          <i className={viz.legendDefinite} />
          Definitely yes
        </span>
        <span>
          <i className={viz.legendMaybe} />
          Yes or maybe
        </span>
        <span>
          <i className={viz.legendNo} />
          No
        </span>
      </div>
      <p className={story.finePrint}>
        “Yes or maybe” includes “definitely yes”; bars are shown side by side
        and should not be added together.
      </p>
    </>
  );
}

function ReliabilityVisual({
  value,
  note,
}: {
  value: number;
  note?: string | null;
}) {
  const share = clampUnit(value);
  return (
    <div className={viz.ringLayout}>
      <div
        className={viz.ring}
        style={{ "--ring-value": `${share * 100}%` } as CSSProperties}
        role="img"
        aria-label={`${pct(share)} test-retest consistency`}
      >
        <span className={viz.ringValue}>{pct(share)}</span>
      </div>
      <div className={viz.ringCopy}>
        <strong>Test–retest consistency</strong>
        <p>
          {note ??
            "Consistency among respondents who repeated a decisive choice."}
        </p>
      </div>
    </div>
  );
}

function rankTitle(envelope: ExperiencedReportEnvelope): string {
  const rows = envelope.report.rank_validation?.by_pair_class ?? [];
  const best = rows.find((row) => row.reportable && row.agreement_rate != null);
  return best?.agreement_rate != null
    ? `${pct(best.agreement_rate)} of reportable ranking pairs agreed with observed choices.`
    : "Ranking consistency is not reportable yet.";
}

function movementTitle(envelope: ExperiencedReportEnvelope): string {
  const lift = envelope.report.experience_lift_vs_baseline;
  if (!lift?.reportable || lift.mean_elo_delta == null) {
    return "Preference movement is not reportable yet.";
  }
  if (lift.mean_elo_delta > 0) {
    return `Preference moved upward by ${numberValue(lift.mean_elo_delta)} Elo points on average.`;
  }
  if (lift.mean_elo_delta < 0) {
    return `Preference moved downward by ${numberValue(Math.abs(lift.mean_elo_delta))} Elo points on average.`;
  }
  return "Average preference position did not move.";
}

export function ExperiencedStoryReport({
  envelope,
  backHref,
  variant = "full",
}: Props) {
  const { report } = envelope;
  const narrative = deriveExperiencedNarrative(envelope);
  const summary = deriveExecutiveSummary(envelope);
  const snapshot = formatDate(envelope.snapshot_date ?? envelope.computed_at);
  const opponents = report.per_opponent ?? [];
  const reportableOpponents = opponents.filter(
    (row) => row.reportable && row.value != null,
  );
  const opponentValues = reportableOpponents.map((row) => clampUnit(row.value));
  const fieldLow = opponentValues.length ? Math.min(...opponentValues) : null;
  const fieldHigh = opponentValues.length ? Math.max(...opponentValues) : null;
  const topDriver = pickTopDriver(report.choice_drivers?.by_outcome.focal_won);
  const topHeadwind = pickTopDriver(
    report.choice_drivers?.by_outcome.focal_lost,
  );
  const driverTitle =
    topDriver && topHeadwind
      ? `${topDriver.driver} led choice; ${topHeadwind.driver} was the leading headwind.`
      : topDriver
        ? `${topDriver.driver} was the leading reason for choice.`
        : topHeadwind
          ? `${topHeadwind.driver} was the leading headwind.`
          : "The reasons behind choice are still forming.";
  const sessionRows = report.repurchase_intent?.by_session ?? [];
  const sessions = repurchaseSessions(sessionRows);
  const firstSession = sessions[0];
  const lastSession = sessions.at(-1);
  const repurchaseTitle =
    firstSession?.definite != null
      ? `${pct(firstSession.definite)} would definitely buy again after Session ${firstSession.session}.`
      : "Buy-again intent is not reportable yet.";
  const fieldTitle =
    fieldLow != null && fieldHigh != null
      ? `Preference ranged from ${pct(fieldLow)} to ${pct(fieldHigh)} across named competitors.`
      : "The named competitive field is not reportable yet.";
  const methodEntries = Object.entries(report.methodology ?? {}).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].trim().length > 0,
  );
  const lift = report.experience_lift_vs_baseline;
  const hasMovementCounts =
    lift?.n_moved_up != null ||
    lift?.n_unchanged != null ||
    lift?.n_moved_down != null;
  const stage = report.report_stage.is_final
    ? "Final read"
    : "Preliminary read";

  return (
    <div className={story.page}>
      <main className={story.shell}>
        <ReportToolbar backHref={backHref} />
        {envelope.is_simulated ? <SimulatedBanner /> : null}
        <ExecutiveMemo
          eyebrow="Experienced product report · Decision brief"
          headline={narrative.headline}
          lede={narrative.explanation}
          implication={narrative.implication}
          metadata={[
            report.focal_product.brand
              ? `Brand · ${report.focal_product.brand}`
              : "Experienced product study",
            `${report.participation.n_users} participant${
              report.participation.n_users === 1 ? "" : "s"
            }`,
            stage,
            snapshot ? `Snapshot ${snapshot}` : "Frozen report",
          ]}
        />

        {variant === "full" ? (
          <StoryIndex
            links={[
              { href: "#preference", label: "01 · Preference" },
              { href: "#field", label: "02 · Against the field" },
              { href: "#why", label: "03 · Why" },
              { href: "#durability", label: "04 · Durability" },
            ]}
          />
        ) : null}

        <StoryChapter
          id="preference"
          number="01"
          kicker="The preference signal"
          title={narrative.headline}
          lead="The chart shows the point estimate, its likely range, and the 50% even-split reference. The interval—not the most flattering number—sets the strength of the claim."
          context={
            summary.headline
              ? splitLabel(summary.headline.experience_split)
              : "Evidence forming"
          }
        >
          {narrative.preferenceShare != null ? (
            <div className={`${viz.vizCard} ${viz.vizCardDark}`}>
              <div className={viz.preferenceLayout}>
                <PreferenceDial
                  value={narrative.preferenceShare}
                  low={narrative.intervalLow}
                  high={narrative.intervalHigh}
                />
                <div className={viz.preferenceFacts}>
                  <div className={viz.fact}>
                    <strong>
                      {narrative.intervalLow != null &&
                      narrative.intervalHigh != null
                        ? `${pct(narrative.intervalLow)}–${pct(
                            narrative.intervalHigh,
                          )}`
                        : "Interval unavailable"}
                    </strong>
                    <span>Likely preference range in this tested field</span>
                  </div>
                  <div className={viz.fact}>
                    <strong>{narrative.nDecisive ?? "—"}</strong>
                    <span>Decisive choices behind the preference estimate</span>
                  </div>
                  <div className={viz.fact}>
                    <strong>{summary.confidence}</strong>
                    <span>Precision label based on interval width</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={viz.emptyVisual}>
              <div>
                <strong>Preference is below the reporting floor</strong>
                No chart is drawn from an unreportable estimate.
              </div>
            </div>
          )}
        </StoryChapter>

        {variant === "full" ? (
          <>
            <StoryChapter
              id="field"
              number="02"
              kicker="Against the field"
              title={fieldTitle}
              lead={`Each row is ${narrative.productName} against one named competitor. Intervals remain separate; the report never averages unlike comparison slices.`}
              context={`${reportableOpponents.length} reportable comparison${
                reportableOpponents.length === 1 ? "" : "s"
              }`}
            >
              <div className={`${viz.vizCard} ${viz.span12}`}>
                <p className={viz.cardKicker}>
                  Experienced preference by opponent
                </p>
                <h3 className={viz.cardTitle}>
                  Point estimate and likely range, with 50% marked
                </h3>
                <ComparisonChart
                  rows={opponents}
                  productName={narrative.productName}
                />
              </div>
            </StoryChapter>

            <StoryChapter
              id="why"
              number="03"
              kicker="Why people chose"
              title={driverTitle}
              lead="Reasons are reported as citation shares within each outcome. They explain what respondents said—not what would causally increase sales."
              context="Choice reasons · category priorities"
            >
              <div className={viz.visualGrid}>
                <article className={`${viz.vizCard} ${viz.span7}`}>
                  <p className={viz.cardKicker}>Choice reasons</p>
                  <h3 className={viz.cardTitle}>
                    What helped—and what worked against the product
                  </h3>
                  <DriverChart
                    won={report.choice_drivers?.by_outcome.focal_won ?? []}
                    lost={report.choice_drivers?.by_outcome.focal_lost ?? []}
                  />
                </article>
                <article className={`${viz.vizCard} ${viz.span5}`}>
                  <p className={viz.cardKicker}>Attribute priority</p>
                  <h3 className={viz.cardTitle}>
                    Compelling versus objectionable
                  </h3>
                  <p className={viz.cardCopy}>
                    Best-minus-worst scores are relative model values, not
                    percentages.
                  </p>
                  <AttributeChart data={report.attribute_importance} />
                </article>
              </div>
            </StoryChapter>

            <StoryChapter
              id="durability"
              number="04"
              kicker="Would it last?"
              title={repurchaseTitle}
              lead="Intent is shown by session so a later response cannot be collapsed into the first read. These are stated answers, not observed repeat sales."
              context={`${sessions.length} reportable session${
                sessions.length === 1 ? "" : "s"
              }`}
            >
              <div className={viz.visualGrid}>
                <article className={`${viz.vizCard} ${viz.span7}`}>
                  <p className={viz.cardKicker}>Buy-again intent</p>
                  <h3 className={viz.cardTitle}>Response profile by session</h3>
                  <RepurchaseChart rows={sessionRows} />
                </article>
                <article className={`${viz.vizCard} ${viz.span5}`}>
                  <p className={viz.cardKicker}>Preference movement</p>
                  <h3 className={viz.cardTitle}>{movementTitle(envelope)}</h3>
                  {lift?.reportable && lift.mean_elo_delta != null ? (
                    <>
                      <div className={story.bigNumber}>
                        {lift.mean_elo_delta > 0 ? "+" : ""}
                        {numberValue(lift.mean_elo_delta)}
                      </div>
                      <p className={viz.cardCopy}>
                        Mean Elo movement among respondents with a baseline.
                        Associational—not proof that product use caused the
                        movement.
                      </p>
                      {hasMovementCounts ? (
                        <div className={viz.numberGrid}>
                          <div className={viz.numberCard}>
                            <strong>{lift.n_moved_up ?? "—"}</strong>
                            <span>Moved up</span>
                          </div>
                          <div className={viz.numberCard}>
                            <strong>{lift.n_unchanged ?? "—"}</strong>
                            <span>Unchanged</span>
                          </div>
                          <div className={viz.numberCard}>
                            <strong>{lift.n_moved_down ?? "—"}</strong>
                            <span>Moved down</span>
                          </div>
                        </div>
                      ) : null}
                      {lift.confound_warning ? (
                        <p className={story.finePrint}>
                          {lift.confound_warning}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <div className={viz.emptyVisual}>
                      <div>
                        <strong>No reportable baseline movement</strong>
                        The report does not infer change without matched
                        evidence.
                      </div>
                    </div>
                  )}
                </article>
              </div>
            </StoryChapter>

            <StoryChapter
              id="trust"
              number="05"
              kicker="Trust the read"
              title={rankTitle(envelope)}
              lead="Reliability, ranking consistency, and evidence composition show how much weight this result can reasonably carry."
              context="Evidence quality"
            >
              <div className={viz.visualGrid}>
                <article className={`${viz.vizCard} ${viz.span6}`}>
                  <p className={viz.cardKicker}>Repeat-choice reliability</p>
                  <h3 className={viz.cardTitle}>
                    Did respondents make a consistent choice?
                  </h3>
                  {report.reliability?.reportable &&
                  report.reliability.consistency_rate != null ? (
                    <ReliabilityVisual
                      value={report.reliability.consistency_rate}
                      note={report.reliability.scope_note}
                    />
                  ) : (
                    <div className={viz.emptyVisual}>
                      <div>
                        <strong>
                          Reliability is below the reporting floor
                        </strong>
                        No consistency percentage is shown.
                      </div>
                    </div>
                  )}
                </article>
                <article className={`${viz.vizCard} ${viz.span6}`}>
                  <p className={viz.cardKicker}>Ranking validation</p>
                  <h3 className={viz.cardTitle}>Stated rank versus choice</h3>
                  {(report.rank_validation?.by_pair_class ?? []).length ? (
                    <div className={story.rows}>
                      {(report.rank_validation?.by_pair_class ?? []).map(
                        (row) => (
                          <div className={story.dataRow} key={row.pair_class}>
                            <div className={story.rowLabel}>
                              <span>{displayLabel(row.pair_class)}</span>
                              <strong>
                                {row.reportable
                                  ? pct(row.agreement_rate)
                                  : "Withheld"}
                              </strong>
                            </div>
                            <div className={story.rowTrack}>
                              <div
                                className={story.rowFill}
                                style={{
                                  width: `${
                                    clampUnit(row.agreement_rate) * 100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className={viz.emptyVisual}>
                      <div>
                        <strong>No ranking validation is available</strong>
                        The report keeps this limitation visible.
                      </div>
                    </div>
                  )}
                </article>
                {report.evidence_composition?.by_grade.length ? (
                  <article className={`${viz.vizCard} ${viz.span12}`}>
                    <p className={viz.cardKicker}>Evidence composition</p>
                    <h3 className={viz.cardTitle}>
                      How product experience was verified
                    </h3>
                    <div className={story.rows}>
                      {report.evidence_composition.by_grade.map(
                        (row, index) => (
                          <div
                            className={story.dataRow}
                            key={row.evidence_split ?? `grade-${index}`}
                          >
                            <div className={story.rowLabel}>
                              <span>
                                {displayLabel(
                                  row.evidence_split ?? "Evidence grade",
                                )}
                              </span>
                              <strong>
                                {row.reportable ? pct(row.value) : "Withheld"}
                              </strong>
                            </div>
                            <div className={story.rowTrack}>
                              <div
                                className={story.rowFill}
                                style={{
                                  width: `${clampUnit(row.value) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </article>
                ) : null}
              </div>
            </StoryChapter>

            <StoryChapter
              id="method"
              number="06"
              kicker="Method appendix"
              title="What this report can—and cannot—say."
              lead="Methods sit last, but every visual above keeps its denominator, uncertainty, and scope intact."
              context="Transparent by design"
            >
              <div className={story.methods}>
                <article className={story.methodCard}>
                  <h3>Decision scope</h3>
                  <p>
                    This report describes experienced preference in the tested
                    field. It is not a launch recommendation or sales forecast.
                  </p>
                </article>
                <article className={story.methodCard}>
                  <h3>Comparison discipline</h3>
                  <p>
                    Experience splits and named opponents remain separate. The
                    report does not pool unlike comparisons.
                  </p>
                </article>
                {methodEntries.slice(0, 6).map(([label, copy]) => (
                  <article className={story.methodCard} key={label}>
                    <h3>{displayLabel(label)}</h3>
                    <p>{copy}</p>
                  </article>
                ))}
              </div>
              {lastSession &&
              firstSession &&
              lastSession.session !== firstSession.session ? (
                <p className={story.finePrint}>
                  Last reportable session: {lastSession.session}. Session views
                  remain separate and are not averaged.
                </p>
              ) : null}
            </StoryChapter>
          </>
        ) : null}

        <ReportFooter
          left={`${narrative.productName} · ${stage}${
            snapshot ? ` · ${snapshot}` : ""
          }`}
        />
      </main>
    </div>
  );
}
