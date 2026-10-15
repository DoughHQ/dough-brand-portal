import type { Dispatch, SetStateAction } from 'react'

export function ProductsToolbar({
  search,
  setSearch,
  showBattledOnly,
  setShowBattledOnly,
  viewMode,
  setViewMode,
}: {
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  showBattledOnly: boolean
  setShowBattledOnly: Dispatch<SetStateAction<boolean>>
  viewMode: 'grid' | 'list'
  setViewMode: Dispatch<SetStateAction<'grid' | 'list'>>
}) {
  return (
    <div className="prod-toolbar">
      <div className="cat-browse-search-wrap" style={{ margin: 0 }}>
        <svg className="cat-browse-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          className="cat-browse-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
        />
      </div>
      <button
        type="button"
        className={`prod-filter${showBattledOnly ? ' prod-filter-on' : ''}`}
        onClick={() => setShowBattledOnly(!showBattledOnly)}
      >
        With battle data
      </button>
      <div className="prod-view-toggle prod-view-toggle--desktop" role="group" aria-label="View mode">
        <button
          type="button"
          className={`prod-view-btn${viewMode === 'grid' ? ' prod-view-btn-on' : ''}`}
          onClick={() => setViewMode('grid')}
          aria-pressed={viewMode === 'grid'}
          aria-label="Grid view"
        >
          ⊞
        </button>
        <button
          type="button"
          className={`prod-view-btn${viewMode === 'list' ? ' prod-view-btn-on' : ''}`}
          onClick={() => setViewMode('list')}
          aria-pressed={viewMode === 'list'}
          aria-label="List view"
        >
          ☰
        </button>
      </div>
    </div>
  )
}
