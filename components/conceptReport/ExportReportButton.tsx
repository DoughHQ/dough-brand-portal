'use client'

import { useCallback } from 'react'
import { PRODUCT_NAME } from '@/lib/brand'

/** Legacy deck control — prefer ReportToolbar on story reports. */
export function ExportReportButton({
  productName,
  snapshotLabel,
}: {
  productName?: string
  snapshotLabel?: string | null
} = {}) {
  const handleExport = useCallback(() => {
    const prev = document.title
    if (productName) {
      document.title = snapshotLabel
        ? `${productName} · ${PRODUCT_NAME} decision report · ${snapshotLabel}`
        : `${productName} · ${PRODUCT_NAME} decision report`
    }
    const restore = () => {
      document.title = prev
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.print()
    window.setTimeout(restore, 1500)
  }, [productName, snapshotLabel])

  return (
    <button
      type="button"
      className="portal-btn portal-btn-cta no-print"
      onClick={handleExport}
      style={{ minHeight: 36, padding: '0 14px', fontSize: 13 }}
    >
      Export PDF
    </button>
  )
}
