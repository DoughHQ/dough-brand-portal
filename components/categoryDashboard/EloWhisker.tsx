import type { RankedProduct } from '@/lib/categoryReport/types'

export type EloAxis = { min: number; max: number }

/** Shared axis for a component. Points alone are enough — intervals are optional. */
export function componentAxis(products: RankedProduct[]): EloAxis | null {
  const vals: number[] = []
  for (const p of products) {
    if (p.elo != null) vals.push(p.elo)
    if (p.ci_available) {
      if (p.elo_lo != null) vals.push(p.elo_lo)
      if (p.elo_hi != null) vals.push(p.elo_hi)
    }
  }
  if (vals.length === 0) return null
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  if (max > min) {
    const pad = (max - min) * 0.06
    return { min: min - pad, max: max + pad }
  }
  return { min: min - 1, max: max + 1 }
}

function pct(value: number, axis: EloAxis): number {
  return ((value - axis.min) / (axis.max - axis.min)) * 100
}

export function EloWhisker({
  product,
  axis,
  size = 'compact',
}: {
  product: RankedProduct
  axis: EloAxis | null
  size?: 'compact' | 'hero'
}) {
  const height = size === 'hero' ? 40 : 28
  const midY = size === 'hero' ? 19 : 13
  const pointR = size === 'hero' ? 7 : 5

  if (!axis) {
    return (
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: size === 'hero' ? 20 : 18,
          color: product.is_focal ? 'var(--sage, #3E6B4A)' : 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
        }}
      >
        {product.elo != null ? Math.round(product.elo) : '—'}
      </div>
    )
  }

  const point = product.elo
  const showWhisker =
    product.ci_available &&
    product.elo_lo != null &&
    product.elo_hi != null &&
    product.elo_lo !== product.elo_hi

  const mid = point != null ? Math.max(0, Math.min(100, pct(point, axis))) : null
  const lo = showWhisker ? Math.max(0, Math.min(100, pct(product.elo_lo!, axis))) : null
  const hi = showWhisker ? Math.max(0, Math.min(100, pct(product.elo_hi!, axis))) : null
  const left = lo != null && hi != null ? Math.min(lo, hi) : 0
  const width = lo != null && hi != null ? Math.abs(hi - lo) : 0

  const stroke = product.is_focal ? 'var(--sage, #3E6B4A)' : 'var(--ink-50)'
  const fill = product.is_focal ? 'var(--sage, #3E6B4A)' : 'var(--ink)'

  return (
    <div
      style={{ position: 'relative', height, width: '100%' }}
      title={
        showWhisker && product.elo_lo != null && product.elo_hi != null && point != null
          ? `${Math.round(product.elo_lo)} – ${Math.round(point)} – ${Math.round(product.elo_hi)}`
          : product.ci_note ?? (point != null ? `Elo ${Math.round(point)}` : undefined)
      }
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: midY,
          height: 1,
          background: 'var(--ink-10)',
        }}
      />
      {showWhisker ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: `${left}%`,
              width: `${width}%`,
              top: midY - 3,
              height: 6,
              borderRadius: 99,
              background: stroke,
              opacity: 0.28,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `${left}%`,
              width: 2,
              top: midY - 6,
              height: 12,
              background: stroke,
              borderRadius: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `calc(${left + width}% - 2px)`,
              width: 2,
              top: midY - 6,
              height: 12,
              background: stroke,
              borderRadius: 1,
            }}
          />
        </>
      ) : null}
      {mid != null ? (
        <div
          style={{
            position: 'absolute',
            left: `calc(${mid}% - ${pointR}px)`,
            top: midY - pointR,
            width: pointR * 2,
            height: pointR * 2,
            borderRadius: '50%',
            background: fill,
            boxShadow: '0 0 0 2px var(--paper, #fff)',
            opacity: 1,
          }}
        />
      ) : null}
    </div>
  )
}

export function AxisHeader({
  axis,
  intervals,
}: {
  axis: EloAxis
  intervals?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
        color: 'var(--ink-30)',
        letterSpacing: '0.04em',
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 4,
        paddingLeft: 2,
      }}
    >
      <span>{Math.round(axis.min)}</span>
      <span>
        {intervals === false
          ? 'Elo (points — intervals unavailable)'
          : 'Elo (this field only)'}
      </span>
      <span>{Math.round(axis.max)}</span>
    </div>
  )
}
