import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { getPendingCorrectionReviewsPage } from '@/lib/corrections'
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

  const focusRaw = params?.focus
  const productRaw = params?.product
  const focusId = Array.isArray(focusRaw) ? focusRaw[0] : focusRaw
  const productIdStr = Array.isArray(productRaw) ? productRaw[0] : productRaw
  const productId =
    productIdStr && Number.isFinite(Number(productIdStr)) ? Number(productIdStr) : null

  const page = await getPendingCorrectionReviewsPage({
    limit: 25,
    focusId: focusId || null,
    productId,
  })

  return (
    <CorrectionsReviewClient
      initialRows={page.rows}
      initialHasMore={page.hasMore}
      initialCursor={page.nextCursor}
      focusId={focusId || null}
      productId={productId}
    />
  )
}
