'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import type { ProductSignalCardModel } from '@/lib/brandHome/productSignalCards'
import ProductSignalCard from '@/components/brandHome/ProductSignalCard'
import CatalogHealthCard from '@/components/brandHome/CatalogHealthCard'
import WhatChangedStrip from '@/components/brandHome/WhatChangedStrip'
import { buildHomeAttention } from '@/lib/brandHome/homeAttention'
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
  catalogReady = true,
  brandId,
}: {
  model: BrandHomeModel
  profileSlot?: ReactNode
  totalProductCount?: number
  totalBattles?: number
  signalCards?: ProductSignalCardModel[]
  catalogHealth?: CatalogHealth
  domainVerified?: boolean
  catalogReady?: boolean
  brandId?: number
}) {
  const hasCatalogProducts = totalProductCount > 0
  const hasProductSignal = signalCards.length > 0
  const [lead, ...rest] = signalCards
  const categoriesPulse = pulseItem(model, 'categories')
  const battledPulse = pulseItem(model, 'battled')
  const studiesPulse = pulseItem(model, 'studies')
  const phoneCategories = model.categories.slice(0, 3)
  const attention = buildHomeAttention({ model, catalogHealth })

  const strip: {
    key: string
    label: string
    value: string
    sub?: string
    icon: string
    href: string
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
      href: '/products',
    },
    {
      key: 'categories',
      label: 'Categories',
      value: categoriesPulse?.value ?? String(model.categories.length),
      sub: categoriesPulse?.detail ?? 'With your products',
      icon: 'M4 20V10l8-6 8 6v10H4z',
      href: '/categories',
    },
    {
      key: 'comparisons',
      label: 'Comparisons',
      value: totalBattles.toLocaleString(),
      icon: 'M7 10h10M7 14h6M5 5h14v14H5z',
      href: '/products',
    },
    {
      key: 'studies',
      label: 'Studies',
      value: studiesPulse?.value ?? String(model.openStudiesCount),
      sub: studiesPulse?.detail ?? 'Live or scheduled',
      icon: 'M8 6h8v14H8zM10 9h4',
      href: '/studies',
    },
  ]

  return (
    <div className="bh-page">
      {!catalogReady ? (
        <p className="bh-catalog-warming" role="status">
          Catalog rollup is catching up — counts below are live. Cards refresh when the cold clock
          finishes.
        </p>
      ) : null}
      <header className="bh-top">
        <div className="bh-top-main">{profileSlot}</div>
        <Link href="/studies/new" className="portal-btn portal-btn-cta bh-new-study">
          <span aria-hidden>+</span> New study
        </Link>
      </header>

      {attention.length > 0 ? (
        <section className="bh-ops portal-panel" aria-label="Needs attention">
          <div className="bh-ops-copy">
            <p className="bh-ops-eyebrow">Needs attention</p>
            <ul className="bh-ops-list">
              {attention.map((item) => (
                <li key={item.id} className="bh-ops-row">
                  <div>
                    <p className="bh-ops-title">{item.title}</p>
                    <p className="bh-ops-body">{item.body}</p>
                  </div>
                  <Link href={item.href} className="portal-btn portal-btn-secondary">
                    {item.ctaLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="bh-ops-actions">
            <Link href="/studies/new" className="portal-btn portal-btn-cta">
              New study
            </Link>
          </div>
        </section>
      ) : null}

      {brandId != null && brandId > 0 ? (
        <WhatChangedStrip brandId={brandId} model={model} />
      ) : null}

      <section className="bh-strip" aria-label="Portfolio snapshot">
        {strip.map((cell) => (
          <Link key={cell.key} href={cell.href} className="bh-strip-cell portal-panel">
            <div className="bh-strip-icon">
              <StripIcon d={cell.icon} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="bh-strip-label">{cell.label}</div>
              <div className="bh-strip-value">{cell.value}</div>
              {cell.sub ? <div className="bh-strip-sub">{cell.sub}</div> : null}
            </div>
          </Link>
        ))}
      </section>

      <div className="bh-grid">
        <div className="bh-col bh-col-main">
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

          <section className="bh-region bh-region-products">
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
              <div className="bh-panel bh-panel-products portal-panel">
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
                body="Claim products so they map into taxonomy categories."
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
        </div>

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
      </div>
    </div>
  )
}

function EmptyPanel({
  title,
  body,
  href,
  cta,
  ctaPrimary = false,
}: {
  title: string
  body: string
  href: string
  cta: string
  ctaPrimary?: boolean
}) {
  return (
    <div className="bh-empty portal-panel">
      <p className="bh-empty-title">{title}</p>
      <p className="bh-empty-body">{body}</p>
      <Link
        href={href}
        className={ctaPrimary ? 'portal-btn portal-btn-cta' : 'bh-link'}
      >
        {cta}
      </Link>
    </div>
  )
}
