import Link from 'next/link'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import { EmptyPanel } from './EmptyPanel'

export function OpenStudiesSection({ model }: { model: BrandHomeModel }) {
  return (
    <section className="bh-region bh-region-research">
      <div className="bh-section-head">
        <h2 className="bh-h">Open studies</h2>
        <Link href="/studies" className="bh-link">
          All studies →
        </Link>
      </div>
      {model.studies.length === 0 ? (
        <EmptyPanel
          title="No active research"
          body="Launch a study when you want focused feedback beyond ongoing category intelligence."
          href="/studies/new"
          cta="+ New study"
          ctaPrimary
        />
      ) : (
        <div className="bh-studies">
          {model.studies.map((s) => {
            const tone = s.badge.toLowerCase().includes('results')
              ? 'results'
              : s.badge.toLowerCase().includes('needs claims') ||
                  s.badge.toLowerCase().includes('payment')
                ? 'warn'
                : null
            return (
            <div
              key={s.missionId}
              className={`bh-study portal-panel${tone ? ` bh-study--${tone}` : ''}`}
            >
              <div className="bh-eyebrow">{s.badge}</div>
              <div className="bh-study-title">{s.title}</div>
              <div className="bh-study-detail">{s.detail}</div>
              {s.progress != null ? (
                <div className="bh-study-progress">
                  <div
                    className="bh-study-progress-fill"
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
              ) : null}
              <Link href={s.href} className="portal-btn portal-btn-secondary bh-study-cta">
                {s.ctaLabel}
              </Link>
            </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
