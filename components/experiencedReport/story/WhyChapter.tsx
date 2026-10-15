import { StoryChapter } from "@/components/reportStory/ReportStory";
import story from "@/components/reportStory/reportStory.module.css";
import type { OverviewBrief } from "@/lib/experiencedReport/overviewBrief";
import type { ExperiencedReportEnvelope } from "@/lib/experiencedReport/types";
import viz from "../experiencedStory.module.css";
import { AttributeChart } from "./AttributeChart";
import { DriverChart } from "./DriverChart";

export function WhyChapter({
  overview,
  report,
}: {
  overview: OverviewBrief;
  report: ExperiencedReportEnvelope["report"];
}) {
  return (
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
  );
}
