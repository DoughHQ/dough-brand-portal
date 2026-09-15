import SkeletonBone from '@/components/portal/SkeletonBone'
import '@/components/brandHome/brandHome.css'
import './home_skeleton.css'

/**
 * Brand Home route skeleton — layout twin of BrandHome.
 * Wired from app/(portal)/dashboard/loading.tsx.
 */
export default function HomeSkeleton() {
  return (
    <div className="bh-page skel-root bh-skel" aria-busy="true" aria-live="polite">
      <span className="skel-sr">Loading home</span>

      <header className="bh-top">
        <div className="bh-top-main">
          <div className="bh-skel-identity">
            <SkeletonBone className="bh-skel-logo" />
            <div className="bh-skel-identity-copy">
              <SkeletonBone className="bh-skel-title" />
              <SkeletonBone className="bh-skel-line bh-skel-line-lg" />
              <SkeletonBone className="bh-skel-line bh-skel-line-sm" />
              <SkeletonBone className="bh-skel-chip" />
            </div>
          </div>
        </div>
        <SkeletonBone className="bh-skel-cta" />
      </header>

      <section className="bh-strip" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bh-strip-cell" style={{ ['--skel-i' as string]: i }}>
            <SkeletonBone className="bh-skel-strip-icon" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <SkeletonBone className="bh-skel-line bh-skel-line-xs" />
              <SkeletonBone className="bh-skel-strip-value" />
              <SkeletonBone className="bh-skel-line bh-skel-line-sm" />
            </div>
          </div>
        ))}
      </section>

      <div className="bh-grid">
        <div className="bh-col bh-col-main">
          <section className="bh-region">
            <div className="bh-section-head">
              <SkeletonBone className="bh-skel-heading" />
              <SkeletonBone className="bh-skel-link" />
            </div>
            <div className="bh-panel bh-skel-panel">
              <div className="bh-skel-lead">
                <SkeletonBone className="bh-skel-lead-photo" />
                <div className="bh-skel-lead-copy">
                  <SkeletonBone className="bh-skel-line bh-skel-line-xs" />
                  <SkeletonBone className="bh-skel-line bh-skel-line-md" />
                  <SkeletonBone className="bh-skel-line bh-skel-line-lg" />
                  <SkeletonBone className="bh-skel-line bh-skel-line-sm" />
                </div>
              </div>
              <div className="bh-skel-rows">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="bh-skel-row" style={{ ['--skel-i' as string]: i + 1 }}>
                    <SkeletonBone className="bh-skel-row-thumb" />
                    <div className="bh-skel-row-copy">
                      <SkeletonBone className="bh-skel-line bh-skel-line-md" />
                      <SkeletonBone className="bh-skel-line bh-skel-line-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bh-region">
            <div className="bh-section-head">
              <SkeletonBone className="bh-skel-heading" />
              <SkeletonBone className="bh-skel-link" />
            </div>
            <div className="bh-skel-cats">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="bh-skel-cat" style={{ ['--skel-i' as string]: i }}>
                  <SkeletonBone className="bh-skel-cat-art" />
                  <div className="bh-skel-cat-body">
                    <SkeletonBone className="bh-skel-line bh-skel-line-md" />
                    <SkeletonBone className="bh-skel-line bh-skel-line-sm" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="bh-col bh-col-aside" aria-hidden>
          <div className="bh-panel bh-skel-health">
            <SkeletonBone className="bh-skel-heading" />
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="bh-skel-health-row" style={{ ['--skel-i' as string]: i }}>
                <SkeletonBone className="bh-skel-line bh-skel-line-md" />
                <SkeletonBone className="bh-skel-bar" />
              </div>
            ))}
          </div>

          <div className="bh-panel bh-skel-hero-card">
            <SkeletonBone className="bh-skel-line bh-skel-line-xs" />
            <SkeletonBone className="bh-skel-hero-title" />
            <SkeletonBone className="bh-skel-line bh-skel-line-lg" />
            <SkeletonBone className="bh-skel-line bh-skel-line-md" />
            <SkeletonBone className="bh-skel-chip" />
          </div>
        </aside>
      </div>
    </div>
  )
}
