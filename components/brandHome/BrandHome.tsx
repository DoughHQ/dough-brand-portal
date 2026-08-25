'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import type { ProductSignalCardModel } from '@/lib/brandHome/productSignalCards'
import ProductSignalCard from '@/components/brandHome/ProductSignalCard'

function greetingLabel(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const chipStyle: Record<string, { color: string; bg: string }> = {
  gaining: { color: 'var(--sage)', bg: 'var(--sage-soft)' },
  declining: { color: 'var(--clay, #a6543c)', bg: 'var(--clay-soft, rgba(166,84,60,0.14))' },
  stable: { color: 'var(--ink-50)', bg: 'var(--surface-1)' },
  building: { color: 'var(--amber)', bg: 'var(--amber-soft)' },
  active: { color: 'var(--sage)', bg: 'var(--sage-soft)' },
  locked: { color: 'var(--ink-50)', bg: 'var(--surface-1)' },
}

export default function BrandHome({
  model,
  profileSlot,
  totalProductCount = 0,
  signalCards = [],
}: {
  model: BrandHomeModel
  profileSlot?: ReactNode
  /** Catalog product count — not the same as model.products (signal watch list). */
  totalProductCount?: number
  /** Battled products from portfolio RPC — replaces the old intelligence list. */
  signalCards?: ProductSignalCardModel[]
}) {
  const greet = greetingLabel()
  const hasCatalogProducts = totalProductCount > 0
  const hasProductSignal = signalCards.length > 0

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1100, margin: '0 auto', padding: '32px 32px 72px' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <div style={{ minWidth: 0, flex: '1 1 280px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 34,
              fontWeight: 400,
              color: 'var(--ink)',
              margin: '0 0 8px',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}
          >
            {greet}, {model.brandName}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-50)', margin: 0, lineHeight: 1.5, maxWidth: 520 }}>
            Your brand on Dough — profile, products, and the categories you compete in.
          </p>
        </div>
        <Link
          href="/studies/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--sage-dark, var(--sage))',
            color: 'white',
            borderRadius: 6,
            padding: '11px 16px',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <span aria-hidden>+</span> New study
        </Link>
      </header>

      {/* Brand profile (welcome) */}
      {profileSlot ? <div style={{ marginBottom: 28 }}>{profileSlot}</div> : null}

      {/* Products */}
      <section style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              fontWeight: 400,
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            Your products
          </h3>
          <Link href="/products" style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500, textDecoration: 'none' }}>
            See all products →
          </Link>
        </div>
        {!hasCatalogProducts ? (
          <EmptyCard
            title="Bring your products into Dough"
            body="Add products to start building your brand workspace."
            href="/products"
            cta="Add products →"
          />
        ) : !hasProductSignal ? (
          <EmptyCard
            title="No product signal yet"
            body="Your products are on Dough. As consumers compare products they’ve tried, preference signals will begin appearing here."
            href="/products"
            cta="See all products →"
          />
        ) : (
          <div
            className="brand-home-signal"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 14,
            }}
          >
            {signalCards.map((card) => (
              <ProductSignalCard key={card.productId} card={card} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section style={{ marginBottom: 36 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              fontWeight: 400,
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            Your categories
          </h3>
          <Link href="/categories" style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500, textDecoration: 'none' }}>
            See more categories →
          </Link>
        </div>
        {model.categories.length === 0 ? (
          <EmptyCard
            title="No categories yet"
            body="Claim products so they map into taxonomy categories."
            href="/products"
            cta="Go to products →"
          />
        ) : (
          <div
            className="brand-home-cats"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            {model.categories.map((c) => {
              const tone = chipStyle[c.unlocked ? c.status : 'locked']
              return (
                <Link
                  key={c.l2NodeId}
                  href={c.href}
                  style={{
                    display: 'block',
                    background: 'var(--paper)',
                    boxShadow: '0 0 0 1px var(--mist)',
                    borderRadius: 8,
                    padding: '16px 16px 14px',
                    textDecoration: 'none',
                    color: 'inherit',
                    opacity: c.unlocked ? 1 : 0.92,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', flex: 1 }}>{c.name}</div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: tone.color,
                        background: tone.bg,
                        padding: '2px 7px',
                        borderRadius: 4,
                      }}
                    >
                      {c.unlocked ? (c.status === 'building' ? 'Building' : 'Active') : 'Locked'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.45 }}>{c.detail}</div>
                  {!c.unlocked ? (
                    <div style={{ fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.45, marginTop: 6 }}>
                      Subscribe to open the full category Overview.
                    </div>
                  ) : null}
                  <div style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500, marginTop: 10 }}>
                    {c.ctaLabel}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Strongest signal */}
      <section
        style={{
          background: 'var(--paper)',
          boxShadow: '0 0 0 1px var(--mist)',
          borderRadius: 8,
          padding: '28px 28px 24px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
            marginBottom: 10,
          }}
        >
          {model.hero.eyebrow}
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 26,
            fontWeight: 400,
            color: 'var(--ink)',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            maxWidth: 640,
          }}
        >
          {model.hero.headline}
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--ink-50)',
            margin: '0 0 20px',
            lineHeight: 1.55,
            maxWidth: 560,
          }}
        >
          {model.hero.body}
        </p>
        <Link
          href={model.hero.ctaHref}
          style={{
            display: 'inline-flex',
            background: 'var(--sage)',
            color: 'white',
            borderRadius: 6,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          {model.hero.ctaLabel}
        </Link>
      </section>

      {/* Portfolio pulse */}
      <section
        className="brand-home-pulse"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 36,
        }}
      >
        {model.pulse.map((item) => (
          <div
            key={item.key}
            style={{
              background: 'var(--paper)',
              boxShadow: '0 0 0 1px var(--mist)',
              borderRadius: 8,
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink-30)',
                marginBottom: 6,
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 24,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {item.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 4 }}>{item.detail}</div>
          </div>
        ))}
      </section>

      {/* Research */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              fontWeight: 400,
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            Your research
          </h3>
          <Link href="/studies/new" style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500, textDecoration: 'none' }}>
            + New study
          </Link>
        </div>
        {model.studies.length === 0 ? (
          <EmptyCard
            title="No active research"
            body="Launch a study when you want focused feedback beyond ongoing category intelligence."
            href="/studies/new"
            cta="+ New study"
          />
        ) : (
          <div
            className="brand-home-studies"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            {model.studies.map((s) => (
              <div
                key={s.missionId}
                style={{
                  background: 'var(--paper)',
                  boxShadow: '0 0 0 1px var(--mist)',
                  borderRadius: 8,
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-30)',
                    marginBottom: 6,
                  }}
                >
                  {s.badge}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-50)', marginBottom: s.progress != null ? 8 : 10 }}>
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
                    <div
                      style={{
                        width: `${s.progress}%`,
                        height: '100%',
                        background: 'var(--sage)',
                      }}
                    />
                  </div>
                ) : null}
                <Link
                  href={s.href}
                  style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500, textDecoration: 'none' }}
                >
                  {s.ctaLabel} →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        .product-signal-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 0 1px var(--mist), 0 8px 24px rgba(28, 38, 32, 0.08);
        }
        .product-signal-tip {
          position: absolute;
          right: 0;
          bottom: calc(100% + 8px);
          z-index: 2;
          max-width: 240px;
          padding: 8px 10px;
          border-radius: 6px;
          background: var(--sage-dark);
          color: var(--cream);
          font-size: 11px;
          line-height: 1.4;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        .product-signal-locked:hover .product-signal-tip,
        .product-signal-locked:focus-within .product-signal-tip {
          opacity: 1;
          visibility: visible;
        }
        @media (max-width: 720px) {
          .brand-home-cats,
          .brand-home-studies,
          .brand-home-signal { grid-template-columns: 1fr !important; }
          .brand-home-pulse { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .product-signal-card,
          .product-signal-card:hover {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}

function EmptyCard({
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
    <div
      style={{
        background: 'var(--paper)',
        boxShadow: '0 0 0 1px var(--mist)',
        borderRadius: 8,
        padding: '20px 18px',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>{title}</div>
      <p style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5, margin: '0 0 12px' }}>{body}</p>
      <Link href={href} style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500, textDecoration: 'none' }}>
        {cta}
      </Link>
    </div>
  )
}
