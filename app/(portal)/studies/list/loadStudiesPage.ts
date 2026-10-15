import { getBrand } from '@/lib/queries'
import type { PortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { fetchOperatorStudiesPage } from '@/lib/studies/fetchOperatorStudies'
import { getWithdrawnStudies } from '@/lib/studies/fetchWithdrawnStudies'
import { listStudyDraftsAction } from '../drafts/actions'
import { attachOrderStatus } from '@/lib/checkout/load'
import { attachBoxIds } from '@/lib/box/brandFulfillment'
import { loadStaffCheckoutDesk } from '@/lib/checkout/loadStaffDesk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { operatorStudiesBrandId } from '@/lib/studies/operatorScope'
import { canPublishStudies } from '@/lib/studies/canPublishStudies'

export async function loadStudiesPage(scope: PortalBrandScope) {
  const { portalUser, effectiveBrandId, isImpersonating } = scope
  const canOperate = portalUser.role === 'dough_admin' && !isImpersonating
  const canEndStudies = canPublishStudies(portalUser)
  const brandId = operatorStudiesBrandId(scope)

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
  const [activeWithOrders, completeWithOrders] = await Promise.all([
    attachOrderStatus(supabase, activeResult.ok ? activeResult.page.rows : []),
    attachOrderStatus(supabase, completeResult.ok ? completeResult.page.rows : []),
  ])
  const [activeRows, completeRows] = await Promise.all([
    attachBoxIds(supabase, activeWithOrders),
    attachBoxIds(supabase, completeWithOrders),
  ])

  const desk = canOperate
    ? await loadStaffCheckoutDesk(supabase)
    : {
        awaitingOrders: [],
        refundsOwed: [],
        orderBrandNames: {},
        invoiceContactLabels: {},
        conceptUnitPriceCents: null,
        conceptCurrency: 'usd',
      }

  let brandName: string | null = 'Platform'
  if (!canOperate) {
    const brand = await getBrand(effectiveBrandId)
    if (!brand) return null
    brandName = brand.brand_name
  }

  const loadError =
    (!activeResult.ok ? activeResult.error : null) ??
    (!completeResult.ok ? completeResult.error : null)

  return {
    initialActive: activeRows,
    initialActiveHasMore: activeResult.ok ? activeResult.page.hasMore : false,
    initialActiveCursor: activeResult.ok ? activeResult.page.nextCursor : null,
    initialComplete: completeRows,
    initialCompleteHasMore: completeResult.ok ? completeResult.page.hasMore : false,
    initialCompleteCursor: completeResult.ok ? completeResult.page.nextCursor : null,
    withdrawn,
    drafts,
    effectiveBrandId,
    canOperate,
    canEndStudies,
    brandName,
    loadError,
    awaitingOrders: desk.awaitingOrders,
    refundsOwed: desk.refundsOwed,
    orderBrandNames: desk.orderBrandNames,
    invoiceContactLabels: desk.invoiceContactLabels,
    conceptUnitPriceCents: desk.conceptUnitPriceCents,
    conceptCurrency: desk.conceptCurrency,
  }
}
