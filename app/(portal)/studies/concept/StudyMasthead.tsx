'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { resolveStimuliPreviewUrl } from '@/lib/concept/stimuliStorage'
import {
  buildMastheadModel,
  FIELD_ADD_COMPETITOR_EVENT,
  FIELD_ADD_DESIGN_EVENT,
  type MastheadAddSeat,
  type MastheadFilledSeat,
} from '@/lib/concept/studyMasthead'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'
import type { ConceptStudyDraft } from '@/lib/concept/types'

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
  const model = useMemo(() => buildMastheadModel(draft), [draft])
  const showVs =
    !model.empty &&
    model.arms.length > 0 &&
    (model.products.length > 0 || model.addCompetitor != null)

  function requestAdd(action: MastheadAddSeat['action']) {
    if (locked) {
      onOpenField()
      return
    }
    onOpenField()
    const eventName =
      action === 'add-design' ? FIELD_ADD_DESIGN_EVENT : FIELD_ADD_COMPETITOR_EVENT
    window.setTimeout(() => {
      document.getElementById(CONCEPT_ANCHORS.field)?.dispatchEvent(new Event(eventName))
    }, 80)
  }

  function focusSeat(focusId: string) {
    onOpenField()
    window.setTimeout(() => focusFieldSeat(focusId), 100)
  }

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
              <FilledTile seat={seat} onFocus={() => focusSeat(seat.focusId)} />
            </li>
          ))}
          {model.addDesign ? (
            <li key="add-design">
              <AddTile
                seat={model.addDesign}
                disabled={locked}
                onClick={() => requestAdd('add-design')}
              />
            </li>
          ) : null}

          {showVs ? (
            <li className="cb-masthead-vs" aria-hidden>
              <span>vs</span>
            </li>
          ) : null}

          {model.products.map((seat) => (
            <li key={`product-${seat.localId}`}>
              <FilledTile seat={seat} onFocus={() => focusSeat(seat.focusId)} />
            </li>
          ))}
          {model.addCompetitor ? (
            <li key="add-competitor">
              <AddTile
                seat={model.addCompetitor}
                disabled={locked}
                onClick={() => requestAdd('add-competitor')}
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

function FilledTile({
  seat,
  onFocus,
}: {
  seat: MastheadFilledSeat
  onFocus: () => void
}) {
  const subtitle =
    seat.kind === 'arm' ? `Design ${seat.letter}` : seat.brand || 'Competitor'
  return (
    <button type="button" className="cb-masthead-tile" onClick={onFocus}>
      {seat.kind === 'arm' ? (
        <ShelfPhoto imageRef={seat.imageRef} letter={seat.letter} />
      ) : (
        <ShelfPhoto src={seat.imageSrc} letter={seat.name.slice(0, 1).toUpperCase() || 'C'} />
      )}
      <span className="cb-masthead-copy">
        <strong>{seat.name}</strong>
        <span>{subtitle}</span>
      </span>
    </button>
  )
}

function AddTile({
  seat,
  disabled,
  onClick,
}: {
  seat: MastheadAddSeat
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="cb-masthead-tile is-add"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="cb-masthead-photo is-add" aria-hidden>
        <span className="cb-masthead-plus" />
      </span>
      <span className="cb-masthead-copy">
        <strong>{seat.label}</strong>
        <span>{seat.hint}</span>
      </span>
    </button>
  )
}

function ShelfPhoto({
  imageRef,
  src,
  letter,
}: {
  imageRef?: string | null
  src?: string | null
  letter: string
}) {
  const [url, setUrl] = useState<string | null>(src ?? null)
  useEffect(() => {
    if (src) {
      setUrl(src)
      return
    }
    if (!imageRef) {
      setUrl(null)
      return
    }
    let cancelled = false
    const supabase = createClient()
    void resolveStimuliPreviewUrl(supabase, imageRef).then((next) => {
      if (!cancelled) setUrl(next)
    })
    return () => {
      cancelled = true
    }
  }, [imageRef, src])

  return (
    <span className="cb-masthead-photo">
      {url ? (
        // Study media can use remote catalog URLs that must not be server-fetched.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        <span className="cb-masthead-letter" aria-hidden>
          {letter}
        </span>
      )}
    </span>
  )
}

function focusFieldSeat(elementId: string) {
  const el = document.getElementById(elementId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  el.classList.add('is-shelf-focus')
  window.setTimeout(() => el.classList.remove('is-shelf-focus'), 1200)
  const focusable = el.querySelector<HTMLElement>(
    'input:not([type="hidden"]), button.cb-concept-stage-replace, [data-shelf-focus]'
  )
  focusable?.focus({ preventScroll: true })
}
