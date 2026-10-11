import './experiencedReport.css'
import type { ExperiencedReportEnvelope } from '@/lib/experiencedReport/types'
import { isIhutCoreReport } from '@/lib/experiencedReport/ihutCoreTypes'
import { SimulatedDataBanner } from '@/components/conceptReport/SimulatedDataBanner'
import { ReportSectionRail } from './ReportSectionRail'
import { ExecutiveSummaryStrip } from './ExecutiveSummaryStrip'
import { IhutStoryReport } from './IhutStoryReport'
import { ExperiencedStoryReport } from './ExperiencedStoryReport'
import { LegacyDeckColdOpen } from './LegacyDeckColdOpen'
import { LegacyVerdictSection } from './LegacyVerdictSection'
import { LegacyDriversSection } from './LegacyDriversSection'
import { LegacyFieldSection } from './LegacyFieldSection'
import { LegacyAttributeImportanceSection } from './LegacyAttributeImportanceSection'
import { LegacyLoyaltySection } from './LegacyLoyaltySection'
import { LegacyRankValidationSection } from './LegacyRankValidationSection'
import { LegacyLiftSection } from './LegacyLiftSection'
import { LegacyTrustSection } from './LegacyTrustSection'
import { collectMethodNotes, notesFor } from './legacyMethodNotes'

export function ExperiencedReportDeck({
  envelope,
  backHref = '/studies',
  variant = 'full',
}: {
  envelope: ExperiencedReportEnvelope
  backHref?: string
  /** Marketing crop: cold open + exec strip + loyalty only. */
  variant?: 'full' | 'preview'
}) {
  const { report } = envelope

  if (isIhutCoreReport(report.ihut_core)) {
    return (
      <IhutStoryReport
        envelope={envelope}
        report={report.ihut_core}
        backHref={backHref}
        variant={variant}
      />
    )
  }

  if (!report.ihut_core) {
    return (
      <ExperiencedStoryReport
        envelope={envelope}
        backHref={backHref}
        variant={variant}
      />
    )
  }

  const sectionNotes = collectMethodNotes(envelope)

  if (variant === 'preview') {
    return (
      <div className="experienced-report-deck concept-report-deck">
        {envelope.is_simulated === true ? <SimulatedDataBanner /> : null}
        <div
          className="experienced-report-document"
          style={{ padding: '20px 24px 32px' }}
        >
          <LegacyDeckColdOpen envelope={envelope} backHref={backHref} />
          <ExecutiveSummaryStrip envelope={envelope} />
          <div
            className="report-row report-row--full"
            style={{ marginTop: 20 }}
          >
            <div className="report-span-12">
              <LegacyLoyaltySection
                data={report.repurchase_intent}
                notes={notesFor(sectionNotes, 5)}
              />
            </div>
          </div>
          <p
            className="no-print"
            style={{
              margin: '20px 0 0',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
            }}
          >
            <a
              href="/marketing/workspace/box-report"
              style={{
                color: 'var(--heading)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Open full report preview →
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="experienced-report-deck concept-report-deck">
      {envelope.is_simulated === true ? <SimulatedDataBanner /> : null}

      <div className="experienced-report-frame">
        <ReportSectionRail />
        <div className="experienced-report-document">
          <LegacyDeckColdOpen envelope={envelope} backHref={backHref} />
          <ExecutiveSummaryStrip envelope={envelope} />

          <div className="report-row report-row--7-5">
            <div className="report-span-7">
              <LegacyVerdictSection
                envelope={envelope}
                notes={notesFor(sectionNotes, 1)}
              />
            </div>
            <div className="report-span-5">
              <LegacyDriversSection
                drivers={report.choice_drivers}
                notes={notesFor(sectionNotes, 2)}
              />
            </div>
          </div>

          <div className="report-row report-row--2up">
            <div className="report-span-6">
              <LegacyFieldSection
                rows={report.per_opponent}
                focalName={report.focal_product.name}
                notes={notesFor(sectionNotes, 3)}
              />
            </div>
            <div className="report-span-6">
              <LegacyAttributeImportanceSection
                data={report.attribute_importance}
                notes={notesFor(sectionNotes, 4)}
              />
            </div>
          </div>

          <div className="report-row report-row--2up">
            <div className="report-span-6">
              <LegacyLoyaltySection
                data={report.repurchase_intent}
                notes={notesFor(sectionNotes, 5)}
              />
            </div>
            <div className="report-span-6">
              <LegacyRankValidationSection
                data={report.rank_validation}
                notes={notesFor(sectionNotes, 6)}
              />
            </div>
          </div>

          <div className="report-row report-row--full">
            <div className="report-span-12">
              <LegacyLiftSection
                lift={report.experience_lift_vs_baseline}
                notes={notesFor(sectionNotes, 7)}
              />
            </div>
          </div>

          <div className="report-row report-row--full">
            <div className="report-span-12">
              <LegacyTrustSection
                envelope={envelope}
                sectionNotes={sectionNotes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
