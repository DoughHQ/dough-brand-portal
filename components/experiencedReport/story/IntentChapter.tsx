import { StoryChapter } from "@/components/reportStory/ReportStory";
import story from "@/components/reportStory/reportStory.module.css";
import type {
  ExperiencedReportEnvelope,
  RepurchaseSessionMetric,
} from "@/lib/experiencedReport/types";
import briefStyles from "../decisionBrief.module.css";
import viz from "../experiencedStory.module.css";
import { RepurchaseChart, type SessionMetrics } from "./RepurchaseChart";
import { movementTitle, numberValue } from "./storyFormat";

export function IntentChapter({
  envelope,
  repurchaseTitle,
  sessions,
  sessionRows,
}: {
  envelope: ExperiencedReportEnvelope;
  repurchaseTitle: string;
  sessions: SessionMetrics[];
  sessionRows: RepurchaseSessionMetric[];
}) {
  const { report } = envelope;
  const lift = report.experience_lift_vs_baseline;
  const movementReportable =
    Boolean(lift?.reportable) && lift?.mean_elo_delta != null;
  const hasMovementCounts =
    lift?.n_moved_up != null ||
    lift?.n_unchanged != null ||
    lift?.n_moved_down != null;

  return (
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
  );
}
