import { notFound, redirect } from 'next/navigation'
import { getPortalBrandScope } from '@/lib/portal/getPortalBrandScope'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { fetchBoxDetail } from '@/lib/box/operatorDetail'
import BoxDetailClient from './BoxDetailClient'

export default async function BoxDetailPage({
  params,
}: {
  params: Promise<{ boxId: string }>
}) {
  const scope = await getPortalBrandScope()
  if (!scope) redirect('/login')
  if (scope.portalUser.role !== 'dough_admin' || scope.isImpersonating) {
    redirect('/studies')
  }
  const { boxId } = await params

  const supabase = await createServerSupabaseClient()
  const res = await fetchBoxDetail(supabase, boxId)
  if (!res.ok && res.notFound) notFound()
  if (!res.ok) {
    return <BoxDetailClient initialDetail={null} loadError={res.error} />
  }
  return <BoxDetailClient initialDetail={res.detail} loadError={null} />
}
