import Link from 'next/link'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import type { CatalogHealth } from '@/lib/brandHome/catalogHealth'
import CatalogHealthCard from '@/components/brandHome/CatalogHealthCard'

export function HomeAside({
  model,
  catalogHealth,
  domainVerified,
}: {
  model: BrandHomeModel
  catalogHealth?: CatalogHealth
  domainVerified: boolean
}) {
  return (
    <aside className="bh-col bh-col-aside">
      {catalogHealth ? (
        <div className="bh-region bh-region-health">
          <CatalogHealthCard health={catalogHealth} domainVerified={domainVerified} />
        </div>
      ) : null}

      <section className="bh-panel bh-region bh-region-hero portal-panel" aria-labelledby="bh-hero-heading">
        <div className="bh-hero">
          <div className="bh-eyebrow">{model.hero.eyebrow}</div>
          <h2 id="bh-hero-heading" className="bh-hero-title">
            {model.hero.headline}
          </h2>
          <p className="bh-hero-body">{model.hero.body}</p>
          <Link href={model.hero.ctaHref} className="portal-btn portal-btn-cta bh-hero-cta">
            {model.hero.ctaLabel}
          </Link>
        </div>
        <div className="bh-hero-pulse">
          {model.pulse.map((item) => (
            <div key={item.key} className="bh-hero-pulse-cell">
              <div className="bh-hero-pulse-label">{item.label}</div>
              <div className="bh-hero-pulse-value">{item.value}</div>
              <div className="bh-hero-pulse-detail">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
