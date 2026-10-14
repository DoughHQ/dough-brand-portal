import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { fetchInvoiceContactLabels } from '@/lib/checkout/invoiceContact.server'
import {
  fetchAwaitingOrders,
  fetchConceptPrice,
  fetchRefundsOwed,
} from '@/lib/checkout/load'
import type { StudyOrderRow } from '@/lib/checkout/payment'

type Client = SupabaseClient<Database>

export type StaffCheckoutDesk = {
  awaitingOrders: StudyOrderRow[]
  refundsOwed: StudyOrderRow[]
  orderBrandNames: Record<number, string>
  invoiceContactLabels: Record<string, string>
  conceptUnitPriceCents: number | null
  conceptCurrency: string
}

export async function loadStaffCheckoutDesk(supabase: Client): Promise<StaffCheckoutDesk> {
  const [orders, owed, price] = await Promise.all([
    fetchAwaitingOrders(supabase),
    fetchRefundsOwed(supabase),
    fetchConceptPrice(supabase),
  ])
  const brandIds = [...new Set([...orders, ...owed].map((order) => order.brand_id))]
  const [brandsResult, contacts] = await Promise.all([
    brandIds.length > 0
      ? supabase.from('brands').select('brand_id, brand_name').in('brand_id', brandIds)
      : Promise.resolve({ data: [] as { brand_id: number; brand_name: string }[] }),
    fetchInvoiceContactLabels(orders.map((order) => order.mission_id)),
  ])
  const orderBrandNames: Record<number, string> = {}
  for (const brand of brandsResult.data ?? []) {
    orderBrandNames[brand.brand_id] = brand.brand_name
  }
  return {
    awaitingOrders: orders,
    refundsOwed: owed,
    orderBrandNames,
    invoiceContactLabels: contacts,
    conceptUnitPriceCents: price?.unit_price_cents ?? null,
    conceptCurrency: price?.currency ?? 'usd',
  }
}
