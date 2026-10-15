'use client'

import { formatUtcStamp } from '@/lib/portal-ui/format'
import type { SafetyReportRow } from '@/lib/safety.shared'
import { SafetyCase } from './desk/SafetyCase'
import { SafetyQueue } from './desk/SafetyQueue'
import { useSafetyDesk } from './desk/useSafetyDesk'
import './safetyDesk.css'

export default function SafetyDeskClient({
  initialRows,
  initialTotal,
  focusId,
  loadError,
  renderedAt,
}: {
  initialRows: SafetyReportRow[]
  initialTotal: number
  focusId: number | null
  loadError: string | null
  renderedAt: number
}) {
  const desk = useSafetyDesk({ initialRows, initialTotal, focusId, loadError })

  return (
    <div className="safety-page">
      <div className="safety-head">
        <div>
          <div className="safety-kicker">Platform · Trust &amp; safety</div>
          <h1 className="safety-title">Safety</h1>
        </div>
        <div className="safety-meta">
          {desk.total === 0 ? 'Inbox clear' : `${desk.total} open`} · SLA 24h · rendered{' '}
          {formatUtcStamp(new Date(renderedAt).toISOString())}
        </div>
      </div>

      {desk.banner ? (
        <div
          className={`safety-banner ${desk.banner.tone === 'error' ? 'safety-banner-error' : 'safety-banner-ok'}`}
          role="status"
        >
          {desk.banner.text}
        </div>
      ) : null}

      <div className="safety-layout">
        <SafetyQueue rows={desk.rows} selectedId={desk.selectedId} selectCase={desk.selectCase} />
        <SafetyCase
          selected={desk.selected}
          who={desk.who}
          actions={desk.actions}
          note={desk.note}
          setNote={desk.setNote}
          pending={desk.pending}
          act={desk.act}
          reinstate={desk.reinstate}
        />
      </div>
    </div>
  )
}
