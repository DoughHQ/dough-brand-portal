'use client'

import type { ConceptStudyDraft } from '@/lib/concept/types'
import MastheadAddTile from './masthead/MastheadAddTile'
import MastheadFilledTile from './masthead/MastheadFilledTile'
import { useStudyMasthead } from './masthead/useStudyMasthead'

type Props = {
  draft: ConceptStudyDraft
  locked?: boolean
  lockReason?: string | null
  onOpenField: () => void
}

/**
 * Page-top competitive shelf — the study’s polaroid.
 * Add shortcuts expand Field and reuse its real create flows.
 */
export default function StudyMasthead({
  draft,
  locked = false,
  lockReason = null,
  onOpenField,
}: Props) {
  const shelf = useStudyMasthead(draft, locked, onOpenField)
  const { model } = shelf

  return (
    <div
      className="cb-masthead"
      data-empty={model.empty ? 'true' : 'false'}
      data-locked={locked ? 'true' : 'false'}
    >
      <div className="cb-masthead-rail-wrap">
        <ul className="cb-masthead-rail" aria-label="Study field">
          {model.arms.map((seat) => (
            <li key={`arm-${seat.localId}`}>
              <MastheadFilledTile seat={seat} onFocus={() => shelf.focusSeat(seat.focusId)} />
            </li>
          ))}
          {model.addDesign ? (
            <li key="add-design">
              <MastheadAddTile
                seat={model.addDesign}
                disabled={locked}
                onClick={() => shelf.requestAdd('add-design')}
              />
            </li>
          ) : null}

          {shelf.showVs ? (
            <li className="cb-masthead-vs" aria-hidden>
              <span>vs</span>
            </li>
          ) : null}

          {model.products.map((seat) => (
            <li key={`product-${seat.localId}`}>
              <MastheadFilledTile seat={seat} onFocus={() => shelf.focusSeat(seat.focusId)} />
            </li>
          ))}
          {model.addCompetitor ? (
            <li key="add-competitor">
              <MastheadAddTile
                seat={model.addCompetitor}
                disabled={locked}
                onClick={() => shelf.requestAdd('add-competitor')}
              />
            </li>
          ) : null}
        </ul>
      </div>

      <p className="cb-masthead-meta" role="status">
        {locked && lockReason ? lockReason : model.meta}
      </p>
      {model.helper && !locked ? <p className="cb-masthead-helper">{model.helper}</p> : null}
    </div>
  )
}
