'use client'

import type { QuestionResponse, WtpArm, WtpArmReport } from '@/lib/conceptReport/types'

const PALETTE = {
  line: 'var(--sage)',
  grid: 'var(--mist)',
  axis: 'var(--ink-faint)',
  label: 'var(--ink)',
  muted: 'var(--ink-muted)',
  faint: 'var(--ink-faint)',
  ring: 'var(--paper)',
}

function pct(x: number | null | undefined): string {
  if (x == null) return '—'
  return `${Math.round(x * 100)}%`
}

function money(x: number | null | undefined): string {
  if (x == null) return '—'
  return `$${Number.isInteger(x) ? x : x.toFixed(2)}`
}

function modalLabel(m: WtpArmReport['modal_band']): string | null {
  if (!m) return null
  if (m.label) return m.label
  if (m.low != null && m.high != null) return `$${m.low}–${m.high}`
  if (m.low != null) return `over $${m.low}`
  if (m.high != null) return `under $${m.high}`
  return null
}

/** One arm's reservation-price demand curve as an inline SVG (share who'd pay ≥ price). */
function DemandChart({ report, name }: { report: WtpArmReport; name: string }) {
  const pts = report.demand_curve
  const ceiling =
    report.rejection_rate != null ? 1 - report.rejection_rate : null

  // viewBox geometry
  const W = 340
  const H = 200
  const padL = 38
  const padR = 18
  const padT = 16
  const padB = 34
  const x0 = padL
  const x1 = W - padR
  const y0 = padT
  const y1 = H - padB

  const prices = pts.map((p) => p.price)
  const pMin = prices.length ? Math.min(...prices) : 0
  const pMax = prices.length ? Math.max(...prices) : 1
  const span = pMax - pMin

  const xOf = (price: number) =>
    span === 0 ? (x0 + x1) / 2 : x0 + ((price - pMin) / span) * (x1 - x0)
  const yOf = (share: number) => y1 - Math.max(0, Math.min(1, share)) * (y1 - y0)

  const gridShares = [0, 0.25, 0.5, 0.75, 1]

  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.price).toFixed(1)},${yOf(p.share_would_pay_gte).toFixed(1)}`)
    .join(' ')

  const ariaSummary =
    pts.length > 0
      ? `Demand curve for ${name}. At ${money(pts[0]!.price)}, ${pct(
          pts[0]!.share_would_pay_gte
        )} would pay at least this; falling to ${pct(
          pts[pts.length - 1]!.share_would_pay_gte
        )} at ${money(pts[pts.length - 1]!.price)}.${
          ceiling != null ? ` Reach ceiling ${pct(ceiling)} (1 − rejection).` : ''
        }`
      : `No priced demand curve for ${name}.`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', height: 'auto', maxWidth: 520 }}
      role="img"
      aria-label={ariaSummary}
    >
      {/* horizontal gridlines + y labels */}
      {gridShares.map((s) => {
        const y = yOf(s)
        return (
          <g key={`g-${s}`}>
            <line
              x1={x0}
              x2={x1}
              y1={y}
              y2={y}
              stroke={PALETTE.grid}
              strokeWidth={s === 0 ? 1 : 0.6}
              opacity={s === 0 ? 0.9 : 0.5}
            />
            <text
              x={x0 - 6}
              y={y + 3}
              textAnchor="end"
              fontSize={9}
              fill={PALETTE.faint}
              fontFamily="var(--font-sans)"
            >
              {Math.round(s * 100)}
            </text>
          </g>
        )
      })}

      {/* reach ceiling (1 − rejection_rate) */}
      {ceiling != null && ceiling < 0.999 ? (
        <g>
          <line
            x1={x0}
            x2={x1}
            y1={yOf(ceiling)}
            y2={yOf(ceiling)}
            stroke={PALETTE.faint}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text
            x={x1}
            y={yOf(ceiling) - 4}
            textAnchor="end"
            fontSize={9}
            fill={PALETTE.muted}
            fontFamily="var(--font-sans)"
          >
            ceiling {pct(ceiling)}
          </text>
        </g>
      ) : null}

      {/* x ticks + price labels */}
      {pts.map((p) => (
        <text
          key={`x-${p.price}`}
          x={xOf(p.price)}
          y={y1 + 14}
          textAnchor="middle"
          fontSize={9}
          fill={PALETTE.faint}
          fontFamily="var(--font-sans)"
        >
          {money(p.price)}
        </text>
      ))}

      {/* demand line */}
      {pts.length > 1 ? (
        <path d={linePath} fill="none" stroke={PALETTE.line} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      ) : null}

      {/* markers + native tooltips + endpoint labels */}
      {pts.map((p, i) => {
        const isEnd = i === 0 || i === pts.length - 1
        return (
          <g key={`m-${p.price}`}>
            <circle
              cx={xOf(p.price)}
              cy={yOf(p.share_would_pay_gte)}
              r={4}
              fill={PALETTE.line}
              stroke={PALETTE.ring}
              strokeWidth={1.4}
            >
              <title>{`${money(p.price)}: ${pct(p.share_would_pay_gte)} would pay at least this`}</title>
            </circle>
            {isEnd ? (
              <text
                x={xOf(p.price)}
                y={yOf(p.share_would_pay_gte) - 8}
                textAnchor={i === 0 ? 'start' : 'end'}
                fontSize={10}
                fontWeight={600}
                fill={PALETTE.label}
                fontFamily="var(--font-sans)"
              >
                {pct(p.share_would_pay_gte)}
              </text>
            ) : null}
          </g>
        )
      })}

      {/* y axis caption */}
      <text
        x={x0 - 30}
        y={(y0 + y1) / 2}
        fontSize={8}
        fill={PALETTE.faint}
        fontFamily="var(--font-sans)"
        transform={`rotate(-90 ${x0 - 30} ${(y0 + y1) / 2})`}
        textAnchor="middle"
      >
        % would pay ≥
      </text>
    </svg>
  )
}

function ArmCard({ arm }: { arm: WtpArm }) {
  const r = arm.report
  const name = arm.display_name || `Arm ${arm.combatant_ref ?? ''}`.trim()
  const modal = modalLabel(r.modal_band)

  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 10,
        border: '1px solid var(--mist)',
        background: 'var(--paper)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h4
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {name}
        </h4>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
          {r.n_answers ?? 0} priced this
        </span>
      </div>

      {r.below_reporting_floor || r.demand_curve.length === 0 ? (
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--ink-muted)',
            margin: 0,
          }}
        >
          {r.suppression_note ||
            r.note ||
            'Too few responses about this arm to draw a demand curve yet.'}
        </p>
      ) : (
        <>
          <DemandChart report={r} name={name} />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 18px',
              marginTop: 12,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: 'var(--ink-muted)',
            }}
          >
            {r.n_priced != null ? (
              <span>
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{r.n_priced}</span> gave a price
              </span>
            ) : null}
            {r.rejection_rate != null ? (
              <span>
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{pct(r.rejection_rate)}</span> wouldn&rsquo;t buy
              </span>
            ) : null}
            {modal ? (
              <span>
                most-picked band{' '}
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{modal}</span>
              </span>
            ) : null}
          </div>
          {r.cap_note ? (
            <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--ink-faint)', lineHeight: 1.45 }}>
              {r.cap_note}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}

/** WTP question: one reservation-price demand curve per arm. */
export function WtpDemandCurve({ q }: { q: QuestionResponse }) {
  const arms = q.aggregate.wtp_by_arm ?? []
  if (arms.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
        No willingness-to-pay responses recorded yet.
      </p>
    )
  }

  const presentationRule =
    q.aggregate.wtp_overall?.presentation_rule ??
    arms.find((a) => a.report.presentation_rule)?.report.presentation_rule ??
    null

  return (
    <div>
      {q.aggregate.wtp_interpretation ? (
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--ink-muted)',
            margin: '0 0 14px',
          }}
        >
          {q.aggregate.wtp_interpretation}
        </p>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {arms.map((arm) => (
          <ArmCard key={`wtp-arm-${arm.combatant_ref ?? arm.display_name}`} arm={arm} />
        ))}
      </div>

      {presentationRule ? (
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--ink-muted)',
            fontStyle: 'italic',
          }}
        >
          {presentationRule}
        </p>
      ) : null}
    </div>
  )
}
