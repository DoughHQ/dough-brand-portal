'use client'

import { competeCategoriesFromLauncher } from '@/lib/categoryLauncher'
import CategoriesSkeleton from '@/components/categories/categories_skeleton'
import type { AdjacentCategory } from '@/lib/adjacentCategories'
import '@/components/categories/categoriesPage.css'
import { uniqueL1Count } from './launcher/launcherModel'
import { SectionHead } from './launcher/launcherParts'
import { OwnedCard, OwnedEmpty } from './launcher/OwnedCards'
import { ExploreCard } from './launcher/ExploreCard'
import { BrowseSection } from './launcher/BrowseSection'
import { CompeteSection } from './launcher/CompeteSection'
import { LauncherError } from './launcher/LauncherError'
import { LauncherSummary } from './launcher/LauncherSummary'
import { useCategoryLauncher } from './launcher/useCategoryLauncher'

export default function CategoryLauncher({
  brandName,
  adjacentCategories,
}: {
  brandName: string
  adjacentCategories: AdjacentCategory[]
}) {
  const { data, ready, error, searchInput, setSearchInput, debouncedSearch } =
    useCategoryLauncher()

  if (!ready) {
    return <CategoriesSkeleton embedded />
  }

  if (error) {
    return <LauncherError error={error} />
  }

  const owned = data?.owned ?? []
  const hasProducts = data?.has_products ?? []
  const browse = data?.browse ?? []
  const compete = data ? competeCategoriesFromLauncher(data) : []
  const represented = compete.length
  const departments = uniqueL1Count(compete)
  const productsMapped = compete.reduce((s, r) => s + (r.total_products || 0), 0)
  const battlesCaptured = compete.reduce((s, r) => s + (r.total_battles || 0), 0)

  return (
    <div>
      <header className="cat-header">
        <div className="cat-header-copy">
          <div className="cat-eyebrow">{brandName}</div>
          <h1 className="cat-title cat-title-sr">Categories</h1>
          <p className="cat-lede">
            Category dashboards unlock full Overview. Until then, see where your products already
            compete — honest product and battle counts, no invented rankings.
          </p>
        </div>
      </header>

      <LauncherSummary
        represented={represented}
        departments={departments}
        owned={owned}
        productsMapped={productsMapped}
        battlesCaptured={battlesCaptured}
      />

      <section className="cat-section">
        <SectionHead
          title="Ready to explore"
          sub="Dashboards that are live and ready with enough battle signal."
        />
        {owned.length === 0 ? (
          <OwnedEmpty />
        ) : (
          owned.map((row) => <OwnedCard key={row.l2_id} row={row} />)
        )}
      </section>

      <CompeteSection hasProducts={hasProducts} />

      {adjacentCategories.length > 0 ? (
        <section className="cat-section">
          <SectionHead title="Categories next door" sub="Adjacent aisles you’re not in yet." />
          <div className="cat-tile-grid">
            {adjacentCategories.map((row) => (
              <ExploreCard key={row.l2_id} row={row} />
            ))}
          </div>
        </section>
      ) : null}

      <BrowseSection
        browse={browse}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        debouncedSearch={debouncedSearch}
      />

      <div className="cat-note">
        <div className="cat-note-icon" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <span>
          Dashboards unlock as products collect enough battle activity. We’ll surface them here
          automatically.
        </span>
      </div>
    </div>
  )
}
