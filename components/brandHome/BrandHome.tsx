'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import type { ProductSignalCardModel } from '@/lib/brandHome/productSignalCards'
import ProductSignalCard from '@/components/brandHome/ProductSignalCard'
import CatalogHealthCard from '@/components/brandHome/CatalogHealthCard'
import type { CatalogHealth } from '@/lib/brandHome/catalogHealth'
import './brandHome.css'

function pulseItem(model: BrandHomeModel, key: string) {
  return model.pulse.find((item) => item.key === key) ?? null
}

function CatArt({ name, src }: { name: string; src: string | null }) {
  const letter = name.trim().slice(0, 1).toUpperCase() || 'C'
  return (
    <div className="bh-cat-art" aria-hidden>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" />
      ) : (
        <span className="bh-cat-art-fallback">{letter}</span>
      )}
    </div>
  )
}

function StripIcon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function BrandHome({
  model,
  profileSlot,
  totalProductCount = 0,
  totalBattles = 0,
  signalCards = [],
  catalogHealth,
  domainVerified = false,
}: {
  model: BrandHomeModel
  profileSlot?: ReactNode
  totalProductCount?: number
  totalBattles?: number
  signalCards?: ProductSignalCardModel[]
  catalogHealth?: CatalogHealth
  domainVerified?: boolean
}) {
  const hasCatalogProducts = totalProductCount > 0
  const hasProductSignal = signalCards.length > 0
  const [lead, ...rest] = signalCards
  const categoriesPulse = pulseItem(model, 'categories')
  const battledPulse = pulseItem(model, 'battled')
  const studiesPulse = pulseItem(model, 'studies')

  const strip: {
    key: string
    label: string
    value: string
    sub?: string
    icon: string
  }[] = [
    {
      key: 'products',
      label: 'Products',
      value: totalProductCount.toLocaleString(),
      sub:
        battledPulse != null
          ? `${battledPulse.value} with battles`
          : `${model.productsWithBattles.toLocaleString()} with battles`,
      icon: 'M4 7h16M4 12h16M4 17h10',
    },
    {
      key: 'categories',
      label: 'Categories',
      value: categoriesPulse?.value ?? String(model.categories.length),
      sub: categoriesPulse?.detail ?? 'With your products',
      icon: 'M4 20V10l8-6 8 6v10H4z',
    },
    {
      key: 'comparisons',
      label: 'Comparisons',
      value: totalBattles.toLocaleString(),
      icon: 'M7 10h10M7 14h6M5 5h14v14H5z',
    },
    {
      key: 'studies',
      label: 'Studies',
      value: studiesPulse?.value ?? String(model.openStudiesCount),
      sub: studiesPulse?.detail ?? 'Live or scheduled',
      icon: 'M8 6h8v14H8zM10 9h4',
    },
  ]

  return (
    <div className="bh-page">
      <div className="bh-top">
        <div className="bh-top-main">{profileSlot}</div>
        <Link href="/studies/new" className="bh-new-study">
          <span aria-hidden>+</span> New study
        </Link>
      </div>

      <section className="bh-strip" aria-label="Portfolio snapshot">
        {strip.map((cell) => (
          <div key={cell.key} className="bh-strip-cell">
            <div className="bh-strip-icon">
              <StripIcon d={cell.icon} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="bh-strip-label">{cell.label}</div>
              <div className="bh-strip-value">{cell.value}</div>
              {cell.sub ? <div className="bh-strip-sub">{cell.sub}</div> : null}
            </div>
          </div>
        ))}
      </section>

      <div className="bh-grid">
        <div className="bh-col">
          <section>
            <div className="bh-section-head">
              <h2 className="bh-h">Your products</h2>
              <Link href="/products" className="bh-link">
                View all products →
              </Link>
            </div>
            {!hasCatalogProducts ? (
              <EmptyPanel
                title="Bring your products into Dough"
                body="Add products to start building your brand workspace."
                href="/products"
                cta="Add products →"
              />
            ) : !hasProductSignal ? (
              <EmptyPanel
                title="No product signal yet"
                body="Your products are on Dough. As consumers compare products they’ve tried, preference signals will begin appearing here."
                href="/products"
                cta="See all products →"
              />
            ) : lead ? (
              <div className="bh-panel">
                <ProductSignalCard card={lead} variant="lead" />
                {rest.length > 0 ? (
                  <div className="bh-product-list">
                    {rest.map((card) => (
                      <ProductSignalCard key={card.productId} card={card} variant="row" />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section>
            <div className="bh-section-head">
              <h2 className="bh-h">Your categories</h2>
              <Link href="/categories" className="bh-link">
                View all categories →
              </Link>
            </div>
            {model.categories.length === 0 ? (
              <EmptyPanel
                title="No categories yet"
                body="Claim products so they map into taxonomy categories."
                href="/products"
                cta="Go to products →"
              />
            ) : (
              <div className="bh-cats">
                {model.categories.map((c) => {
                  const status = c.unlocked ? (c.status === 'building' ? 'building' : 'active') : 'locked'
                  return (
                    <Link
                      key={c.l2NodeId}
                      href={c.href}
                      className={`bh-cat${c.unlocked ? '' : ' is-locked'}`}
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
            )}
          </section>
        </div>

        <div className="bh-col">
          {catalogHealth ? (
            <CatalogHealthCard health={catalogHealth} domainVerified={domainVerified} />
          ) : null}

          <section className="bh-panel" aria-labelledby="bh-hero-heading">
            <div className="bh-hero">
              <div className="bh-eyebrow">{model.hero.eyebrow}</div>
              <h2 id="bh-hero-heading" className="bh-hero-title">
                {model.hero.headline}
              </h2>
              <p className="bh-hero-body">{model.hero.body}</p>
              <Link href={model.hero.ctaHref} className="bh-hero-cta">
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
        </div>
      </div>

      <section>
        <div className="bh-section-head">
          <h2 className="bh-h">Your research</h2>
          <Link href="/studies/new" className="bh-link">
            + New study
          </Link>
        </div>
        {model.studies.length === 0 ? (
          <EmptyPanel
            title="No active research"
            body="Launch a study when you want focused feedback beyond ongoing category intelligence."
            href="/studies/new"
            cta="+ New study"
          />
        ) : (
          <div className="bh-studies">
            {model.studies.map((s) => (
              <div key={s.missionId} className="bh-study">
                <div className="bh-eyebrow">{s.badge}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--sage-dark)', marginBottom: 6 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-50)', marginBottom: s.progress != null ? 8 : 10 }}>
                  {s.detail}
                </div>
                {s.progress != null ? (
                  <div
                    style={{
                      height: 4,
                      borderRadius: 99,
                      background: 'var(--mist)',
                      overflow: 'hidden',
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ width: `${s.progress}%`, height: '100%', background: 'var(--sage)' }} />
                  </div>
                ) : null}
                <Link href={s.href} className="bh-link">
                  {s.ctaLabel} →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function EmptyPanel({
  title,
  body,
  href,
  cta,
}: {
  title: string
  body: string
  href: string
  cta: string
}) {
  return (
    <div className="bh-empty">
      <p className="bh-empty-title">{title}</p>
      <p className="bh-empty-body">{body}</p>
      <Link href={href} className="bh-link">
        {cta}
      </Link>
    </div>
  )
}
