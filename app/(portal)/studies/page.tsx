import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrand } from '@/lib/queries'
import { fetchOperatorStudiesPage } from '@/lib/studies/fetchOperatorStudies'
import { getWithdrawnStudies } from '@/lib/studies/fetchWithdrawnStudies'
import { listStudyDraftsAction } from './drafts/actions'
import { fetchAwaitingOrders, fetchConceptPrice, attachOrderStatus } from '@/lib/checkout/load'
import { fetchInvoiceContactLabels } from '@/lib/checkout/invoiceContact.server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import StudiesClient from './StudiesClient'

export default async function StudiesPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, effectiveBrandId, isImpersonating } = scope
  const canOperate = portalUser.role === 'dough_admin' && !isImpersonating
  const brandId = canOperate ? null : effectiveBrandId

  const [activeResult, completeResult, withdrawn, draftsResult] = await Promise.all([
    fetchOperatorStudiesPage({
      tab: 'active',
      limit: 25,
      brandId,
      includeDrafts: false,
    }),
    fetchOperatorStudiesPage({
      tab: 'complete',
      limit: 25,
      brandId,
      includeDrafts: false,
    }),
    canOperate ? getWithdrawnStudies() : Promise.resolve([]),
    listStudyDraftsAction(),
  ])

  const drafts = (draftsResult.ok ? draftsResult.drafts : [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

  const supabase = await createServerSupabaseClient()
  const [activeRows, completeRows] = await Promise.all([
    attachOrderStatus(supabase, activeResult.ok ? activeResult.page.rows : []),
    attachOrderStatus(supabase, completeResult.ok ? completeResult.page.rows : []),
  ])

  let awaitingOrders: Awaited<ReturnType<typeof fetchAwaitingOrders>> = []
  let orderBrandNames: Record<number, string> = {}
  let invoiceContactLabels: Record<string, string> = {}
  let conceptUnitPriceCents: number | null = null
  let conceptCurrency = 'usd'
  if (canOperate) {
    const [orders, price] = await Promise.all([
      fetchAwaitingOrders(supabase),
      fetchConceptPrice(supabase),
    ])
    awaitingOrders = orders
    conceptUnitPriceCents = price?.unit_price_cents ?? null
    conceptCurrency = price?.currency ?? 'usd'
    const brandIds = [...new Set(orders.map((order) => order.brand_id))]
    const [brandsResult, contacts] = await Promise.all([
      brandIds.length > 0
        ? supabase.from('brands').select('brand_id, brand_name').in('brand_id', brandIds)
        : Promise.resolve({ data: [] as { brand_id: number; brand_name: string }[] }),
      fetchInvoiceContactLabels(orders.map((order) => order.mission_id)),
    ])
    invoiceContactLabels = contacts
    for (const brand of brandsResult.data ?? []) {
      orderBrandNames[brand.brand_id] = brand.brand_name
    }
  }

  let brandName: string | null = 'Platform'
  if (!canOperate) {
    const brand = await getBrand(effectiveBrandId)
    if (!brand) redirect('/login')
    brandName = brand.brand_name
  }

  const loadError =
    (!activeResult.ok ? activeResult.error : null) ??
    (!completeResult.ok ? completeResult.error : null)

  return (
    <StudiesClient
      initialActive={activeRows}
      initialActiveHasMore={activeResult.ok ? activeResult.page.hasMore : false}
      initialActiveCursor={activeResult.ok ? activeResult.page.nextCursor : null}
      initialComplete={completeRows}
      initialCompleteHasMore={completeResult.ok ? completeResult.page.hasMore : false}
      initialCompleteCursor={completeResult.ok ? completeResult.page.nextCursor : null}
      withdrawn={withdrawn}
      drafts={drafts}
      effectiveBrandId={effectiveBrandId}
      canOperate={canOperate}
      brandName={brandName}
      loadError={loadError}
      awaitingOrders={awaitingOrders}
      orderBrandNames={orderBrandNames}
      invoiceContactLabels={invoiceContactLabels}
      conceptUnitPriceCents={conceptUnitPriceCents}
      conceptCurrency={conceptCurrency}
    />
  )
}
