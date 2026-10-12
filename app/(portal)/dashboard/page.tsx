import { redirect } from 'next/navigation'
import { getAdminHomeSnapshot } from '@/lib/adminHome/fetchAdminHomeSnapshot.server'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrandHomeSnapshot } from '@/lib/brandHome/fetchBrandHomeSnapshot.server'
import { brandHomeSnapshotMode } from '@/lib/flags'
import { perfLog, perfNow, timed } from '@/lib/perf'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logHandledRpcFailure } from '@/lib/portal/logHandledRpcFailure'
import type { OnboardingChecklistInput } from '@/lib/brandHome/onboardingChecklist'
import DashboardClient from './DashboardClient'
import AdminDashboardClient from './AdminDashboardClient'
import BrandHomeUnavailable from './BrandHomeUnavailable'

export const dynamic = 'force-dynamic'

function isAuthError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /auth|session|jwt|not authenticated|login/i.test(msg)
}

function isNoBrandError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /no_effective_brand/i.test(msg)
}

async function headCount(
  label: string,
  brandId: number,
  run: () => Promise<{ count: number | null; error: { code?: string; message?: string; details?: string; hint?: string } | null }>
): Promise<number> {
  try {
    const { count, error } = await run()
    if (error) {
      logHandledRpcFailure(label, {
        code: error.code ?? null,
        message: error.message ?? null,
        details: error.details ?? null,
        hint: error.hint ?? null,
        brandId,
      })
      return 0
    }
    return count ?? 0
  } catch (err) {
    logHandledRpcFailure(label, {
      code: null,
      message: err instanceof Error ? err.message : String(err),
      details: null,
      hint: null,
      brandId,
    })
    return 0
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const tPage = perfNow()
  try {
    const scope = await getPortalBrandScope()
    if (!scope) redirect('/login')

    const { portalUser, effectiveBrandId, isImpersonating } = scope
    const params = searchParams ? await searchParams : undefined
    const welcomeRaw = params?.welcome
    const welcome =
      welcomeRaw === '1' || (Array.isArray(welcomeRaw) && welcomeRaw[0] === '1')

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

    const showChecklist =
      portalUser.onboarding_completed === false &&
      portalUser.role !== 'dough_admin' &&
      !isImpersonating

    let onboardingChecklist: OnboardingChecklistInput | null = null
    if (showChecklist && effectiveBrandId != null) {
      const supabase = await createServerSupabaseClient()
      const [prototypeCount, draftCount] = await Promise.all([
        headCount('brand_prototypes_count', effectiveBrandId, async () => {
          const res = await supabase
            .from('brand_prototypes')
            .select('*', { count: 'exact', head: true })
            .eq('brand_id', effectiveBrandId)
            .is('archived_at', null)
          return { count: res.count, error: res.error }
        }),
        headCount('study_drafts_count', effectiveBrandId, async () => {
          const res = await supabase
            .from('study_drafts')
            .select('*', { count: 'exact', head: true })
            .eq('brand_id', effectiveBrandId)
          return { count: res.count, error: res.error }
        }),
      ])

      onboardingChecklist = {
        brandName: doc.brand.brand_name_display ?? doc.brand.brand_name,
        logoUrl: doc.brand.logo_url,
        websiteUrl: doc.brand.brand_website_url,
        aboutText: doc.brand.about_text,
        productCount: doc.pulse.productCount,
        prototypeCount,
        openStudies: doc.homeModel.openStudiesCount,
        draftCount,
      }
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
        onboardingChecklist={onboardingChecklist}
        welcome={welcome}
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
