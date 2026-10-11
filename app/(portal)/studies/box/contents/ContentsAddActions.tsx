import type { CSSProperties } from 'react'
import type { ComposerIntent } from './types'

export default function ContentsAddActions({
  onOpen,
  style,
}: {
  onOpen: (intent: ComposerIntent) => void
  style: CSSProperties
}) {
  return (
    <div style={style}>
      <button
        type="button"
        className="cb-btn cb-btn-secondary"
        onClick={() => onOpen('yours_catalog')}
      >
        + Your catalog product
      </button>
      <button
        type="button"
        className="cb-btn cb-btn-secondary"
        onClick={() => onOpen('yours_prototype')}
      >
        + Your prototype
      </button>
      <button
        type="button"
        className="cb-btn cb-btn-secondary"
        onClick={() => onOpen('competitor_catalog')}
      >
        + Competitor product
      </button>
    </div>
  )
}
