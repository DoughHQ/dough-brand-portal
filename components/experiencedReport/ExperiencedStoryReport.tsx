import {
  ReportFooter,
  ReportToolbar,
  SimulatedBanner,
  StoryChapter,
  StoryIndex,
} from "@/components/reportStory/ReportStory";
import story from "@/components/reportStory/reportStory.module.css";
import { deriveOverviewBrief } from "@/lib/experiencedReport/overviewBrief";
import type { ExperiencedReportEnvelope } from "@/lib/experiencedReport/types";
import { HeadToHeadForest, OverviewBottomLine } from "./DecisionBrief";
import { PriceValueChapter } from "./DecisionChapters";
import { formatDate, pct } from "./story/storyFormat";
import { repurchaseSessions } from "./story/RepurchaseChart";
import { WhyChapter } from "./story/WhyChapter";
import { IntentChapter } from "./story/IntentChapter";
import { EvidenceChapter } from "./story/EvidenceChapter";
import { MethodChapter } from "./story/MethodChapter";
import { SampleCompositionSection } from "@/components/reportStory/SampleCompositionSection";

type Props = {
  envelope: ExperiencedReportEnvelope;
  backHref: string;
  variant?: "full" | "preview";
};

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
  const stage = report.report_stage.is_final
    ? "Final read"
    : "Preliminary read";

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
              { href: "#sample-composition", label: "Who took part" },
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

            <WhyChapter overview={overview} report={report} />

            <IntentChapter
              envelope={envelope}
              repurchaseTitle={repurchaseTitle}
              sessions={sessions}
              sessionRows={sessionRows}
            />

            <PriceValueChapter story={overview.story} />

            <EvidenceChapter report={report} />

            <SampleCompositionSection
              composition={report.sample_composition ?? null}
              number="06"
            />

            <MethodChapter
              report={report}
              firstSession={firstSession}
              lastSession={lastSession}
            />
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
