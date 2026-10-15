import styles from '../commandPalette.module.css'
import { GROUP_ORDER, type CommandItem } from './paletteModel'
import type { CommandPaletteState } from './useCommandPalette'

export function CommandList({
  query,
  filtered,
  active,
  setActive,
  go,
  openingDraft,
  remoteLoading,
}: Pick<
  CommandPaletteState,
  'query' | 'filtered' | 'active' | 'setActive' | 'go' | 'openingDraft' | 'remoteLoading'
>) {
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    ;(acc[item.group] ??= []).push(item)
    return acc
  }, {})

  const orderedGroups = [
    ...GROUP_ORDER.filter((g) => groups[g]?.length),
    ...Object.keys(groups).filter((g) => !GROUP_ORDER.includes(g)),
  ]

  let flatIndex = -1
  const idle = query.trim().length < 2

  return (
    <div className={styles.list} id="portal-command-list" role="listbox">
      {filtered.length === 0 ? (
        <p className={styles.empty}>
          {remoteLoading || openingDraft
            ? openingDraft
              ? 'Opening draft…'
              : 'Searching…'
            : idle
              ? 'Recent destinations, drafts, and categories appear here'
              : 'No matches'}
        </p>
      ) : (
        orderedGroups.map((group) => (
          <div key={group} className={styles.group}>
            <div className={styles.groupLabel}>{group}</div>
            {(groups[group] ?? []).map((item) => {
              flatIndex += 1
              const index = flatIndex
              const isActive = index === active
              return (
                <button
                  type="button"
                  key={item.id}
                  role="option"
                  aria-selected={isActive}
                  className={`${styles.item}${isActive ? ` ${styles.itemActive}` : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => void go(item)}
                  disabled={openingDraft}
                >
                  <span className={styles.itemLabel}>{item.label}</span>
                  <span className={styles.itemHref}>
                    {item.draftId ? 'Resume draft' : item.href}
                  </span>
                </button>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
