import type { ReactNode } from 'react'
import {
  ICON_CHECK,
  ICON_CLOCK,
  ICON_FILE,
  StudiesGlyph,
} from '../studiesIcons'

export function StudiesSectionHead({
  title,
  icon,
}: {
  title: string
  icon: ReactNode
}) {
  return (
    <div className="studies-section-head">
      <span className="studies-section-icon" aria-hidden>
        {icon}
      </span>
      <h2 className="studies-section-title">{title}</h2>
    </div>
  )
}

export function InProgressSectionHead() {
  return (
    <StudiesSectionHead
      title="In progress"
      icon={<StudiesGlyph d={ICON_CLOCK} size={16} />}
    />
  )
}

export function DraftsSectionHead() {
  return (
    <StudiesSectionHead
      title="Drafts"
      icon={<StudiesGlyph d={ICON_FILE} size={16} />}
    />
  )
}

export function CompletedSectionHead() {
  return (
    <StudiesSectionHead
      title="Completed"
      icon={<StudiesGlyph d={ICON_CHECK} size={16} />}
    />
  )
}
