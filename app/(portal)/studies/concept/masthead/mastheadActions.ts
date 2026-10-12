import {
  FIELD_ADD_COMPETITOR_EVENT,
  FIELD_ADD_DESIGN_EVENT,
  type MastheadAddSeat,
} from '@/lib/concept/studyMasthead'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'

export function requestMastheadAdd(
  action: MastheadAddSeat['action'],
  locked: boolean,
  onOpenField: () => void,
) {
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

export function focusMastheadSeat(focusId: string, onOpenField: () => void) {
  onOpenField()
  window.setTimeout(() => focusFieldSeat(focusId), 100)
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
