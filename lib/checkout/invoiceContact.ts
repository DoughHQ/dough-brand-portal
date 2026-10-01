export type InvoiceContact = {
  email: string | null
  source: 'submitter' | 'campaign' | 'none'
}

/** Submitter email wins. Campaign contact is the fallback. Neither is a guess. */
export function resolveInvoiceContact(args: {
  submitterEmail: string | null
  campaignEmail: string | null
}): InvoiceContact {
  const submitter = args.submitterEmail?.trim() || null
  if (submitter) return { email: submitter, source: 'submitter' }
  const campaign = args.campaignEmail?.trim() || null
  if (campaign) return { email: campaign, source: 'campaign' }
  return { email: null, source: 'none' }
}

export function invoiceContactLabel(contact: InvoiceContact): string {
  if (contact.source === 'campaign' && contact.email) {
    return `Campaign contact · ${contact.email}`
  }
  if (contact.source === 'submitter' && contact.email) return contact.email
  return 'No email on file'
}
