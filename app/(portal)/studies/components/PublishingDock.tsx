'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type Ref,
} from 'react'
import PublishingDockActions, { type SaveStatus } from './publishingDock/PublishingDockActions'
import PublishingDockStatus, {
  type PublishingDockNeed,
} from './publishingDock/PublishingDockStatus'

export type { PublishingDockNeed }

type Props = {
  ready: boolean
  needs: PublishingDockNeed[]
  saveStatus: SaveStatus
  saving: boolean
  publishing: boolean
  /** Disables all actions (pending transition, post-publish lock, etc.). */
  actionsLocked: boolean
  /** Replaces “Ready to publish” after the order exists. */
  holdLabel?: string
  /** When ready — live study facts instead of a generic ready label. */
  readyFacts?: string | null
  /** Publish stays quiet while the order is awaiting payment. */
  publishDisabled?: boolean
  publishMuted: boolean
  publishLabel: string
  publishBusyLabel?: string
  showPreview?: boolean
  previewLabel?: string
  /** Defaults to `ready`. Concept allows preview when hard requirements pass. */
  canPreview?: boolean
  onSave: () => void
  onPublish: () => void
  onPreview?: () => void
  onScrollTo: (anchor: string) => void
  stickyRef: Ref<HTMLDivElement>
}

/**
 * Slim publisher chrome for study builders. Validity is computed by the parent;
 * this component only presents status, a next-blocker, an expandable needs list,
 * and Save / Preview / Publish.
 */
export default function PublishingDock({
  ready,
  needs,
  saveStatus,
  saving,
  publishing,
  actionsLocked,
  holdLabel,
  readyFacts = null,
  publishDisabled = false,
  publishMuted,
  publishLabel,
  publishBusyLabel = 'Publishing…',
  showPreview = false,
  previewLabel = 'Preview',
  canPreview,
  onSave,
  onPublish,
  onPreview,
  onScrollTo,
  stickyRef,
}: Props) {
  const [listOpen, setListOpen] = useState(false)
  const panelId = useId()
  const statusRef = useRef<HTMLDivElement>(null)

  const closeList = useCallback(() => setListOpen(false), [])

  useEffect(() => {
    if (ready) setListOpen(false)
  }, [ready])

  useEffect(() => {
    if (!listOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeList()
    }
    function onPointer(e: MouseEvent) {
      const root = statusRef.current
      if (!root) return
      if (e.target instanceof Node && !root.contains(e.target)) closeList()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [listOpen, closeList])

  function goTo(anchor: string | null) {
    if (anchor) onScrollTo(anchor)
    closeList()
  }

  return (
    <div className="cb-sticky" ref={stickyRef}>
        <div className="cb-sticky-inner" data-ready={!holdLabel && ready ? 'true' : 'false'}>
        <PublishingDockStatus
          ready={ready}
          needs={needs}
          holdLabel={holdLabel}
          readyFacts={readyFacts}
          listOpen={listOpen}
          panelId={panelId}
          statusRef={statusRef}
          onToggleList={() => setListOpen((v) => !v)}
          onGoTo={goTo}
        />
        <PublishingDockActions
          ready={ready}
          saveStatus={saveStatus}
          saving={saving}
          publishing={publishing}
          actionsLocked={actionsLocked}
          publishDisabled={publishDisabled}
          publishMuted={publishMuted}
          publishLabel={publishLabel}
          publishBusyLabel={publishBusyLabel}
          showPreview={showPreview}
          previewLabel={previewLabel}
          canPreview={canPreview}
          onSave={onSave}
          onPublish={onPublish}
          onPreview={onPreview}
        />
      </div>
    </div>
  )
}
