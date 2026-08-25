'use client'

import { useState } from 'react'
import { formatBeta, formatCount, formatElo } from '@/lib/categoryReport/copy'
import type { RankedProduct } from '@/lib/categoryReport/types'

function WellMarks({
  products,
  admin,
  label,
}: {
  products: RankedProduct[]
  admin: boolean
  label: string
}) {
  const [hoverId, setHoverId] = useState<number | null>(null)
  const hovered = products.find((p) => p.product_id === hoverId) ?? null

  if (products.length === 0) return null

  return (
    <div style={{ flex: '1 1 240px', minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            fontWeight: 400,
            color: 'var(--ink)',
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {products.length}
        </span>
        <span style={{ fontSize: 13, color: 'var(--ink-50)' }}>{label}</span>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 5,
          minHeight: 28,
          alignContent: 'flex-start',
        }}
        onMouseLeave={() => setHoverId(null)}
      >
        {products.map((p) => (
          <button
            key={p.product_id}
            type="button"
            title={p.name}
            aria-label={p.name}
            onMouseEnter={() => setHoverId(p.product_id)}
            onFocus={() => setHoverId(p.product_id)}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              border: p.is_focal
                ? '1.5px solid var(--sage, #3E6B4A)'
                : 'none',
              background:
                hoverId === p.product_id
                  ? 'var(--sage, #3E6B4A)'
                  : p.is_focal
                    ? 'var(--sage, #3E6B4A)'
                    : 'rgba(62, 107, 74, 0.28)',
              cursor: 'default',
              padding: 0,
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      <div
        style={{
          minHeight: 20,
          marginTop: 8,
          fontSize: 12,
          color: 'var(--ink-50)',
          lineHeight: 1.4,
        }}
      >
        {hovered ? (
          <>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{hovered.name}</span>
            {hovered.brand ? ` · ${hovered.brand}` : ''}
            {' · '}
            {formatCount(hovered.n_decisions)} decisions
            {admin ? (
              <>
                {' · '}Elo {formatElo(hovered.elo)}
                {' · '}β {formatBeta(hovered.beta)}
              </>
            ) : null}
          </>
        ) : (
          <span style={{ color: 'var(--ink-30)' }}>Hover a mark</span>
        )}
      </div>
    </div>
  )
}

/** Thin band under the preference field — not a separate chapter. */
export default function UnboundWell({
  undefeated,
  winless,
  admin,
  kicker,
}: {
  undefeated: RankedProduct[]
  winless: RankedProduct[]
  admin: boolean
  kicker?: string | null
}) {
  if (undefeated.length === 0 && winless.length === 0 && !kicker) return null

  return (
    <div
      style={{
        marginTop: 8,
        paddingTop: 22,
        borderTop: '1px solid var(--mist)',
      }}
    >
      {kicker ? (
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink-50)',
            margin: '0 0 14px',
            lineHeight: 1.45,
          }}
        >
          {kicker}
          <span style={{ color: 'var(--ink-30)' }}>
            {' '}
            — undefeated and winless stay off the axis.
          </span>
        </p>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: '0 0 14px', lineHeight: 1.45 }}>
          Undefeated and winless products are not placed on the preference axis.
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
        <WellMarks products={undefeated} admin={admin} label="undefeated" />
        <WellMarks products={winless} admin={admin} label="winless" />
      </div>
    </div>
  )
}
