import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { fetchCheckoutField, fetchStudyOrder } from '@/lib/checkout/load'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import CheckoutClient from './CheckoutClient'
import './checkout.css'

type Props = {
  params: Promise<{ missionId: string }>
}

export default async function CheckoutPage({ params }: Props) {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')

  const { missionId } = await params
  const supabase = await createServerSupabaseClient()
  const order = await fetchStudyOrder(supabase, missionId)

  if (!order) {
    return (
      <div className="checkout-page">
        <Link href="/studies" className="checkout-back">
          ← Studies
        </Link>
        <h1 className="checkout-title">No order</h1>
        <p className="checkout-lede">This study has no order you can see.</p>
      </div>
    )
  }

  const [{ data: userData }, field] = await Promise.all([
    supabase.auth.getUser(),
    fetchCheckoutField(supabase, missionId),
  ])

  return (
    <CheckoutClient
      order={order}
      designs={field.designs}
      products={field.products}
      email={userData.user?.email ?? null}
    />
  )
}
