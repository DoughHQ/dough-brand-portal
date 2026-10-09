import BrandHome from '@/components/brandHome/BrandHome'
import '@/components/brandHome/brandHome.css'
import { marketingHomeModel } from '@/lib/marketing/workspaceFixtures'

export default function MarketingWorkspaceHomePage() {
  return (
    <>
      <div className="mw-banner">Simulated brand home — for itsarunoff.com. Not a live account.</div>
      <div className="mw-pad">
        <BrandHome
          model={marketingHomeModel}
          totalProductCount={42}
          totalBattles={1840}
          catalogReady
          domainVerified
        />
      </div>
    </>
  )
}
