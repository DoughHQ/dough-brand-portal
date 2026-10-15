import styles from '../commandPalette.module.css'
import type { CommandPaletteState } from './useCommandPalette'

export function PaletteFooter({
  remoteLoading,
  openingDraft,
}: Pick<CommandPaletteState, 'remoteLoading' | 'openingDraft'>) {
  return (
    <div className={styles.footer}>
      <span>↑↓ Navigate</span>
      <span>↵ Open</span>
      <span>esc Close</span>
      {remoteLoading || openingDraft ? (
        <span>{openingDraft ? 'Opening…' : 'Searching…'}</span>
      ) : null}
    </div>
  )
}
