import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import CheckoutClient from './CheckoutClient'
import CheckoutEmptyOrder from './emptyOrder/CheckoutEmptyOrder'
import { loadCheckoutPage } from './emptyOrder/loadCheckoutPage'
import './checkout.css'

type Props = {
  params: Promise<{ missionId: string }>
}

export default async function CheckoutPage({ params }: Props) {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { missionId } = await params
  const loaded = await loadCheckoutPage(missionId)
  if (!loaded) return <CheckoutEmptyOrder />

  return (
    <CheckoutClient
      order={loaded.order}
      designs={loaded.designs}
      products={loaded.products}
      email={loaded.email}
      fieldingDays={loaded.fieldingDays}
      expiresAt={loaded.expiresAt}
      missionStatus={loaded.missionStatus}
    />
  )
}
