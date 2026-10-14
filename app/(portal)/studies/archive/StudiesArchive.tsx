import type { WithdrawnStudyRow } from '@/lib/studies/types'
import { ICON_ARCHIVE, StudiesGlyph } from '../components/studiesIcons'
import StudiesArchiveRow from './StudiesArchiveRow'

type Props = {
  rows: WithdrawnStudyRow[]
  isOpen: boolean
  showBrand: boolean
  busyId: string | null
  pending: boolean
  onToggle: () => void
  onRestore: (missionId: string) => void
  onDelete: (row: WithdrawnStudyRow) => void
}

export default function StudiesArchive({
  rows,
  isOpen,
  showBrand,
  busyId,
  pending,
  onToggle,
  onRestore,
  onDelete,
}: Props) {
  return (
    <section>
      <div className={`studies-archive-card${isOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="studies-archive-toggle"
          aria-expanded={isOpen}
          aria-controls="archived-studies-panel"
          onClick={onToggle}
        >
          <span className="studies-archive-toggle-left">
            <span className="studies-archive-icon">
              <StudiesGlyph d={ICON_ARCHIVE} size={16} />
            </span>
            <h2 className="studies-archive-title">Archived studies</h2>
            <span className="studies-archive-count">({rows.length})</span>
          </span>
          <svg
            className={`studies-archive-chevron${isOpen ? ' is-open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isOpen ? (
          <div id="archived-studies-panel" className="studies-archive-body">
            {rows.map((row) => (
              <StudiesArchiveRow
                key={row.mission_id}
                row={row}
                showBrand={showBrand}
                busy={busyId === row.mission_id || pending}
                onRestore={onRestore}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
