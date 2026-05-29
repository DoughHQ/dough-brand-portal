'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PortalUser, Brand, BrandSubscription, BrandProduct } from '@/lib/queries'

interface ProductsClientProps {
  portalUser: PortalUser
  brand: Brand
  subscription: BrandSubscription | null
  products: BrandProduct[]
  claimedIds: number[]
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Active today'
  if (days === 1) return 'Active yesterday'
  if (days < 30) return `Active ${days} days ago`
  const months = Math.floor(days / 30)
  return `Active ${months} month${months > 1 ? 's' : ''} ago`
}

function groupKey(l2: string | null): string {
  return l2 ?? 'Other'
}

type ProductGroup = {
  name: string
  products: BrandProduct[]
  totalBattles: number
}

function ProductCard({ product, isClaimed, onSelect }: { product: BrandProduct; isClaimed: boolean; onSelect: () => void }) {
  const winRatePct =
    product.battles_total > 0
      ? Math.round((product.battles_won / product.battles_total) * 100)
      : null

  return (
    <div
      onClick={onSelect}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        ...(isClaimed ? { borderLeft: '2px solid var(--sage)' } : {}),
        borderRadius: 'var(--r-md)',
        padding: 16,
        transition: 'border-color 0.15s var(--ease)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--ink-30)'
        if (isClaimed) e.currentTarget.style.borderLeftColor = 'var(--sage)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--ink-10)'
        if (isClaimed) e.currentTarget.style.borderLeftColor = 'var(--sage)'
      }}
    >
      <div
        style={{
          height: 80,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt=""
            style={{ maxHeight: 72, maxWidth: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--r-sm)',
              background: 'var(--surface-1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--ink-30)',
            }}
          >
            {product.product_name_clean.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink)',
          lineHeight: 1.35,
          marginBottom: 4,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.product_name_clean}
        {product.product_flavor_variant && (
          <span style={{ color: 'var(--ink-50)' }}> · {product.product_flavor_variant}</span>
        )}
      </div>

      {product.l3_name && (
        <div style={{ fontSize: 11, color: 'var(--ink-50)', marginBottom: 12 }}>{product.l3_name}</div>
      )}

      <div style={{ borderTop: '1px solid var(--ink-10)', marginBottom: 12 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-50)' }}>ELO Score</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
          {product.elo_score != null ? Math.round(product.elo_score).toString() : '—'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-50)' }}>L2 Rank</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
          {product.user_percentile != null
            ? `${Math.round(product.user_percentile)}th pct`
            : '—'}
        </span>
      </div>

      {isClaimed ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-50)' }}>Win Rate</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
              {winRatePct != null ? `${winRatePct}%` : '—'}
            </span>
          </div>
          {product.battles_total > 0 && winRatePct != null && (
            <div
              style={{
                height: 3,
                background: 'var(--ink-10)',
                borderRadius: 2,
                marginTop: -4,
                marginBottom: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${winRatePct}%`,
                  background: 'var(--sage)',
                  borderRadius: 2,
                  height: '100%',
                }}
              />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-50)' }}>Battles</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
              {product.battles_total > 0 ? product.battles_total.toString() : '—'}
            </span>
          </div>
          {product.battles_total > 0 && product.last_battle_at && (
            <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 8 }}>
              {relativeTime(product.last_battle_at)}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-50)' }}>Win Rate</span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>—</span>
              <span
                style={{
                  fontSize: 10,
                  background: 'var(--sage-pale)',
                  color: 'var(--sage)',
                  borderRadius: 'var(--r-sm)',
                  padding: '2px 8px',
                  marginLeft: 8,
                  fontWeight: 500,
                }}
              >
                Unlock
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-50)' }}>Battles</span>
            <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>—</span>
          </div>
        </>
      )}
    </div>
  )
}

function CategoryGroupSection({
  group,
  expanded,
  onToggle,
  onProductSelect,
}: {
  group: ProductGroup
  expanded: boolean
  onToggle: () => void
  onProductSelect: (productId: number) => void
}) {
  const visible = expanded ? group.products : group.products.slice(0, 4)
  const hasMore = group.products.length > 4

  return (
    <section>
      <div
        style={{
          marginTop: 36,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-80)' }}>{group.name}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-30)', marginLeft: 8 }}>
            ({group.products.length.toLocaleString()} products)
          </span>
          {group.totalBattles > 0 && (
            <span style={{ fontSize: 12, color: 'var(--ink-50)', marginLeft: 4 }}>
              · {group.totalBattles.toLocaleString()} battles
            </span>
          )}
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={onToggle}
            style={{
              fontSize: 12,
              color: 'var(--ink-50)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 400,
              padding: 0,
            }}
          >
            {expanded ? 'Show less' : 'Show all →'}
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {visible.map(product => (
          <ProductCard
            key={product.product_id}
            product={product}
            isClaimed={product.is_claimed}
            onSelect={() => onProductSelect(product.product_id)}
          />
        ))}
      </div>
    </section>
  )
}

export default function ProductsClient({
  brand,
  subscription,
  products,
  claimedIds,
}: ProductsClientProps) {
  const router = useRouter()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const categoryCount = useMemo(() => {
    const names = new Set(products.map(p => groupKey(p.l2_name)))
    return names.size
  }, [products])

  const leadingClaimed = useMemo(() => {
    if (claimedIds.length === 0) return null
    const claimed = products.filter(p => p.is_claimed)
    if (!claimed.length) return null
    return [...claimed].sort((a, b) => b.battles_total - a.battles_total)[0]
  }, [products, claimedIds])

  const groups = useMemo((): ProductGroup[] => {
    const map = new Map<string, BrandProduct[]>()
    for (const p of products) {
      const key = groupKey(p.l2_name)
      const list = map.get(key) ?? []
      list.push(p)
      map.set(key, list)
    }

    const result: ProductGroup[] = []
    map.forEach((prods, name) => {
      const sorted = [...prods].sort((a, b) => b.total_battles - a.total_battles)
      const totalBattles = sorted.reduce((sum, p) => sum + p.battles_total, 0)
      result.push({ name, products: sorted, totalBattles })
    })

    const withBattles = result
      .filter(g => g.products.some(p => p.battles_total > 0))
      .sort((a, b) => b.totalBattles - a.totalBattles)
    const withoutBattles = result
      .filter(g => !g.products.some(p => p.battles_total > 0))
      .sort((a, b) => a.name.localeCompare(b.name))

    return [...withBattles, ...withoutBattles]
  }, [products])

  const withBattleData = products.filter(p => p.battles_total > 0).length
  const skuLimit = subscription?.total_sku_limit ?? 1

  const signalContent = (() => {
    if (claimedIds.length > 0 && leadingClaimed) {
      const winPct =
        leadingClaimed.battles_total > 0
          ? Math.round((leadingClaimed.battles_won / leadingClaimed.battles_total) * 100)
          : 0
      const category = leadingClaimed.l3_name ?? 'this category'
      const lastActive = leadingClaimed.last_battle_at
        ? relativeTime(leadingClaimed.last_battle_at).replace(/^Active /, '')
        : 'recently'
      return {
        eyebrow: 'LEADING SKU',
        headline: `${leadingClaimed.product_name_clean} is winning ${winPct}% of head-to-head battles in ${category}.`,
        subline: `${leadingClaimed.battles_total} battles recorded · Last active ${lastActive}`,
        showClaimCta: false,
      }
    }
    return {
      eyebrow: 'YOUR PORTFOLIO',
      headline: `${brand.brand_name} has ${products.length.toLocaleString()} products in the Dough database across ${categoryCount} categories.`,
      subline: 'Claim a SKU to begin receiving product-level preference intelligence.',
      showClaimCta: true,
    }
  })()

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '40px 32px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Signal card */}
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-lg)',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              color: 'var(--ink-50)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 8,
              fontWeight: 400,
            }}
          >
            {signalContent.eyebrow}
          </div>
          <div
            style={{
              fontSize: 22,
              fontFamily: 'var(--font-serif)',
              fontWeight: 400,
              color: 'var(--ink)',
              lineHeight: 1.35,
              marginBottom: 8,
            }}
          >
            {signalContent.headline}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5 }}>
            {signalContent.subline}
          </div>
        </div>
        {signalContent.showClaimCta && (
          <Link
            href="/claim"
            style={{
              flexShrink: 0,
              background: 'var(--sage)',
              color: 'var(--white)',
              borderRadius: 'var(--r-sm)',
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              border: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Claim your first SKU
          </Link>
        )}
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total SKUs', value: products.length.toLocaleString() },
          { label: 'With Battle Data', value: withBattleData.toLocaleString() },
          {
            label: 'Claimed',
            value: `${claimedIds.length} of ${skuLimit}`,
          },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: 'var(--surface-1)',
              borderRadius: 'var(--r-md)',
              padding: '14px 20px',
              display: 'flex',
              flexDirection: 'column',
              flex: '1 1 160px',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--ink-50)', fontWeight: 400, marginBottom: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 20, color: 'var(--ink)', fontWeight: 500 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Category groups */}
      {groups.map(group => (
        <CategoryGroupSection
          key={group.name}
          group={group}
          expanded={!!expandedGroups[group.name]}
          onToggle={() =>
            setExpandedGroups(prev => ({ ...prev, [group.name]: !prev[group.name] }))
          }
          onProductSelect={(productId) => router.push(`/products/${productId}`)}
        />
      ))}

      {groups.length === 0 && (
        <div style={{ marginTop: 48, textAlign: 'center', fontSize: 13, color: 'var(--ink-50)' }}>
          No products found for this brand.
        </div>
      )}
    </div>
  )
}
