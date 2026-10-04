import type { PrototypeListItem, PrototypePackaging } from '@/lib/prototypes/types'
import type { BoxFieldRow } from './types'
import { createEmptyBoxFieldRow } from './defaults'

/** Apply a library prototype onto a seat. Clears catalog identity fields. */
export function applyPrototypeToSeat(
  row: BoxFieldRow,
  item: PrototypeListItem,
  opts?: { imageUrl?: string | null; role?: BoxFieldRow['role'] }
): BoxFieldRow {
  const packaging: PrototypePackaging =
    item.packaging === 'plain_sample' ? 'plain_sample' : 'final_packaging'
  const price =
    item.planned_price != null &&
    Number.isFinite(item.planned_price) &&
    item.planned_price > 0
      ? item.planned_price
      : null

  return {
    ...row,
    kind: 'prototype',
    role: opts?.role ?? row.role,
    product_id: null,
    prototype_id: item.id,
    packaging,
    price,
    prototypeSnapshot: item,
    frozen_display_name: item.name,
    frozen_brand_name: item.internal_label?.trim() || '',
    frozen_image_url: opts?.imageUrl ?? row.frozen_image_url,
    taxonomy_node_id: item.taxonomy_node_id,
    l2_node_id: null,
    upc: null,
    barcodeOptions: [],
    frozen_category: item.category_label,
    identityConfirmed: false,
    allergensContains: null,
    allergensMayContain: null,
    allergensConfirmed: false,
    allergensCatalogStatus: null,
  }
}

/** New prototype seat from a library pick (defaults to competitor). */
export function createPrototypeSeatFromItem(
  item: PrototypeListItem,
  opts?: { imageUrl?: string | null; role?: BoxFieldRow['role'] }
): BoxFieldRow {
  return applyPrototypeToSeat(createEmptyBoxFieldRow(), item, opts)
}

/** Strip prototype identity when switching a seat back to catalog. */
export function clearPrototypeFromSeat(row: BoxFieldRow): BoxFieldRow {
  return {
    ...row,
    kind: 'product',
    prototype_id: null,
    prototypeSnapshot: null,
    packaging: 'final_packaging',
    price: null,
  }
}

/** Strip catalog identity when switching a seat to unresolved prototype. */
export function clearCatalogFromSeat(row: BoxFieldRow): BoxFieldRow {
  return {
    ...row,
    kind: 'prototype',
    product_id: null,
    prototype_id: null,
    prototypeSnapshot: null,
    upc: null,
    barcodeOptions: [],
    frozen_display_name: '',
    frozen_brand_name: '',
    frozen_image_url: null,
    frozen_category: null,
    identityConfirmed: false,
    allergensContains: null,
    allergensMayContain: null,
    allergensConfirmed: false,
    allergensCatalogStatus: null,
    packaging: row.packaging === 'plain_sample' ? 'plain_sample' : 'final_packaging',
  }
}
