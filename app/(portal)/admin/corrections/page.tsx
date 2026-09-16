import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { getPendingCorrectionReviewsPage } from '@/lib/corrections'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrandPortalChrome } from '@/lib/brandHome/fetchBrandPortalChrome.server'
import { parseCorrectionsDeskSearch } from '@/lib/correctionsDesk'
import CorrectionsReviewClient from './CorrectionsReviewClient'

export default async function AdminCorrectionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  const params = typeof (searchParams as { then?: unknown })?.then === 'function'
    ? await (searchParams as Promise<Record<string, string | string[] | undefined>>)
    : (searchParams as Record<string, string | string[] | undefined> | undefined)

  const desk = parseCorrectionsDeskSearch(params)

  const [page, scope] = await Promise.all([
    getPendingCorrectionReviewsPage({
      limit: 25,
      focusId: desk.focusId,
      productId: desk.productFilterId,
    }),
    getPortalBrandScope(),
  ])

  let workspaceBrandId: number | null = null
  let workspaceBrandName: string | null = null
  if (scope?.isImpersonating) {
    workspaceBrandId = scope.effectiveBrandId
    const chrome = await getBrandPortalChrome()
    workspaceBrandName = chrome?.brandName ?? null
  }

  return (
    <CorrectionsReviewClient
      initialRows={page.rows}
      initialHasMore={page.hasMore}
      initialCursor={page.nextCursor}
      focusId={desk.focusId}
      productFilterId={desk.productFilterId}
      workspaceBrandId={workspaceBrandId}
      workspaceBrandName={workspaceBrandName}
      renderedAt={Date.now()}
    />
  )
}
