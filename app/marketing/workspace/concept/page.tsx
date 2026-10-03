import { ConceptReportDeck } from '@/components/conceptReport/ConceptReportDeck'
import { conceptReportFixture } from '@/lib/conceptReport/fixture'

export default function MarketingWorkspaceConceptPage() {
  return (
    <>
      <div className="mw-banner">
        Simulated concept study report — real portal renderer. Not a client study.
      </div>
      <ConceptReportDeck report={conceptReportFixture('marketing-preview')} />
    </>
  )
}
