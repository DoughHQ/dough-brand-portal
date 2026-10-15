'use client'

import type {
  BoxTab,
  OperatorBoxRow,
  OperatorBoxesPageCursor,
} from '@/lib/box/operator'
import { AdminBoxesHeader } from './queue/AdminBoxesHeader'
import { AdminBoxesTable } from './queue/AdminBoxesTable'
import { AdminBoxesToolbar } from './queue/AdminBoxesToolbar'
import { TAB_LABELS } from './queue/boxesModel'
import { useAdminBoxes } from './queue/useAdminBoxes'

type Props = {
  initialRows: OperatorBoxRow[]
  initialHasMore: boolean
  initialCursor: OperatorBoxesPageCursor | null
  initialTab: BoxTab
  loadError: string | null
}

export default function AdminBoxesClient(props: Props) {
  const {
    rows,
    hasMore,
    includeArchived,
    error,
    pending,
    loadingMore,
    activeTab,
    setTab,
    toggleArchived,
    loadMore,
  } = useAdminBoxes(props)

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '28px 28px 80px',
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink)',
      }}
    >
      <AdminBoxesHeader />

      {error ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 20 }}>
          {error}
        </p>
      ) : null}

      <AdminBoxesToolbar
        activeTab={activeTab}
        setTab={setTab}
        includeArchived={includeArchived}
        toggleArchived={toggleArchived}
      />

      {rows.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            border: '1px dashed var(--ink-10)',
            borderRadius: 'var(--r-lg)',
            background: 'var(--paper)',
            color: 'var(--ink-50)',
            fontSize: 14,
          }}
        >
          {pending ? 'Loading…' : `No ${TAB_LABELS[activeTab].toLowerCase()} boxes.`}
        </div>
      ) : (
        <AdminBoxesTable rows={rows} />
      )}

      {hasMore ? (
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void loadMore()}
            disabled={loadingMore || pending}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
