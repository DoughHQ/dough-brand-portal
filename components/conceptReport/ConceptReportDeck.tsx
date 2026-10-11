import type { ConceptMissionReport } from '@/lib/conceptReport/types'
import { isThinSampleReport, thinSampleBannerCopy } from '@/lib/conceptReport/copy'
import { SimulatedDataBanner } from './SimulatedDataBanner'
import { DeckQuestions } from './DeckQuestions'
import { DeckColdOpen } from './DeckColdOpen'
import { DeckVerdictNext } from './DeckVerdictNext'
import { DeckFieldCast } from './DeckFieldCast'
import { DeckMatchups } from './DeckMatchups'
import { DeckLadder } from './DeckLadder'
import { DeckTrust } from './DeckTrust'
import { DECK_WIDTH } from './conceptDeckShared'

export function ConceptReportDeck({
  report,
  backHref = '/studies',
  sampleMode = false,
}: {
  report: ConceptMissionReport
  backHref?: string
  /** Walkthrough sample — honesty lives on SampleReportFrame, not these banners. */
  sampleMode?: boolean
}) {
  const thin = isThinSampleReport(report)

  return (
    <div className="concept-report-deck" style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      {report.is_simulated === true && !sampleMode ? <SimulatedDataBanner /> : null}

      {thin && !sampleMode ? (
        <div
          className="concept-report-thin-banner"
          role="status"
          style={{
            background: 'var(--amber-soft)',
            borderBottom: '1px solid rgba(192, 120, 24, 0.28)',
            padding: '14px 28px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--amber)',
            fontWeight: 500,
          }}
        >
          <div style={{ maxWidth: DECK_WIDTH, margin: '0 auto' }}>
            {thinSampleBannerCopy(report.n_respondents)}
            {report.min_cluster_warning.trim() ? (
              <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 400, opacity: 0.92 }}>
                {report.min_cluster_warning}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <DeckColdOpen report={report} thin={thin} backHref={backHref} />
      {/* Verdict + next step before full cast — money slide above the fold */}
      <DeckVerdictNext report={report} thin={thin} />
      <DeckFieldCast field={report.win_rate_field} />
      <DeckMatchups report={report} />
      <DeckLadder field={report.win_rate_field} thin={thin} />
      <DeckQuestions questions={report.question_responses} thin={thin} />
      <DeckTrust report={report} />
    </div>
  )
}

/** @deprecated Use ConceptReportDeck */
export { ConceptReportDeck as ConceptReportMemo }
