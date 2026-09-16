import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { getBrandPendingCorrectionsPage } from '@/lib/corrections'
import { parseBrandCorrectionsSearch, correctionsDeskHref } from '@/lib/correctionsDesk'
import BrandCorrectionsClient from './BrandCorrectionsClient'

export default async function BrandCorrectionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}) {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { portalUser, isImpersonating } = scope
  const params = typeof (searchParams as { then?: unknown })?.then === 'function'
    ? await (searchParams as Promise<Record<string, string | string[] | undefined>>)
    : (searchParams as Record<string, string | string[] | undefined> | undefined)

  const { focusId } = parseBrandCorrectionsSearch(params)

  if (portalUser.role === 'dough_admin' && !isImpersonating) {
    redirect(correctionsDeskHref({ focusId }))
  }

  const page = await getBrandPendingCorrectionsPage({
    limit: 25,
    focusId,
  })

  return (
    <BrandCorrectionsClient
      initialRows={page.rows}
      initialHasMore={page.hasMore}
      initialCursor={page.nextCursor}
      pendingCount={page.pendingCount ?? page.rows.length}
      focusId={focusId}
      canReviewInOps={portalUser.role === 'dough_admin' && isImpersonating}
      renderedAt={Date.now()}
    />
  )
}
