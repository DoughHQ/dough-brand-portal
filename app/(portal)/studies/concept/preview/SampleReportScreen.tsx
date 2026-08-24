import Link from 'next/link'
import { ConceptReportDeck } from '@/components/conceptReport/ConceptReportDeck'
import type { ConceptMissionReport } from '@/lib/conceptReport/types'
import SampleReportFrame from './SampleReportFrame'

type Props = {
  report: ConceptMissionReport
  editHref: string
  onBackToRecap: () => void
}

export default function SampleReportScreen({
  report,
  editHref,
  onBackToRecap,
}: Props) {
  return (
    <div className="cpw-sample">
      <SampleReportFrame>
        <ConceptReportDeck report={report} backHref={editHref} sampleMode />
      </SampleReportFrame>
      <footer className="cpw-sample-footer">
        <Link className="cpw-next cpw-recap-cta" href={editHref}>
          Back to your study
        </Link>
        <button type="button" className="cpw-back" onClick={onBackToRecap}>
          Back to the recap
        </button>
      </footer>
    </div>
  )
}
