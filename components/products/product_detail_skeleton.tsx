import SkeletonBone from '@/components/portal/SkeletonBone'
import '../../app/(portal)/products/[productId]/tabs/productDetailTabs.css'
import { pageShell } from '@/lib/productMaster/styles'
import './product_detail_skeleton.css'

const TAB_LABELS = [
  'Overview',
  'SKUs',
  'Pricing',
  'Ingredients',
  'Intelligence',
  'Studies',
  'Facets',
  'Images',
  'Activity',
]

/**
 * Product master skeleton — twin of ProductMasterClient overview canvas.
 */
export default function ProductDetailSkeleton() {
  return (
    <div className="pm-page skel-root pm-skel" style={pageShell} aria-busy="true" aria-live="polite">
      <span className="skel-sr">Loading product</span>

      <SkeletonBone className="pm-skel-back" />

      <div className="pm-hero pm-skel-hero" aria-hidden>
        <SkeletonBone className="pm-skel-hero-photo" />
        <div className="pm-skel-hero-copy">
          <SkeletonBone className="pm-skel-line pm-skel-line-path" />
          <SkeletonBone className="pm-skel-hero-title" />
          <SkeletonBone className="pm-skel-line pm-skel-line-md" />
          <SkeletonBone className="pm-skel-line pm-skel-line-sm" />
        </div>
      </div>

      <div className="pm-sku-header pm-skel-sku" aria-hidden>
        <div className="pm-skel-sku-main">
          <SkeletonBone className="pm-skel-line pm-skel-line-xs" />
          <SkeletonBone className="pm-skel-line pm-skel-line-lg" />
          <SkeletonBone className="pm-skel-line pm-skel-line-sm" />
        </div>
        <SkeletonBone className="pm-skel-sku-add" />
      </div>

      <div className="pm-tabs pm-skel-tabs" aria-hidden>
        {TAB_LABELS.map((label, i) => (
          <div key={label} className="pm-skel-tab" style={{ ['--skel-i' as string]: i }}>
            <SkeletonBone className={`pm-skel-tab-bone${i === 0 ? ' is-active' : ''}`} />
          </div>
        ))}
      </div>

      <div className="pm-overview-grid" aria-hidden>
        <div className="pm-overview-card pm-skel-card">
          <SkeletonBone className="pm-skel-card-heading" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="pm-skel-id-row" style={{ ['--skel-i' as string]: i }}>
              <SkeletonBone className="pm-skel-line pm-skel-line-label" />
              <SkeletonBone className="pm-skel-line pm-skel-line-value" />
            </div>
          ))}
        </div>

        <div className="pm-overview-card pm-skel-card">
          <SkeletonBone className="pm-skel-card-heading" />
          <SkeletonBone className="pm-skel-line pm-skel-line-path" />
          <SkeletonBone className="pm-skel-chip" />
          <SkeletonBone className="pm-skel-line pm-skel-line-sm" />
          <SkeletonBone className="pm-skel-blurb" />
          <SkeletonBone className="pm-skel-blurb pm-skel-blurb-short" />
        </div>

        <div className="pm-overview-card pm-overview-compete pm-skel-card">
          <SkeletonBone className="pm-skel-card-heading" />
          <div className="pm-skel-compete-grid">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="pm-skel-compete-cell" style={{ ['--skel-i' as string]: i }}>
                <SkeletonBone className="pm-skel-compete-thumb" />
                <SkeletonBone className="pm-skel-line pm-skel-line-md" />
                <SkeletonBone className="pm-skel-line pm-skel-line-xs" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
