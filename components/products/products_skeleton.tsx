import SkeletonBone from '@/components/portal/SkeletonBone'
import '@/components/categories/categoriesPage.css'
import '../../app/(portal)/products/productsPage.css'
import './products_skeleton.css'

/**
 * Products list skeleton — twin of ProductsClient brand catalog canvas.
 */
export default function ProductsSkeleton() {
  return (
    <div className="cat-page skel-root prod-skel" aria-busy="true" aria-live="polite">
      <span className="skel-sr">Loading products</span>

      <header className="cat-header">
        <div className="cat-header-copy">
          <SkeletonBone className="prod-skel-eyebrow" />
          <SkeletonBone className="prod-skel-title" />
          <SkeletonBone className="prod-skel-lede" />
        </div>
        <SkeletonBone className="prod-skel-cta" />
      </header>

      <div className="cat-summary" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="cat-summary-card prod-skel-summary" style={{ ['--skel-i' as string]: i }}>
            <SkeletonBone className="prod-skel-summary-icon" />
            <div className="prod-skel-summary-copy">
              <SkeletonBone className="prod-skel-line prod-skel-line-xs" />
              <SkeletonBone className="prod-skel-summary-value" />
              <SkeletonBone className="prod-skel-line prod-skel-line-sm" />
            </div>
          </div>
        ))}
      </div>

      <div className="prod-toolbar" aria-hidden>
        <SkeletonBone className="prod-skel-search" />
        <SkeletonBone className="prod-skel-filter" />
        <SkeletonBone className="prod-skel-toggle" />
      </div>

      <div className="cat-tile-grid" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="cat-tile prod-skel-tile" style={{ ['--skel-i' as string]: i }}>
            <SkeletonBone className="prod-skel-tile-art" />
            <div className="cat-tile-body prod-skel-tile-body">
              <SkeletonBone className="prod-skel-line prod-skel-line-xs" />
              <SkeletonBone className="prod-skel-line prod-skel-line-lg" />
              <SkeletonBone className="prod-skel-chip" />
              <SkeletonBone className="prod-skel-tile-btn" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
