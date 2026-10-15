import type { CategoryLauncherRow } from '@/lib/categoryLauncher'
import { ExploreCard } from './ExploreCard'
import { SectionHead } from './launcherParts'
import type { CategoryLauncherState } from './useCategoryLauncher'

export function BrowseSection({
  browse,
  searchInput,
  setSearchInput,
  debouncedSearch,
}: { browse: CategoryLauncherRow[] } & Pick<
  CategoryLauncherState,
  'searchInput' | 'setSearchInput' | 'debouncedSearch'
>) {
  return (
    <section className="cat-section">
      <SectionHead
        title="Browse categories"
        sub={
          <>
            <p className="cat-section-sub">Explore categories beyond your current portfolio.</p>
            <p className="cat-section-sub">
              You don’t have products here yet — but you can add them anytime.
            </p>
          </>
        }
      />
      <div className="cat-browse-search-wrap">
        <svg className="cat-browse-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          className="cat-browse-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search categories or parents…"
          aria-label="Search browse categories"
        />
      </div>
      {browse.length === 0 ? (
        <div className="cat-browse-empty">
          <div className="cat-browse-empty-title">
            {debouncedSearch ? 'No categories found' : 'No other categories to browse right now.'}
          </div>
          {debouncedSearch ? (
            <p className="cat-browse-empty-sub">Try another category or parent name.</p>
          ) : null}
        </div>
      ) : (
        <div className="cat-tile-grid">
          {browse.map((row) => (
            <ExploreCard key={row.l2_id} row={row} />
          ))}
        </div>
      )}
    </section>
  )
}
