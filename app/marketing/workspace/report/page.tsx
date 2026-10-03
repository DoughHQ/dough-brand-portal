import { ConceptTestReportDeck } from '@/components/conceptReport/ConceptTestReportDeck'
import { parseConceptTestReport } from '@/lib/conceptReport/conceptTestTypes'
import conceptTestFixture from '../../../../concept-core-fixtures/report_concept_test.json'

export default function MarketingWorkspaceReportPage() {
  const report = parseConceptTestReport(conceptTestFixture)
  if (!report) {
    return (
      <div className="mw-pad">
        <p>Fixture failed to parse.</p>
      </div>
    )
  }

  return (
    <>
      <div className="mw-banner">
        Simulated concept report — real portal renderer, fixture data. Not a client study.
      </div>
      <ConceptTestReportDeck report={report} backHref="/marketing/workspace/home" />
    </>
  )
}
