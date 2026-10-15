import type { ConceptTestReport } from '@/lib/conceptReport/conceptTestTypes'
import styles from '@/components/reportStory/reportStory.module.css'
import { pct } from './storyFormat'

type Curve = ConceptTestReport['price'][number]

export function DemandCurve({ curves }: { curves: Curve[] }) {
  const visible = curves.filter(
    (curve) =>
      !curve.report.below_reporting_floor &&
      (curve.report.demand_curve?.length ?? 0) > 0,
  )
  if (!visible.length) return null
  const allPoints = visible.flatMap((curve) => curve.report.demand_curve ?? [])
  const minPrice = Math.min(...allPoints.map((point) => point.price))
  const maxPrice = Math.max(...allPoints.map((point) => point.price))
  const span = Math.max(1, maxPrice - minPrice)
  const left = 48
  const right = 536
  const top = 18
  const bottom = 196
  const x = (price: number) =>
    left + ((price - minPrice) / span) * (right - left)
  const y = (share: number) => bottom - share * (bottom - top)
  const pathFor = (curve: Curve) =>
    (curve.report.demand_curve ?? [])
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L'
        return `${command}${x(point.price).toFixed(1)},${y(
          point.share_would_pay_gte,
        ).toFixed(1)}`
      })
      .join(' ')

  return (
    <>
      <svg
        className={styles.chart}
        viewBox="0 0 560 235"
        role="img"
        aria-label="Stated willingness-to-pay demand curves"
      >
        {[0, 0.5, 1].map((share) => (
          <g key={share}>
            <line
              className={styles.chartGrid}
              x1={left}
              x2={right}
              y1={y(share)}
              y2={y(share)}
            />
            <text
              className={styles.chartLabel}
              x={left - 9}
              y={y(share) + 3}
              textAnchor="end"
            >
              {pct(share)}
            </text>
          </g>
        ))}
        {[minPrice, maxPrice].map((price) => (
          <text
            className={styles.chartLabel}
            x={x(price)}
            y={bottom + 24}
            textAnchor={price === minPrice ? 'start' : 'end'}
            key={price}
          >
            ${price.toFixed(2)}
          </text>
        ))}
        {visible.map((curve, curveIndex) => (
          <g key={curve.ref}>
            <path
              className={
                curveIndex === 0 ? styles.chartLine : styles.chartLineMuted
              }
              d={pathFor(curve)}
            />
            {(curve.report.demand_curve ?? []).map((point) => (
              <circle
                className={
                  curveIndex === 0 ? styles.chartPoint : styles.chartPointMuted
                }
                cx={x(point.price)}
                cy={y(point.share_would_pay_gte)}
                r="3.5"
                key={`${point.price}-${point.share_would_pay_gte}`}
              />
            ))}
          </g>
        ))}
      </svg>
      <div className={styles.legend}>
        {visible.map((curve, index) => (
          <span key={curve.ref}>
            <i
              className={
                index === 0 ? styles.legendSwatch : styles.legendSwatchMuted
              }
            />
            {curve.name}
          </span>
        ))}
      </div>
    </>
  )
}
