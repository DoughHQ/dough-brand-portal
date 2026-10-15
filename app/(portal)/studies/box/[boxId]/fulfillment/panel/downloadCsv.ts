import { brandFulfillmentsToCsv, type BrandFulfillmentRow } from '@/lib/box/brandFulfillment'

export function downloadCsv(rows: BrandFulfillmentRow[], boxId: string) {
  const csv = brandFulfillmentsToCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `packing-labels-${boxId.slice(0, 8)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
