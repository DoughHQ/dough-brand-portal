export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Props = {
  ready: boolean
  saveStatus: SaveStatus
  saving: boolean
  publishing: boolean
  actionsLocked: boolean
  publishDisabled: boolean
  publishMuted: boolean
  publishLabel: string
  publishBusyLabel: string
  showPreview: boolean
  previewLabel: string
  canPreview?: boolean
  onSave: () => void
  onPublish: () => void
  onPreview?: () => void
}

export default function PublishingDockActions({
  ready,
  saveStatus,
  saving,
  publishing,
  actionsLocked,
  publishDisabled,
  publishMuted,
  publishLabel,
  publishBusyLabel,
  showPreview,
  previewLabel,
  canPreview,
  onSave,
  onPublish,
  onPreview,
}: Props) {
  const previewEnabled = canPreview ?? ready

  return (
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
  )
}
