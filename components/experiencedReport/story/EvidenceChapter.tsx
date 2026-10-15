import { StoryChapter } from "@/components/reportStory/ReportStory";
import story from "@/components/reportStory/reportStory.module.css";
import type { ExperiencedReportEnvelope } from "@/lib/experiencedReport/types";
import { EvidenceStrip } from "../DecisionBrief";
import viz from "../experiencedStory.module.css";
import { clampUnit, displayLabel, pct } from "./storyFormat";

export function EvidenceChapter({
  report,
}: {
  report: ExperiencedReportEnvelope["report"];
}) {
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
  );
}
