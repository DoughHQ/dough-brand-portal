import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { fetchUnlockedCategoryL2Ids } from '@/lib/brandCategories'
import { fetchCategoryReport } from '@/lib/categoryReport/fetch'
import {
  fetchBrandCategoryProductsByL2,
  fetchTaxonomyNodeDisplayName,
} from '@/lib/categoryProductsByL2.server'
import CategoryDashboardCanvas from '@/components/categoryDashboard/CategoryDashboardCanvas'
import LockedCategoryPreview from '@/components/categories/LockedCategoryPreview'

type Props = {
  params: Promise<{ scopeId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function one(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : ''
}

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

export default async function BrandCategoryOverviewPage({ params, searchParams }: Props) {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope
  if (portalUser.role === 'dough_admin' && !isImpersonating) {
    redirect('/admin/report-preview')
  }

  const { scopeId: scopeIdRaw } = await params
  const sp = await searchParams
  const scopeId = parseId(scopeIdRaw)
  const focal = parseId(one(sp.focal))

  if (scopeId == null) notFound()

  const unlockedIds = await fetchUnlockedCategoryL2Ids(effectiveBrandId)
  if (!unlockedIds.includes(scopeId)) {
    const [productsResult, nodeName] = await Promise.all([
      fetchBrandCategoryProductsByL2({
        l2NodeId: scopeId,
        brandId: effectiveBrandId,
      }),
      fetchTaxonomyNodeDisplayName(scopeId),
    ])
    return (
      <LockedCategoryPreview
        categoryName={nodeName ?? `Category ${scopeId}`}
        products={productsResult.products}
        loadFailed={!productsResult.ok}
      />
    )
  }

  const result = await fetchCategoryReport({
    scope: 'l2',
    scopeId,
    focalProductId: focal,
    mode: 'brand',
  })

  if (result.ok === false && result.code === 'ADMIN_ONLY') {
    redirect('/dashboard')
  }

  if (!result.ok) {
    return (
      <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 32px', fontFamily: 'var(--font-sans)' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, margin: '0 0 8px' }}>
          Couldn’t load that category
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, margin: '0 0 20px' }}>
          {result.detail ?? 'The report payload was incomplete. No ranking was invented.'}
        </p>
        <Link href="/categories" style={{ fontSize: 13, color: 'var(--sage)', fontWeight: 500 }}>
          ← Back to categories
        </Link>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', minHeight: '100%', background: 'var(--surface)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 32px 0' }}>
        <Link
          href="/categories"
          style={{
            fontSize: 13,
            color: 'var(--ink-50)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          ← Categories
        </Link>
      </div>
      <CategoryDashboardCanvas report={result.report} linkMode="brand" />
    </div>
  )
}
