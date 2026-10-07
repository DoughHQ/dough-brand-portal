'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  buildShareLinkMessage,
  buildShareText,
  reportPrintTitle,
  type ReportSharePayload,
} from '@/lib/portal-ui/reportShare'
import styles from './reportStory.module.css'

type Props = {
  backHref: string
  backLabel?: string
  /** Shown in the toolbar eyebrow. */
  reportKind?: string
  share?: ReportSharePayload | null
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  return false
}

export function ReportToolbar({
  backHref,
  backLabel = 'Back to studies',
  reportKind = 'Decision report',
  share = null,
}: Props) {
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  const flash = useCallback((message: string) => setToast(message), [])

  const handleExport = useCallback(() => {
    const prev = document.title
    if (share?.productName) {
      document.title = reportPrintTitle({
        productName: share.productName,
        snapshotLabel: share.snapshotLabel,
      })
    }
    const restore = () => {
      document.title = prev
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.print()
    // Safari may not fire afterprint reliably — restore shortly after.
    window.setTimeout(restore, 1500)
  }, [share])

  const handleCopyLink = useCallback(async () => {
    const url =
      share?.url?.trim() ||
      (typeof window !== 'undefined' ? window.location.href : '')
    const ok = await writeClipboard(
      buildShareLinkMessage({
        productName: share?.productName ?? 'Product',
        finding: share?.finding ?? reportKind,
        url,
      }),
    )
    flash(ok ? 'Link copied — ready to forward' : 'Could not copy link')
  }, [share, reportKind, flash])

  const handleCopyFinding = useCallback(async () => {
    if (!share?.finding) {
      flash('No finding to copy yet')
      return
    }
    const url =
      share.url?.trim() ||
      (typeof window !== 'undefined' ? window.location.href : '')
    const ok = await writeClipboard(
      buildShareText({
        ...share,
        url,
      }),
    )
    flash(ok ? 'Finding copied' : 'Could not copy finding')
  }, [share, flash])

  return (
    <div className={`${styles.toolbar} no-print`}>
      <Link href={backHref} className={styles.backLink}>
        ← {backLabel}
      </Link>
      <div className={styles.toolbarActions}>
        <span className={styles.backLink}>{reportKind}</span>
        {share?.finding ? (
          <button
            type="button"
            className={styles.quietButton}
            onClick={() => void handleCopyFinding()}
          >
            Copy finding
          </button>
        ) : null}
        <button
          type="button"
          className={styles.quietButton}
          onClick={() => void handleCopyLink()}
        >
          Copy link
        </button>
        <button
          type="button"
          className={`${styles.quietButton} ${styles.primaryAction}`}
          onClick={handleExport}
        >
          Export PDF
        </button>
      </div>
      {toast ? (
        <div className={styles.toolbarToast} role="status">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
