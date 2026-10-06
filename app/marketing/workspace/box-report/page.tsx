import { ExperiencedReportDeck } from '@/components/experiencedReport/ExperiencedReportDeck'
import { marketingBoxReportEnvelope } from '@/lib/marketing/boxReportFixture'

export default function MarketingWorkspaceBoxReportPage() {
  const envelope = marketingBoxReportEnvelope()
  if (!envelope) {
    return (
      <div className="mw-pad">
        <p>Fixture failed to parse.</p>
      </div>
    )
  }

  return (
    <ExperiencedReportDeck
      envelope={envelope}
      backHref="/marketing/workspace/home"
    />
  )
}
