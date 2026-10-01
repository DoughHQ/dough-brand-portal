import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { invoiceContactLabel, resolveInvoiceContact } from './invoiceContact'

/**
 * Who to invoice for an awaiting order. Service role only: auth emails are not
 * readable by the brand's session. Call this from the staff desk, never from
 * a brand checkout page.
 */
export async function fetchInvoiceContactLabels(
  missionIds: string[]
): Promise<Record<string, string>> {
  const ids = [...new Set(missionIds.filter(Boolean))]
  const labels: Record<string, string> = {}
  if (ids.length === 0) return labels

  const admin = createAdminSupabaseClient()
  const { data: missions } = await admin
    .from('missions')
    .select('id, created_by, brand_campaign_id')
    .in('id', ids)

  const campaignIds = [
    ...new Set((missions ?? []).map((row) => row.brand_campaign_id).filter((id): id is string => !!id)),
  ]
  const campaignEmail = new Map<string, string | null>()
  if (campaignIds.length > 0) {
    const { data: campaigns } = await admin
      .from('brand_campaigns')
      .select('id, primary_contact_email')
      .in('id', campaignIds)
    for (const campaign of campaigns ?? []) {
      campaignEmail.set(campaign.id, campaign.primary_contact_email)
    }
  }

  const submitterEmail = new Map<string, string | null>()
  const authorIds = [...new Set((missions ?? []).map((row) => row.created_by).filter(Boolean))]
  await Promise.all(
    authorIds.map(async (authorId) => {
      const { data, error } = await admin.auth.admin.getUserById(authorId)
      submitterEmail.set(authorId, error ? null : data.user?.email ?? null)
    })
  )

  const byMission = new Map((missions ?? []).map((row) => [row.id, row]))
  for (const id of ids) {
    const mission = byMission.get(id)
    const contact = resolveInvoiceContact({
      submitterEmail: mission ? (submitterEmail.get(mission.created_by) ?? null) : null,
      campaignEmail: mission?.brand_campaign_id
        ? (campaignEmail.get(mission.brand_campaign_id) ?? null)
        : null,
    })
    labels[id] = invoiceContactLabel(contact)
  }
  return labels
}
