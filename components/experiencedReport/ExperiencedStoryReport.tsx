import type { CSSProperties } from "react";
import {
  ReportFooter,
  ReportToolbar,
  SimulatedBanner,
  StoryChapter,
  StoryIndex,
} from "@/components/reportStory/ReportStory";
import story from "@/components/reportStory/reportStory.module.css";
import { asUnit } from "@/lib/experiencedReport/executiveSummary";
import { deriveOverviewBrief } from "@/lib/experiencedReport/overviewBrief";
import type {
  AttributeImportance,
  DriverRow,
  ExperiencedReportEnvelope,
  OpponentRow,
  RepurchaseSessionMetric,
} from "@/lib/experiencedReport/types";
import {
  EvidenceStrip,
  HeadToHeadForest,
  OverviewBottomLine,
} from "./DecisionBrief";
import { PriceValueChapter } from "./DecisionChapters";
import briefStyles from "./decisionBrief.module.css";
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

  const primary = sessions[0];
  const definite = primary.definite;
  const maybe = primary.topTwo;
  const no = primary.no;
  const multi = sessions.length > 1;

  return (
    <div className={viz.intentFigure}>
      <div className={viz.intentHero}>
        <div
          className={viz.intentHeroValue}
          aria-label={
            definite == null
              ? "Definite buy-again not reportable"
              : `${pct(definite)} would definitely buy again`
          }
        >
          {definite == null ? "—" : pct(definite)}
        </div>
        <div className={viz.intentHeroCopy}>
          <strong>Definitely would buy again</strong>
          <span>
            Session {primary.session}
            {multi ? " · first reportable session" : ""}
          </span>
        </div>
      </div>

      <div className={viz.intentTracks} role="img" aria-label="Buy-again intent composition">
        {definite != null ? (
          <div className={viz.intentTrackRow}>
            <div className={viz.intentTrackMeta}>
              <span>Definitely yes</span>
              <strong>{pct(definite)}</strong>
            </div>
            <div className={viz.intentTrack}>
              <span
                className={viz.intentFillDefinite}
                style={{ width: `${definite * 100}%` } as CSSProperties}
              />
            </div>
          </div>
        ) : null}

        {maybe != null ? (
          <div className={viz.intentTrackRow}>
            <div className={viz.intentTrackMeta}>
              <span>At least maybe</span>
              <strong>{pct(maybe)}</strong>
            </div>
            <div className={viz.intentTrack}>
              <span
                className={viz.intentFillMaybe}
                style={{ width: `${maybe * 100}%` } as CSSProperties}
              />
              {definite != null ? (
                <span
                  className={viz.intentNestedDefinite}
                  style={{ width: `${definite * 100}%` } as CSSProperties}
                  title={`Definitely yes · ${pct(definite)} is inside this band`}
                />
              ) : null}
            </div>
            <p className={viz.intentNestedNote}>
              Includes “definitely yes” — not a separate group.
            </p>
          </div>
        ) : null}

        {no != null ? (
          <div className={`${viz.intentTrackRow} ${viz.intentReject}`}>
            <div className={viz.intentTrackMeta}>
              <span>No</span>
              <strong>{pct(no)}</strong>
            </div>
            <div className={viz.intentTrack}>
              <span
                className={viz.intentFillNo}
                style={{ width: `${no * 100}%` } as CSSProperties}
              />
            </div>
          </div>
        ) : null}
      </div>

      {multi ? (
        <div className={viz.intentSessionStrip}>
          <p className={viz.intentSessionLabel}>Definite yes by session</p>
          <div className={viz.intentSessionRows}>
            {sessions.map((session) => (
              <div className={viz.intentSessionRow} key={session.session}>
                <span>S{session.session}</span>
                <div className={viz.intentTrack}>
                  {session.definite != null ? (
                    <span
                      className={viz.intentFillDefinite}
                      style={
                        {
                          width: `${session.definite * 100}%`,
                        } as CSSProperties
                      }
                    />
                  ) : null}
                </div>
                <strong>
                  {session.definite == null ? "—" : pct(session.definite)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className={story.finePrint}>
        Stated intent after use — not observed repeat purchase. Rates are shares
        of the session base, not independent votes that sum to 100%.
      </p>
    </div>
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
  const overview = deriveOverviewBrief(envelope);
  const snapshot = formatDate(envelope.snapshot_date ?? envelope.computed_at);
  const sessionRows = report.repurchase_intent?.by_session ?? [];
  const sessions = repurchaseSessions(sessionRows);
  const firstSession = sessions[0];
  const lastSession = sessions.at(-1);
  const repurchaseTitle =
    firstSession?.definite != null
      ? `${pct(firstSession.definite)} would definitely buy again after Session ${firstSession.session}.`
      : "Buy-again intent is not reportable yet.";
  const favoredLabel =
    overview.reportableComparisons > 0
      ? overview.favoredComparisons === overview.reportableComparisons
        ? `${overview.productName} was preferred in all ${overview.reportableComparisons} named comparisons.`
        : `${overview.productName} was preferred in ${overview.favoredComparisons} of ${overview.reportableComparisons} named comparisons.`
      : undefined;
  const methodEntries = Object.entries(report.methodology ?? {}).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].trim().length > 0,
  );
  const lift = report.experience_lift_vs_baseline;
  const movementReportable =
    Boolean(lift?.reportable) && lift?.mean_elo_delta != null;
  const hasMovementCounts =
    lift?.n_moved_up != null ||
    lift?.n_unchanged != null ||
    lift?.n_moved_down != null;
  const stage = report.report_stage.is_final
    ? "Final read"
    : "Preliminary read";
  const rankingRow = (report.rank_validation?.by_pair_class ?? []).find(
    (row) => row.reportable && row.agreement_rate != null,
  );
  const compositionRow = (report.evidence_composition?.by_grade ?? []).find(
    (row) => row.reportable && row.value != null,
  );
  const reliabilityNote =
    report.reliability?.reportable &&
    report.reliability.consistency_rate != null
      ? `${pct(report.reliability.consistency_rate)} repeat-choice reliability`
      : "Repeat-choice reliability is below the reporting floor.";

  return (
    <div className={story.page}>
      <main className={story.shell}>
        <ReportToolbar
          backHref={backHref}
          reportKind="Experienced product report"
          share={{
            productName: overview.productName,
            finding: overview.bottomLine,
            implication: overview.interpretation,
            snapshotLabel: snapshot,
          }}
        />
        {envelope.is_simulated ? <SimulatedBanner /> : null}
        <OverviewBottomLine
          overview={overview}
          eyebrow="Experienced product report · Decision brief"
          metadata={[
            overview.brand ? `Brand · ${overview.brand}` : "Experienced product study",
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
              { href: "#overview", label: "Bottom line" },
              { href: "#performance", label: "Proof" },
              { href: "#why", label: "Why" },
              { href: "#intent", label: "Buy again" },
              { href: "#price", label: "Price" },
              { href: "#evidence", label: "Evidence" },
            ]}
          />
        ) : null}

        {variant === "full" ? (
          <>
            <StoryChapter
              id="performance"
              number="01"
              kicker="Proof · Against the field"
              title={overview.proofTitle}
              lead={`Each comparison is ${overview.productName} against one named competitor. The 50% line is an even split — right of the line means it won more often than it lost.`}
              context={`${overview.reportableComparisons} reportable comparison${
                overview.reportableComparisons === 1 ? "" : "s"
              }`}
            >
              <HeadToHeadForest
                field={overview.field}
                productName={overview.productName}
                favoredLabel={favoredLabel}
              />
            </StoryChapter>

            <StoryChapter
              id="why"
              number="02"
              kicker="Why"
              title={overview.whyTitle}
              lead="Citation shares within each outcome — what respondents said, not what would causally increase sales."
              context="Choice reasons"
            >
              <div className={`${viz.vizCard} ${viz.span12}`}>
                <DriverChart
                  won={report.choice_drivers?.by_outcome.focal_won ?? []}
                  lost={report.choice_drivers?.by_outcome.focal_lost ?? []}
                />
                <p className={story.finePrint}>
                  Shares are among choices for or against the product. They do
                  not prove that changing one reason will move preference.
                </p>
              </div>
              {report.attribute_importance?.attributes?.length ? (
                <div
                  className={`${viz.vizCard} ${viz.span12}`}
                  style={{ marginTop: 16 }}
                >
                  <p className={viz.cardKicker}>Attribute priority</p>
                  <h3 className={viz.cardTitle}>
                    Compelling versus objectionable
                  </h3>
                  <AttributeChart data={report.attribute_importance} />
                </div>
              ) : null}
            </StoryChapter>

            <StoryChapter
              id="intent"
              number="03"
              kicker="Would it stick?"
              title={repurchaseTitle}
              lead="Stated intent after use — not observed repeat sales."
              context={`${sessions.length} reportable session${
                sessions.length === 1 ? "" : "s"
              }`}
            >
              <div className={`${viz.vizCard} ${viz.span12}`}>
                <RepurchaseChart rows={sessionRows} />
              </div>
              {movementReportable && lift ? (
                <div
                  className={`${viz.vizCard} ${viz.span12}`}
                  style={{ marginTop: 16 }}
                >
                  <p className={viz.cardKicker}>Preference movement</p>
                  <h3 className={viz.cardTitle}>{movementTitle(envelope)}</h3>
                  <div className={story.bigNumber}>
                    {lift.mean_elo_delta! > 0 ? "+" : ""}
                    {numberValue(lift.mean_elo_delta)}
                  </div>
                  <p className={viz.cardCopy}>
                    Mean Elo movement among respondents with a baseline.
                    Associational — not proof that product use caused the
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
                </div>
              ) : (
                <div className={briefStyles.collapsedGap} style={{ marginTop: 16 }}>
                  <strong>Preference movement · </strong>
                  Not reportable yet — matched baseline evidence isn’t available.
                </div>
              )}
            </StoryChapter>

            <PriceValueChapter story={overview.story} />

            <StoryChapter
              id="evidence"
              number="05"
              kicker="Caveat · Trust"
              title="How much weight this preference signal can carry."
              lead="Evidence quality is not the product result. Ranking validation is agreement with stated ranks — not confidence that the product will sell."
              context="Evidence quality"
            >
              <EvidenceStrip
                rankingPct={
                  rankingRow?.agreement_rate != null
                    ? pct(rankingRow.agreement_rate)
                    : null
                }
                compositionPct={
                  compositionRow?.value != null
                    ? pct(compositionRow.value)
                    : null
                }
                reliabilityNote={reliabilityNote}
              />
              {(report.rank_validation?.by_pair_class ?? []).length ? (
                <div
                  className={`${viz.vizCard} ${viz.span12}`}
                  style={{ marginTop: 16 }}
                >
                  <p className={viz.cardKicker}>Ranking validation detail</p>
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
                                width: `${clampUnit(row.agreement_rate) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : null}
            </StoryChapter>

            <StoryChapter
              id="method"
              number="06"
              kicker="Method"
              title="What this report can—and cannot—say."
              lead="Methods sit last. Every claim above keeps its denominator, uncertainty, and scope."
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
                    report does not pool unlike comparisons or invent a podium
                    rank.
                  </p>
                </article>
                <article className={story.methodCard}>
                  <h3>Price</h3>
                  <p>
                    Legacy experienced studies did not test a shelf price.
                    Price as a cited reason is not a list-price recommendation.
                  </p>
                </article>
                {methodEntries.slice(0, 5).map(([label, copy]) => (
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
          left={`${overview.productName} · ${stage}${
            snapshot ? ` · ${snapshot}` : ""
          }`}
        />
      </main>
    </div>
  );
}
