'use client'

import styles from './commandPalette.module.css'
import { CommandList } from './palette/CommandList'
import { PaletteFooter } from './palette/PaletteFooter'
import { PaletteSearchRow } from './palette/PaletteSearchRow'
import type { Props } from './palette/paletteModel'
import { useCommandPalette } from './palette/useCommandPalette'

export type { CommandItem } from './palette/paletteModel'
export { useCommandPaletteHotkey } from './palette/useCommandPaletteHotkey'

export function CommandPalette({
  open,
  onOpenChange,
  items,
  searchRemote,
  bootstrapRemote,
  effectiveBrandId,
}: Props) {
  const palette = useCommandPalette({
    open,
    onOpenChange,
    items,
    searchRemote,
    bootstrapRemote,
    effectiveBrandId,
  })
  const { close } = palette

  if (!open) return null

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="Search portal">
      <button type="button" className={styles.scrim} aria-label="Close search" onClick={close} />
      <div className={styles.panel}>
        <PaletteSearchRow {...palette} />
        <CommandList {...palette} />
        <PaletteFooter {...palette} />
      </div>
    </div>
  )
}
