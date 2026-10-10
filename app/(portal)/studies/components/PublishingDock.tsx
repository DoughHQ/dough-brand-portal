'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type Ref,
} from 'react'

export type PublishingDockNeed = {
  message: string
  anchor: string | null
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

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
  const next = needs[0] ?? null
  const count = needs.length
  const previewEnabled = canPreview ?? ready

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

  const statusTone = holdLabel || ready ? 'ok' : 'warn'
  const statusLabel =
    holdLabel ??
    (ready
      ? readyFacts?.trim() || 'Ready to publish'
      : count === 1
        ? '1 left'
        : `${count} left`)

  return (
    <div className="cb-sticky" ref={stickyRef}>
        <div className="cb-sticky-inner" data-ready={!holdLabel && ready ? 'true' : 'false'}>
        <div className="cb-dock-status" ref={statusRef}>
          <button
            type="button"
            className="cb-dock-status-btn"
            data-tone={statusTone}
            aria-expanded={listOpen}
            aria-controls={count > 0 ? panelId : undefined}
            disabled={count === 0 || !!holdLabel}
            onClick={() => {
              if (count === 0) return
              setListOpen((v) => !v)
            }}
          >
            <span className="cb-dock-status-icon" data-tone={statusTone} aria-hidden>
              {holdLabel || ready ? '✓' : '!'}
            </span>
            <span className="cb-dock-status-label">{statusLabel}</span>
            {count > 0 && !holdLabel ? (
              <span className="cb-dock-status-chevron" aria-hidden>
                {listOpen ? '▴' : '▾'}
              </span>
            ) : null}
          </button>

          {!holdLabel && !ready && next ? (
            <button
              type="button"
              className="cb-dock-next"
              title={next.message}
              onClick={() => goTo(next.anchor)}
            >
              <span className="cb-dock-next-dot" aria-hidden />
              <span className="cb-dock-next-text">{next.message}</span>
            </button>
          ) : null}

          {listOpen && count > 0 ? (
            <div className="cb-dock-panel" id={panelId} role="listbox" aria-label="Still needed">
              <ul className="cb-dock-panel-list">
                {needs.map((item) => (
                  <li key={item.message}>
                    <button
                      type="button"
                      className="cb-dock-panel-item"
                      role="option"
                      aria-selected={false}
                      onClick={() => goTo(item.anchor)}
                    >
                      <span className="cb-dock-next-dot" aria-hidden />
                      {item.message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="cb-dock-actions">
          <span
            className="cb-dock-sync"
            aria-live="polite"
            data-tone={saveStatus === 'error' ? 'error' : 'neutral'}
          >
            {saveStatus === 'saving'
              ? 'Syncing…'
              : saveStatus === 'saved'
                ? 'Saved'
                : saveStatus === 'error'
                  ? 'Sync failed'
                  : ''}
          </span>
          <button
            type="button"
            className="cb-btn cb-btn-ghost cb-btn-dock"
            onClick={onSave}
            disabled={saving || publishing || actionsLocked}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {showPreview && onPreview ? (
            <button
              type="button"
              className="cb-btn cb-btn-ghost cb-btn-dock"
              disabled={!previewEnabled || publishing || actionsLocked}
              onClick={onPreview}
            >
              {previewLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="cb-btn cb-btn-primary cb-btn-dock"
            data-muted={publishMuted || publishing}
            onClick={onPublish}
            disabled={publishing || actionsLocked || publishDisabled}
          >
            {publishing ? publishBusyLabel : publishLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
