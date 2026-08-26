'use client'

import Link from 'next/link'
import { SHOW_POPULATION_ELO } from '@/lib/flags'
import type { ProductSignalCardModel } from '@/lib/brandHome/productSignalCards'

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function BuildingPill() {
  return <span className="bh-pill">Building signal</span>
}

function UnlockStudy({ card }: { card: ProductSignalCardModel }) {
  return (
    <div className="product-signal-locked" style={{ position: 'relative', flexShrink: 0 }}>
      <Link
        href="/studies/new"
        title={card.standing.tooltip}
        aria-label={card.standing.tooltip}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          textDecoration: 'none',
          color: 'var(--amber)',
          fontSize: 12,
          fontWeight: 600,
          padding: '6px 10px',
          borderRadius: 99,
          border: '1px solid rgba(192, 120, 24, 0.28)',
          background: 'var(--amber-soft)',
          whiteSpace: 'nowrap',
        }}
      >
        <LockIcon />
        Unlock with a study
      </Link>
      <span className="product-signal-tip" role="tooltip">
        {card.standing.tooltip}
      </span>
    </div>
  )
}

function EloFooter({ card }: { card: ProductSignalCardModel }) {
  const showElo = SHOW_POPULATION_ELO && card.populationElo != null
  if (!showElo) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        margin: '0 18px 16px',
        paddingTop: 12,
        borderTop: '1px solid var(--mist)',
        fontSize: 11,
        color: 'var(--ink-50)',
      }}
    >
      <span>
        ELO {card.populationElo?.eloScore != null ? Math.round(card.populationElo.eloScore) : '—'}
        {' · '}
        {card.populationElo?.winRatePct != null
          ? `${Math.round(card.populationElo.winRatePct)}% win`
          : '— win'}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: 'var(--ink-50)',
          background: 'var(--surface-1)',
          border: '1px solid var(--mist)',
          borderRadius: 99,
          padding: '2px 8px',
        }}
      >
        n=1 · not population data
      </span>
    </div>
  )
}

export default function ProductSignalCard({
  card,
  variant = 'lead',
}: {
  card: ProductSignalCardModel
  variant?: 'lead' | 'row'
}) {
  const hasRank = Boolean(card.standing.unlocked && card.standing.rankLabel)
  const building = card.comparisonEvents > 0 && !hasRank

  if (variant === 'row') {
    return (
      <Link href={card.href} className="bh-product-row">
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt="" className="bh-product-thumb" />
        ) : (
          <span className="bh-product-thumb-empty" aria-hidden />
        )}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="bh-product-name" style={{ fontSize: 14, display: 'block' }}>
            {card.name}
          </span>
          {card.category ? (
            <span className="bh-meta" style={{ display: 'block' }}>
              {card.category}
            </span>
          ) : null}
        </span>
        <span className="bh-product-stat" style={{ fontSize: 16, marginTop: 0 }}>
          {card.comparisonEvents.toLocaleString()}
        </span>
      </Link>
    )
  }

  return (
    <article>
      <Link href={card.href} className="bh-product-lead">
        <div className="bh-product-photo">
          {card.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.imageUrl} alt="" />
          ) : (
            <span className="bh-product-photo-empty">Add image</span>
          )}
        </div>
        <div className="bh-product-copy">
          {hasRank && card.standing.rankLabel ? (
            <div className="bh-product-rank">{card.standing.rankLabel}</div>
          ) : null}
          <div className="bh-product-name">{card.name}</div>
          {card.category ? <div className="bh-meta">{card.category}</div> : null}
          <div className="bh-product-stat">{card.comparisonEvents.toLocaleString()}</div>
          <div className="bh-meta">comparison events</div>
          {building ? <BuildingPill /> : null}
          <div className="bh-product-cta">View product →</div>
        </div>
      </Link>
      {!hasRank ? (
        <div style={{ padding: '0 20px 14px' }}>
          <UnlockStudy card={card} />
        </div>
      ) : null}
      <EloFooter card={card} />
    </article>
  )
}
