import SkeletonBone from '@/components/portal/SkeletonBone'
import './reports_skeleton.css'

/**
 * Reports catalog skeleton — twin of ReportsClient canvas.
 * Used by route loading.tsx and client fetch wait.
 */
export default function ReportsSkeleton({ embedded = false }: { embedded?: boolean }) {
  return (
    <div
      className={`${embedded ? 'reports-skel-body' : 'reports-page'} skel-root reports-skel`}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="skel-sr">Loading reports</span>

      {!embedded ? (
        <header className="reports-skel-header">
          <SkeletonBone className="reports-skel-eyebrow" />
          <SkeletonBone className="reports-skel-title" />
          <SkeletonBone className="reports-skel-lede" />
        </header>
      ) : null}

      {!embedded ? (
        <div className="reports-skel-toolbar" aria-hidden>
          <SkeletonBone className="reports-skel-search" />
          <div className="reports-skel-filters">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonBone
                key={i}
                className="reports-skel-filter"
                // stagger via parent --skel-i on wrapper
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="reports-skel-section" aria-hidden>
        <SkeletonBone className="reports-skel-section-title" />
        <div className="reports-skel-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="reports-skel-card" style={{ ['--skel-i' as string]: i }}>
              <div className="reports-skel-card-top">
                <SkeletonBone className="reports-skel-line reports-skel-line-xs" />
                <SkeletonBone className="reports-skel-badge" />
              </div>
              <SkeletonBone className="reports-skel-card-title" />
              <SkeletonBone className="reports-skel-line reports-skel-line-lg" />
              <SkeletonBone className="reports-skel-line reports-skel-line-md" />
              <div className="reports-skel-card-foot">
                <SkeletonBone className="reports-skel-line reports-skel-line-sm" />
                <SkeletonBone className="reports-skel-card-cta" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
