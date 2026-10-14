'use client'

import type {
  OperatorStudyRow,
  WithdrawnStudyRow,
} from '@/lib/studies/types'
import type { StudiesPageCursor } from '@/lib/studies/fetchOperatorStudies'
import CloseStudyConfirm from './confirms/CloseStudyConfirm'
import DeleteStudyConfirm from './confirms/DeleteStudyConfirm'
import StudiesMetricStrip from './components/StudiesMetricStrip'
import StudyDraftsPanel from './components/StudyDraftsPanel'
import {
  ActiveStudyList,
  CompletedSectionHead,
  CompletedStudyList,
  DraftsSectionHead,
  InProgressEmpty,
  InProgressSectionHead,
} from './components/StudyLifecycleLists'
import type { StudyDraftListItem } from './drafts/actions'
import StudiesArchive from './archive/StudiesArchive'
import StudiesListHeader from './header/StudiesListHeader'
import StudiesErrorBanner from './notices/StudiesErrorBanner'
import StudiesToast from './notices/StudiesToast'
import StudiesLoadMore from './loadMore/StudiesLoadMore'
import type { StudyOrderRow } from '@/lib/checkout/payment'
import StudyCheckoutDesk from './components/StudyCheckoutDesk'
import { useStudiesClient } from './client/useStudiesClient'
import './studiesPage.css'

interface Props {
  initialActive: OperatorStudyRow[]
  initialActiveHasMore: boolean
  initialActiveCursor: StudiesPageCursor | null
  initialComplete: OperatorStudyRow[]
  initialCompleteHasMore: boolean
  initialCompleteCursor: StudiesPageCursor | null
  withdrawn: WithdrawnStudyRow[]
  drafts: StudyDraftListItem[]
  effectiveBrandId: number
  canOperate: boolean
  brandName?: string | null
  loadError?: string | null
  awaitingOrders?: StudyOrderRow[]
  orderBrandNames?: Record<number, string>
  /** Staff desk only. Brand sessions never receive these addresses. */
  invoiceContactLabels?: Record<string, string>
  conceptUnitPriceCents?: number | null
  conceptCurrency?: string
}

export default function StudiesClient({
  initialActive,
  initialActiveHasMore,
  initialActiveCursor,
  initialComplete,
  initialCompleteHasMore,
  initialCompleteCursor,
  withdrawn,
  drafts: initialDrafts,
  effectiveBrandId,
  canOperate,
  loadError = null,
  awaitingOrders = [],
  orderBrandNames = {},
  invoiceContactLabels = {},
  conceptUnitPriceCents = null,
  conceptCurrency = 'usd',
}: Props) {
  const {
    pending,
    busyId,
    toast,
    errorBanner,
    confirm,
    isArchiveOpen,
    setIsArchiveOpen,
    activeHasMore,
    loadingActiveMore,
    completeHasMore,
    loadingCompleteMore,
    withdrawnRows,
    draftRows,
    setDraftRows,
    studyRows,
    showBrand,
    activeRows,
    completeRows,
    loadMoreActive,
    loadMoreComplete,
    undoWithdraw,
    runRestore,
    executeWithdraw,
    executeHardDelete,
    executeCloseStudy,
    setConfirm,
    setErrorBanner,
    setToast,
    confirmBusy,
  } = useStudiesClient({
    initialActive,
    initialActiveHasMore,
    initialActiveCursor,
    initialComplete,
    initialCompleteHasMore,
    initialCompleteCursor,
    withdrawn,
    drafts: initialDrafts,
    loadError,
  })

  return (
    <div className="studies-shell" style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="studies-canvas">
        <StudiesListHeader />

        <div className="studies-kpi-wrap">
          <StudiesMetricStrip
            rows={studyRows}
            draftCount={draftRows.length}
            completedCount={completeRows.length}
          />
        </div>

        {canOperate ? (
          <>
            <CloseStudyConfirm
              row={confirm?.kind === 'close' ? confirm.row : null}
              busy={confirmBusy}
              onCancel={() => setConfirm(null)}
              onConfirm={(row) => void executeCloseStudy(row)}
            />
            <DeleteStudyConfirm
              row={confirm?.kind === 'hard_delete' ? confirm.row : null}
              busy={confirmBusy}
              onCancel={() => setConfirm(null)}
              onConfirm={(row) => void executeHardDelete(row)}
            />
          </>
        ) : null}

        {toast && canOperate ? (
          <StudiesToast
            toast={toast}
            busyId={busyId}
            pending={pending}
            onUndo={() => void undoWithdraw()}
          />
        ) : null}

        {errorBanner ? <StudiesErrorBanner message={errorBanner} /> : null}

        {canOperate ? (
          <StudyCheckoutDesk
            orders={awaitingOrders}
            brandNames={orderBrandNames}
            invoiceContactLabels={invoiceContactLabels}
            unitPriceCents={conceptUnitPriceCents}
            currency={conceptCurrency}
          />
        ) : null}

        <section className="studies-lifecycle">
          <InProgressSectionHead />
          {activeRows.length === 0 ? (
            <InProgressEmpty />
          ) : (
            <ActiveStudyList
              rows={activeRows}
              canOperate={canOperate}
              busyId={busyId}
              pending={pending}
              showBrand={showBrand}
              onClose={(row) => setConfirm({ kind: 'close', row })}
              onWithdraw={(row) => void executeWithdraw(row)}
            />
          )}
          {activeHasMore ? (
            <StudiesLoadMore
              loading={loadingActiveMore}
              onLoadMore={() => void loadMoreActive()}
            />
          ) : null}
        </section>

        <section className="studies-lifecycle">
          <DraftsSectionHead />
          <StudyDraftsPanel
            drafts={draftRows}
            effectiveBrandId={effectiveBrandId}
            onChange={setDraftRows}
            onError={(message) => setErrorBanner(message || null)}
            onToast={(message) => setToast({ kind: 'plain', message })}
          />
        </section>

        <section className="studies-lifecycle">
          <CompletedSectionHead />
          {completeRows.length === 0 ? (
            <p className="studies-empty-quiet">No completed studies yet.</p>
          ) : (
            <CompletedStudyList
              rows={completeRows}
              canOperate={canOperate}
              busyId={busyId}
              pending={pending}
              showBrand={showBrand}
              onClose={(row) => setConfirm({ kind: 'close', row })}
              onWithdraw={(row) => void executeWithdraw(row)}
            />
          )}
          {completeHasMore ? (
            <StudiesLoadMore
              loading={loadingCompleteMore}
              onLoadMore={() => void loadMoreComplete()}
            />
          ) : null}
        </section>

        {canOperate && withdrawnRows.length > 0 ? (
          <StudiesArchive
            rows={withdrawnRows}
            isOpen={isArchiveOpen}
            showBrand={showBrand}
            busyId={busyId}
            pending={pending}
            onToggle={() => setIsArchiveOpen((open) => !open)}
            onRestore={(missionId) => void runRestore(missionId)}
            onDelete={(row) => setConfirm({ kind: 'hard_delete', row })}
          />
        ) : null}
      </div>
    </div>
  )
}
