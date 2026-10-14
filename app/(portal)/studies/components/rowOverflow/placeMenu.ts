const GAP = 4
const VIEWPORT_PAD = 8

export const MIN_WIDTH = 160
export const EST_ITEM_H = 38
export const EST_PAD = 8

export type MenuPos = { top: number; left: number }

export function placeMenu(button: DOMRect, menuW: number, menuH: number): MenuPos {
  const spaceBelow = window.innerHeight - button.bottom - GAP - VIEWPORT_PAD
  const spaceAbove = button.top - GAP - VIEWPORT_PAD
  const openUp = spaceBelow < menuH && spaceAbove > spaceBelow

  let top = openUp ? button.top - GAP - menuH : button.bottom + GAP
  top = Math.max(
    VIEWPORT_PAD,
    Math.min(top, window.innerHeight - menuH - VIEWPORT_PAD),
  )

  let left = button.right - menuW
  left = Math.max(
    VIEWPORT_PAD,
    Math.min(left, window.innerWidth - menuW - VIEWPORT_PAD),
  )

  return { top, left }
}
