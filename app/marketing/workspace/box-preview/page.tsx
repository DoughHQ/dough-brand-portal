import { ExperiencedReportDeck } from '@/components/experiencedReport/ExperiencedReportDeck'
import { marketingBoxReportEnvelope } from '@/lib/marketing/boxReportFixture'

/** Cropped box report for godough.co embeds — payoff only, not the full scroll. */
export default function MarketingWorkspaceBoxPreviewPage() {
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
      variant="preview"
    />
  )
}
