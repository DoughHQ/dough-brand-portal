import Link from 'next/link'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import { CatArt } from './CatArt'
import { EmptyPanel } from './EmptyPanel'

export function CategoriesSection({ model }: { model: BrandHomeModel }) {
  const phoneCategories = model.categories.slice(0, 3)
  return (
    <section className="bh-region bh-region-categories">
      <div className="bh-section-head">
        <h2 className="bh-h">Your categories</h2>
        <Link href="/categories" className="bh-link">
          View all categories →
        </Link>
      </div>
      {model.categories.length === 0 ? (
        <EmptyPanel
          title="No categories yet"
          body="Categories appear once your products are in the catalog."
          href="/products"
          cta="Go to products →"
        />

      ) : (
        <>
          <div className="bh-cats bh-cats-desktop">
            {model.categories.map((c) => {
              const status = c.unlocked ? (c.status === 'building' ? 'building' : 'active') : 'locked'
              return (
                <Link
                  key={c.l2NodeId}
                  href={c.href}
                  className={`bh-cat portal-panel${c.unlocked ? '' : ' is-locked'}`}
                >
                  <CatArt name={c.name} src={c.bannerImageUrl} />
                  <div className="bh-cat-body">
                    <div className="bh-cat-top">
                      <div className="bh-cat-name">{c.name}</div>
                      <span className={`bh-cat-status is-${status}`}>
                        {c.unlocked ? (c.status === 'building' ? 'Building' : 'Active') : 'Locked'}
                      </span>
                    </div>
                    <div className="bh-cat-detail">{c.detail}</div>
                    {!c.unlocked ? (
                      <div className="bh-cat-detail">Subscribe to open the full category Overview.</div>
                    ) : null}
                    <div className="bh-cat-cta">{c.ctaLabel}</div>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="bh-cat-phone-list" aria-label="Categories">
            {phoneCategories.map((c) => {
              const status = c.unlocked
                ? c.status === 'building'
                  ? 'Building'
                  : 'Active'
                : 'Locked'
              return (
                <Link
                  key={c.l2NodeId}
                  href={c.href}
                  className={`bh-cat-phone-row portal-panel${c.unlocked ? '' : ' is-locked'}`}
                >
                  <CatArt name={c.name} src={c.bannerImageUrl} />
                  <span className="bh-cat-phone-copy">
                    <span className="bh-cat-phone-name">{c.name}</span>
                    <span className="bh-cat-phone-meta">
                      {status}
                      {c.detail ? ` · ${c.detail}` : ''}
                    </span>
                  </span>
                  <span className="bh-cat-phone-chev" aria-hidden>
                    ›
                  </span>
                </Link>
              )
            })}
            {model.categories.length > phoneCategories.length ? (
              <Link href="/categories" className="bh-cat-phone-more">
                View all {model.categories.length} categories →
              </Link>
            ) : null}
          </div>
        </>
      )}
    </section>
  )
}
