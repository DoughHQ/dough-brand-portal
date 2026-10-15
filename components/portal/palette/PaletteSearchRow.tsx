import styles from '../commandPalette.module.css'
import type { CommandPaletteState } from './useCommandPalette'

export function PaletteSearchRow({
  inputRef,
  query,
  setQuery,
}: Pick<CommandPaletteState, 'inputRef' | 'query' | 'setQuery'>) {
  return (
    <div className={styles.searchRow}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        className={styles.input}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search studies, drafts, products, categories…"
        aria-autocomplete="list"
        aria-controls="portal-command-list"
      />
      <kbd className={styles.kbd}>esc</kbd>
    </div>
  )
}
