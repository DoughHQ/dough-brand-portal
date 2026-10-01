import { describe, expect, it } from 'vitest'
import { invoiceContactLabel, resolveInvoiceContact } from '../invoiceContact'

describe('invoice contact', () => {
  it('uses the submitter email when the study records one', () => {
    const contact = resolveInvoiceContact({
      submitterEmail: 'brand@example.com',
      campaignEmail: 'campaign@example.com',
    })
    expect(invoiceContactLabel(contact)).toBe('brand@example.com')
  })

  it('falls back to the campaign contact', () => {
    const contact = resolveInvoiceContact({
      submitterEmail: null,
      campaignEmail: 'finance@example.com',
    })
    expect(invoiceContactLabel(contact)).toBe('Campaign contact · finance@example.com')
  })

  it('says when neither address is on file', () => {
    const contact = resolveInvoiceContact({ submitterEmail: '  ', campaignEmail: null })
    expect(invoiceContactLabel(contact)).toBe('No email on file')
  })
})
