'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import EndStudyDialog, {
  endStudySuccessToast,
} from '@/app/(portal)/studies/components/EndStudyDialog'
import type { StudyReportStatus } from '@/lib/studies/studyReportStatus'

type Props = {
  missionId: string
  title: string
  status: StudyReportStatus
  backHref: string
  packingHref?: string | null
}

export default function StudyReportStatusCard({
  missionId,
  title,
  status,
  backHref,
  packingHref = null,
}: Props) {
  const router = useRouter()
  const [endOpen, setEndOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '64px 28px',
        fontFamily: 'var(--font-sans)',
        background: 'var(--surface)',
        minHeight: '100vh',
      }}
    >
      <Link
        href={backHref}
        style={{ fontSize: 12, color: 'var(--ink-faint)', textDecoration: 'none' }}
      >
        ← Back to studies
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 400,
          margin: '16px 0 12px',
          color: 'var(--ink)',
        }}
      >
        {status.title}
      </h1>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--ink-muted)',
          margin: 0,
        }}
      >
        {status.body}
      </p>

      {status.progressRatio != null ? (
        <div className="studies-progress-track" style={{ marginTop: 20 }}>
          <div
            className="studies-progress-fill"
            style={{ width: `${Math.round(status.progressRatio * 100)}%` }}
          />
        </div>
      ) : null}

      {status.orderLine ? (
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--ink)',
            margin: '16px 0 0',
          }}
        >
          {status.orderLine}
        </p>
      ) : null}

      {packingHref || status.showEndStudy ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
          {packingHref ? (
            <Link href={packingHref} className="portal-btn portal-btn-secondary">
              Pack &amp; ship
            </Link>
          ) : null}
          {status.showEndStudy ? (
            <button
              type="button"
              className="portal-btn portal-btn-cta"
              onClick={() => {
                setError(null)
                setEndOpen(true)
              }}
            >
              End study
            </button>
          ) : null}
        </div>
      ) : null}

      {toast ? (
        <p role="status" style={{ marginTop: 16, fontSize: 13, color: 'var(--heading)' }}>
          {toast}
        </p>
      ) : null}
      {error ? (
        <p role="alert" style={{ marginTop: 16, fontSize: 13, color: 'var(--ink)' }}>
          {error}
        </p>
      ) : null}

      <EndStudyDialog
        open={endOpen}
        missionId={missionId}
        title={title}
        onCancel={() => setEndOpen(false)}
        onError={(message) => {
          setError(message)
          setEndOpen(false)
        }}
        onFinished={(result) => {
          setEndOpen(false)
          setToast(endStudySuccessToast(result))
          router.refresh()
        }}
      />
    </div>
  )
}
