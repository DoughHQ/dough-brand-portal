'use client'

import { useState } from 'react'
import type { CompareGroupDetail, CompareGroupMetrics } from '@/lib/compareGroups.shared'
import Header from './Header'
import MetricsStrip from './MetricsStrip'
import NodesPanel from './NodesPanel'
import ProductTable from './ProductTable'
import TimeHeatmap from './TimeHeatmap'
import RevisionTimeline from './RevisionTimeline'
import EditDetailsPanel from './EditDetailsPanel'
import ManageNodesPanel from './ManageNodesPanel'

type Props = {
  id: number
  detail: CompareGroupDetail
  metrics: CompareGroupMetrics | null
}

export default function DetailShell({ id, detail, metrics }: Props) {
  const [showEdit, setShowEdit] = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [flashError, setFlashError] = useState<string | null>(null)

  function openEdit() {
    setFlashError(null)
    setShowManage(false)
    setShowEdit(true)
  }

  function openManage() {
    setFlashError(null)
    setShowEdit(false)
    setShowManage(true)
  }

  function closePanels() {
    setShowEdit(false)
    setShowManage(false)
  }

  return (
    <div>
      <Header
        detail={detail}
        onEditDetails={openEdit}
        onManageNodes={openManage}
      />

      {flashError && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(166,84,60,0.1)',
            border: '1px solid rgba(166,84,60,0.25)',
            color: 'var(--clay, #a6543c)',
            fontSize: 14,
          }}
        >
          {flashError}
        </div>
      )}

      {showEdit && (
        <EditDetailsPanel
          id={id}
          detail={detail}
          onClose={closePanels}
          onError={setFlashError}
        />
      )}

      {showManage && (
        <ManageNodesPanel
          id={id}
          detail={detail}
          onClose={closePanels}
          onError={setFlashError}
        />
      )}

      <MetricsStrip metrics={metrics} />

      <NodesPanel detail={detail} metrics={metrics} />

      <ProductTable metrics={metrics} />

      <TimeHeatmap metrics={metrics} />

      <RevisionTimeline revisions={detail.recent_revisions} />
    </div>
  )
}
