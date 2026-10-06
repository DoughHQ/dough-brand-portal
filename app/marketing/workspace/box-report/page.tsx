import { ExperiencedReportDeck } from '@/components/experiencedReport/ExperiencedReportDeck'
import { marketingBoxReportEnvelope } from '@/lib/marketing/boxReportFixture'

type Props = {
  searchParams: Promise<{ legacy?: string }>
}

export default async function MarketingWorkspaceBoxReportPage({
  searchParams,
}: Props) {
  const envelope = marketingBoxReportEnvelope()
  const { legacy } = await searchParams
  if (!envelope) {
    return (
      <div className="mw-pad">
        <p>Fixture failed to parse.</p>
      </div>
    )
  }

  if (legacy === '1') {
    envelope.report.ihut_core = null
  }

  return (
    <ExperiencedReportDeck
      envelope={envelope}
      backHref="/marketing/workspace/home"
    />
  )
}
