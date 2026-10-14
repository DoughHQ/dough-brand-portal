import type { StudyDraftListItem } from '@/app/(portal)/studies/drafts/actions'
import { formatResumeWhen } from '@/lib/studies/useServerStudyDraft'
import RowOverflowMenu from '../RowOverflowMenu'
import { ICON_FILE, StudiesGlyph } from '../studiesIcons'
import StudyDraftRenameForm from './StudyDraftRenameForm'

function typeLabel(testType: string): string {
  if (testType === 'concept') return 'Concept'
  if (testType === 'ihut') return 'iHUT'
  return 'Study'
}

type Props = {
  row: StudyDraftListItem
  busy: boolean
  opening: boolean
  renaming: boolean
  renameValue: string
  onRenameValue: (value: string) => void
  onSaveRename: () => void
  onCancelRename: () => void
  onOpen: () => void
  onStartRename: () => void
  onDelete: () => void
}

export default function StudyDraftRow({
  row,
  busy,
  opening,
  renaming,
  renameValue,
  onRenameValue,
  onSaveRename,
  onCancelRename,
  onOpen,
  onStartRename,
  onDelete,
}: Props) {
  return (
    <div className="studies-study-row studies-study-row--draft">
      {renaming ? (
        <StudyDraftRenameForm
          value={renameValue}
          busy={busy}
          onChange={onRenameValue}
          onSubmit={onSaveRename}
          onCancel={onCancelRename}
        />
      ) : (
        <>
          <div className="studies-study-main">
            <div className="studies-study-mark studies-study-mark-neutral">
              <StudiesGlyph d={ICON_FILE} size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="studies-study-name">
                {row.title?.trim() || 'Untitled study'}
              </div>
              <div className="studies-study-meta">
                <span className="studies-type-badge">{typeLabel(row.test_type)}</span>
                <span className="studies-study-sub">
                  Updated {formatResumeWhen(row.updated_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="studies-study-actions">
            <button
              type="button"
              className="studies-row-cta"
              disabled={busy}
              onClick={() => void onOpen()}
            >
              {opening ? 'Opening…' : 'Continue →'}
            </button>
            <RowOverflowMenu
              actions={[
                {
                  label: 'Rename',
                  disabled: busy,
                  onClick: () => onStartRename(),
                },
                {
                  label: 'Delete',
                  tone: 'danger',
                  disabled: busy,
                  onClick: () => {
                    if (
                      typeof window !== 'undefined' &&
                      !window.confirm(
                        `Delete “${row.title?.trim() || 'Untitled study'}”? This can’t be undone.`
                      )
                    ) {
                      return
                    }
                    void onDelete()
                  },
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  )
}
