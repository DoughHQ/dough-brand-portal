import type { BoxTab } from '@/lib/box/operator'
import { TAB_KEYS, TAB_LABELS } from './boxesModel'

export function AdminBoxesToolbar({
  activeTab,
  setTab,
  includeArchived,
  toggleArchived,
}: {
  activeTab: BoxTab
  setTab: (tab: BoxTab) => void
  includeArchived: boolean
  toggleArchived: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      <div role="tablist" style={{ display: 'flex', gap: 4 }}>
        {TAB_KEYS.map((tab) => {
          const active = tab === activeTab
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(tab)}
              style={{
                border: 'none',
                background: active ? 'var(--sage-soft)' : 'transparent',
                color: active ? 'var(--heading)' : 'var(--ink-50)',
                borderRadius: 'var(--r-sm)',
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          )
        })}
      </div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--ink-50)',
          cursor: 'pointer',
        }}
      >
        <input type="checkbox" checked={includeArchived} onChange={toggleArchived} />
        Include archived
      </label>
    </div>
  )
}
