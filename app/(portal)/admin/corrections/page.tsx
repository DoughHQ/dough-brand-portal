import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPortalUser } from '@/lib/queries'
import { getPendingCorrectionReviews } from '@/lib/corrections'
import CorrectionsReviewClient from './CorrectionsReviewClient'

export default async function AdminCorrectionsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const portalUser = await getPortalUser()
  if (!portalUser || portalUser.role !== 'dough_admin') redirect('/dashboard')

  const rows = await getPendingCorrectionReviews()

  return <CorrectionsReviewClient initialRows={rows} />
}
