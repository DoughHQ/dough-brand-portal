import { redirect } from 'next/navigation'
import { fetchStudyOrder } from '@/lib/checkout/load'
import { checkoutHref } from '@/lib/checkout/status'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ConceptStudyStatusActions from './status/ConceptStudyStatusActions'
import ConceptStudyStatusHeading from './status/ConceptStudyStatusHeading'

type Props = {
  params: Promise<{ missionId: string }>
}

/** After payment, the study page. An unpaid order goes to checkout. */
export default async function ConceptStudyStatusPage({ params }: Props) {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { missionId } = await params
  const supabase = await createServerSupabaseClient()
  const order = await fetchStudyOrder(supabase, missionId)
  if (order?.status === 'awaiting_payment') {
    redirect(checkoutHref(missionId))
  }

  const live = order?.status === 'paid' || order?.status === 'waived'
  const reportHref = `/studies/concept/${missionId}/report`

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 640,
        margin: '0 auto',
        padding: '64px 28px',
      }}
    >
      <ConceptStudyStatusHeading live={live} />
      <ConceptStudyStatusActions live={live} reportHref={reportHref} />
    </div>
  )
}
