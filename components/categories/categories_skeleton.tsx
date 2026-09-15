import CatPage from '@/components/categories/CatPage'
import SkeletonBone from '@/components/portal/SkeletonBone'
import '@/components/categories/categoriesPage.css'
import './categories_skeleton.css'

/**
 * Categories launcher skeleton — twin of CategoryLauncher.
 * Route loading uses the framed canvas; client wait uses `embedded` inside `.cat-page-cq`.
 */
export default function CategoriesSkeleton({ embedded = false }: { embedded?: boolean }) {
  const body = (
    <>
      <span className="skel-sr">Loading categories</span>

      <header className="cat-header">
        <div className="cat-header-copy">
          <SkeletonBone className="cat-skel-eyebrow" />
          <SkeletonBone className="cat-skel-title" />
          <SkeletonBone className="cat-skel-lede" />
          <SkeletonBone className="cat-skel-lede cat-skel-lede-short" />
        </div>
      </header>

      <div className="cat-summary" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="cat-summary-card cat-skel-summary" style={{ ['--skel-i' as string]: i }}>
            <SkeletonBone className="cat-skel-summary-icon" />
            <div className="cat-skel-summary-copy">
              <SkeletonBone className="cat-skel-line cat-skel-line-xs" />
              <SkeletonBone className="cat-skel-summary-value" />
              <SkeletonBone className="cat-skel-line cat-skel-line-sm" />
            </div>
          </div>
        ))}
      </div>

      <section className="cat-section" aria-hidden>
        <div className="cat-section-head">
          <SkeletonBone className="cat-skel-section-title" />
          <SkeletonBone className="cat-skel-line cat-skel-line-md" />
        </div>
        <div className="cat-skel-feature">
          <SkeletonBone className="cat-skel-feature-art" />
          <div className="cat-skel-feature-body">
            <SkeletonBone className="cat-skel-line cat-skel-line-xs" />
            <SkeletonBone className="cat-skel-feature-name" />
            <div className="cat-skel-metrics">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="cat-skel-metric" style={{ ['--skel-i' as string]: i }}>
                  <SkeletonBone className="cat-skel-metric-n" />
                  <SkeletonBone className="cat-skel-line cat-skel-line-xs" />
                </div>
              ))}
            </div>
            <SkeletonBone className="cat-skel-feature-cta" />
          </div>
        </div>
      </section>

      <section className="cat-section" aria-hidden>
        <div className="cat-section-head">
          <SkeletonBone className="cat-skel-section-title" />
          <SkeletonBone className="cat-skel-line cat-skel-line-md" />
        </div>
        <SkeletonBone className="cat-skel-search" />
        <div className="cat-tile-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="cat-tile cat-skel-tile" style={{ ['--skel-i' as string]: i }}>
              <SkeletonBone className="cat-skel-tile-art" />
              <div className="cat-tile-body cat-skel-tile-body">
                <SkeletonBone className="cat-skel-line cat-skel-line-xs" />
                <SkeletonBone className="cat-skel-line cat-skel-line-lg" />
                <SkeletonBone className="cat-skel-chip" />
                <div className="cat-skel-metrics cat-skel-metrics-sm">
                  {Array.from({ length: 3 }, (_, j) => (
                    <div key={j} className="cat-skel-metric">
                      <SkeletonBone className="cat-skel-metric-n-sm" />
                      <SkeletonBone className="cat-skel-line cat-skel-line-xs" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="cat-tile-action">
                <SkeletonBone className="cat-skel-tile-btn" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  if (embedded) {
    return (
      <div className="skel-root cat-skel" aria-busy="true" aria-live="polite">
        {body}
      </div>
    )
  }

  return (
    <CatPage className="skel-root cat-skel" aria-busy="true" aria-live="polite">
      {body}
    </CatPage>
  )
}
