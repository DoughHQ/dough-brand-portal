import { StoryChapter } from "@/components/reportStory/ReportStory";
import story from "@/components/reportStory/reportStory.module.css";
import type { ExperiencedReportEnvelope } from "@/lib/experiencedReport/types";
import type { SessionMetrics } from "./RepurchaseChart";
import { displayLabel } from "./storyFormat";

export function MethodChapter({
  report,
  firstSession,
  lastSession,
}: {
  report: ExperiencedReportEnvelope["report"];
  firstSession: SessionMetrics | undefined;
  lastSession: SessionMetrics | undefined;
}) {
  const methodEntries = Object.entries(report.methodology ?? {}).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].trim().length > 0,
  );

  return (
    <StoryChapter
      id="method"
      number="07"
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
  );
}
