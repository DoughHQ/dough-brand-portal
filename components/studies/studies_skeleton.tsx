import SkeletonBone from '@/components/portal/SkeletonBone'
import '../../app/(portal)/studies/studiesPage.css'
import './studies_skeleton.css'

/**
 * Studies list skeleton — twin of StudiesClient canvas.
 */
export default function StudiesSkeleton() {
  return (
    <div className="studies-canvas skel-root studies-skel" aria-busy="true" aria-live="polite">
      <span className="skel-sr">Loading studies</span>

      <header className="studies-header">
        <div>
          <SkeletonBone className="studies-skel-title" />
          <SkeletonBone className="studies-skel-lede" />
        </div>
        <SkeletonBone className="studies-skel-cta" />
      </header>

      <div className="studies-kpi-wrap" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="studies-skel-kpi" style={{ ['--skel-i' as string]: i }}>
            <SkeletonBone className="studies-skel-line studies-skel-line-xs" />
            <SkeletonBone className="studies-skel-kpi-value" />
            <SkeletonBone className="studies-skel-line studies-skel-line-sm" />
          </div>
        ))}
      </div>

      <section className="studies-lifecycle" aria-hidden>
        <div className="studies-skel-section-head">
          <SkeletonBone className="studies-skel-section-title" />
          <SkeletonBone className="studies-skel-tabs" />
        </div>
        <div className="studies-skel-list">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="studies-skel-row" style={{ ['--skel-i' as string]: i }}>
              <div className="studies-skel-row-main">
                <SkeletonBone className="studies-skel-line studies-skel-line-lg" />
                <SkeletonBone className="studies-skel-line studies-skel-line-sm" />
              </div>
              <SkeletonBone className="studies-skel-badge" />
              <SkeletonBone className="studies-skel-row-cta" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
