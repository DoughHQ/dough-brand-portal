import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import StudiesClient from './StudiesClient'
import { loadStudiesPage } from './list/loadStudiesPage'

export default async function StudiesPage() {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const loaded = await loadStudiesPage(scope)
  if (!loaded) redirect('/login')

  return (
    <StudiesClient
      initialActive={loaded.initialActive}
      initialActiveHasMore={loaded.initialActiveHasMore}
      initialActiveCursor={loaded.initialActiveCursor}
      initialComplete={loaded.initialComplete}
      initialCompleteHasMore={loaded.initialCompleteHasMore}
      initialCompleteCursor={loaded.initialCompleteCursor}
      withdrawn={loaded.withdrawn}
      drafts={loaded.drafts}
      effectiveBrandId={loaded.effectiveBrandId}
      canOperate={loaded.canOperate}
      brandName={loaded.brandName}
      loadError={loaded.loadError}
      awaitingOrders={loaded.awaitingOrders}
      orderBrandNames={loaded.orderBrandNames}
      invoiceContactLabels={loaded.invoiceContactLabels}
      conceptUnitPriceCents={loaded.conceptUnitPriceCents}
      conceptCurrency={loaded.conceptCurrency}
    />
  )
}
