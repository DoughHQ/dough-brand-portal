import { redirect } from 'next/navigation'
import { getAdminHomeSnapshot } from '@/lib/adminHome/fetchAdminHomeSnapshot.server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrandHomeSnapshot } from '@/lib/brandHome/fetchBrandHomeSnapshot.server'
import { brandHomeSnapshotMode } from '@/lib/flags'
import { perfLog, perfNow, timed } from '@/lib/perf'
import DashboardClient from './DashboardClient'
import AdminDashboardClient from './AdminDashboardClient'
import BrandHomeUnavailable from './BrandHomeUnavailable'

function isAuthError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /auth|session|jwt|not authenticated|login/i.test(msg)
}

function isNoBrandError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /no_effective_brand/i.test(msg)
}

export default async function DashboardPage() {
  const tPage = perfNow()
  try {
    const scope = await getPortalBrandScope()
    if (!scope) redirect('/login')

    const { portalUser, effectiveBrandId, isImpersonating } = scope

    if (portalUser.role === 'dough_admin' && !isImpersonating) {
      const snapshot = await timed('dashboard.adminHome', () => getAdminHomeSnapshot())
      perfLog('dashboard.page.total', perfNow() - tPage, { shell: 'platform' })
      return <AdminDashboardClient snapshot={snapshot} />
    }

    // Kill-switch off → fail closed (no legacy fan-out).
    if (brandHomeSnapshotMode() === 'off') {
      return (
        <BrandHomeUnavailable
          reason="rpc_failed"
          detail="DOUGH_BRAND_HOME_SNAPSHOT=off (fail closed — legacy fan-out removed)"
        />
      )
    }

    const doc = await getBrandHomeSnapshot()
    if (!doc) {
      perfLog('dashboard.page.total', perfNow() - tPage, {
        shell: 'brand',
        mode: 'on',
        error: 'rpc_failed',
      })
      return <BrandHomeUnavailable reason="rpc_failed" />
    }

    perfLog('dashboard.page.total', perfNow() - tPage, {
      shell: 'brand',
      mode: 'on',
      brandId: effectiveBrandId,
      productCount: doc.pulse.productCount,
      singleRpc: true,
    })

    return (
      <DashboardClient
        portalUser={portalUser}
        brand={doc.brand}
        subscription={null}
        snapshot={doc.snapshot}
        history={[]}
        productIntelligence={[]}
        competitive={null}
        allProducts={[]}
        narrative={doc.narrative}
        totalProductCount={doc.pulse.productCount}
        totalBattles={doc.pulse.totalBattles}
        isImpersonating={isImpersonating}
        homeModel={doc.homeModel}
        categoriesCount={doc.pulse.categoryCount}
        signalCards={doc.signalCards}
        domainVerified={doc.pulse.domainVerified}
        catalogHealth={doc.catalogHealth}
        claimedSkuCount={doc.chrome.claimedSkuCount}
        catalogReady={doc.catalogReady}
      />
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    if (isAuthError(error)) redirect('/login')
    if (isNoBrandError(error)) {
      return <BrandHomeUnavailable reason="no_effective_brand" detail={String(error)} />
    }
    return (
      <BrandHomeUnavailable
        reason="unknown"
        detail={error instanceof Error ? error.message : String(error)}
      />
    )
  }
}
