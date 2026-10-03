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
    <>
      <div className="mw-banner">
        Simulated box report preview — preference after use and buy-again. Not a client study.
      </div>
      <ExperiencedReportDeck
        envelope={envelope}
        backHref="/marketing/workspace/home"
        variant="preview"
      />
    </>
  )
}
