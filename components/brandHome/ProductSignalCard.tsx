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

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function HeroStage({ card }: { card: ProductSignalCardModel }) {
  if (card.imageUrl) {
    return (
      <div
        style={{
          height: 220,
          background: 'var(--cream, #faf8f3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.imageUrl}
          alt=""
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        height: 220,
        background: 'var(--cream, #faf8f3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderBottom: '1px dashed var(--mist)',
        color: 'var(--sage)',
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 99,
          border: '1px dashed rgba(62, 107, 74, 0.35)',
          background: 'rgba(62, 107, 74, 0.06)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <PlusIcon />
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: 'var(--sage)',
        }}
      >
        Add image
      </span>
    </div>
  )
}

export default function ProductSignalCard({ card }: { card: ProductSignalCardModel }) {
  const showElo = SHOW_POPULATION_ELO && card.populationElo != null

  return (
    <article
      className="product-signal-card"
      style={{
        background: 'var(--paper)',
        boxShadow: '0 0 0 1px var(--mist)',
        borderRadius: 'var(--r-lg, 12px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        transition: 'transform var(--motion-duration, 200ms) var(--motion-ease), box-shadow var(--motion-duration, 200ms) var(--motion-ease)',
      }}
    >
      <Link
        href={card.href}
        style={{
          display: 'block',
          textDecoration: 'none',
          color: 'inherit',
          minWidth: 0,
        }}
      >
        <HeroStage card={card} />
        <div style={{ padding: '16px 18px 0' }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 17,
              fontWeight: 400,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {card.name}
          </div>
          {card.category ? (
            <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 4 }}>{card.category}</div>
          ) : null}
        </div>
      </Link>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 18px 16px',
          marginTop: 'auto',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              lineHeight: 1,
              color: 'var(--ink)',
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {card.comparisonEvents.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-50)', marginTop: 5 }}>comparison events</div>
        </div>

        {card.standing.unlocked && card.standing.rankLabel ? (
          <div style={{ textAlign: 'right', minWidth: 0, maxWidth: '55%' }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                lineHeight: 1.25,
                color: 'var(--amber)',
                letterSpacing: '-0.01em',
              }}
            >
              {card.standing.rankLabel}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-50)', marginTop: 4 }}>Category standing</div>
          </div>
        ) : (
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
        )}
      </div>

      {showElo ? (
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
      ) : null}
    </article>
  )
}
