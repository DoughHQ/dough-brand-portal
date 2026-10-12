import Link from 'next/link'
import { ICON_FLASK, StudiesGlyph } from '../studiesIcons'

export function InProgressEmpty() {
  return (
    <div className="studies-empty-active">
      <div className="studies-empty-active-icon">
        <StudiesGlyph d={ICON_FLASK} size={22} />
      </div>
      <h3 className="studies-empty-active-title">No active studies right now</h3>
      <p className="studies-empty-active-copy">
        Start a new study when you want focused feedback from qualified consumers.
      </p>
      <Link href="/studies/new" className="portal-btn portal-btn-cta studies-new-study studies-new-study-sm">
        <span aria-hidden style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>
          +
        </span>
        New study
      </Link>
    </div>
  )
}
