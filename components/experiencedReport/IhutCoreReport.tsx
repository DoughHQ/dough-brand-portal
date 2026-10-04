'use client'

import type { CSSProperties } from 'react'
import type {
  IhutBarResult,
  IhutCoreAttributeRow,
  IhutCoreBarMetric,
  IhutCoreReport,
  IhutCoreShareRow,
} from '@/lib/experiencedReport/ihutCoreTypes'
import { hasIhutVerdict } from '@/lib/experiencedReport/ihutCoreTypes'
import { Chip, ShareBar } from './deckChrome'

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v)
  return null
}

function pct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—'
  return `${Math.round(v * 100)}%`
}

function barTone(result: string): 'pro' | 'amber' | 'neutral' {
  if (result === 'cleared') return 'pro'
  if (result === 'not_cleared' || result === 'too_close_to_call') return 'amber'
  return 'neutral'
}

function barLabel(result: string): string {
  switch (result as IhutBarResult) {
    case 'cleared':
      return 'Cleared'
    case 'not_cleared':
      return 'Not cleared'
    case 'too_close_to_call':
      return 'Too close'
    case 'not_enough_responses':
      return 'Need more n'
    case 'not_tested':
      return 'Not tested'
    default:
      return result
  }
}

const h2: CSSProperties = {
  fontFamily: 'var(--font-serif, Georgia, serif)',
  fontSize: 22,
  margin: '0 0 6px',
  color: 'var(--ink-90)',
}

const lead: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink-55)',
  margin: '0 0 16px',
  maxWidth: 560,
  lineHeight: 1.45,
}

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--ink-50)',
  margin: '0 0 8px',
}

/** Full IHUT_CORE_V1 report deck. */
export function IhutCoreReportView({ report }: { report: IhutCoreReport }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <VerdictBlock report={report} />
      <PromiseBlock report={report} />
      <ShareBlock
        title="Liking"
        sub="Top-two box on the liking scale, per product."
        rows={report.liking}
        valueKey="top_two_share"
        valueLabel="Top-two"
      />
      <ShareBlock
        title="Would buy at your price"
        sub="Share saying yes at the price on the seat."
        rows={report.price_check}
        valueKey="yes_share"
        valueLabel="Yes"
      />
      <AttributeBlock rows={report.attribute_penalties} />
      <ShareBlock
        title="Expectation vs experience"
        sub="Liked it and expected good or better from the pack."
        rows={report.expectation_vs_experience}
        valueKey="liked_and_expected_good_share"
        valueLabel="Matched"
      />
      <BuyOrderBlock rows={report.buy_order} />
      <WhyBlock rows={report.taste_why} />
      <Day2Block report={report} />
    </div>
  )
}

function VerdictBlock({ report }: { report: IhutCoreReport }) {
  const verdict = report.verdict
  if (!hasIhutVerdict(verdict)) {
    return (
      <section className="report-section">
        <h2 style={h2}>Verdict</h2>
        <p style={lead}>
          Set success bars at publish to judge your hero against taste win share,
          liking, and buy-at-price.
        </p>
      </section>
    )
  }

  const metrics: { key: string; label: string; metric: IhutCoreBarMetric }[] = [
    { key: 'taste', label: 'Taste win share', metric: verdict.taste_win },
    { key: 'liking', label: 'Liking', metric: verdict.liking },
    { key: 'price', label: 'Buy at price', metric: verdict.buy_at_price },
  ]

  return (
    <section className="report-section">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          gap: '8px 14px',
          marginBottom: 6,
        }}
      >
        <h2 style={{ ...h2, margin: 0 }}>Verdict</h2>
        <Chip tone={barTone(verdict.overall)}>{barLabel(verdict.overall)}</Chip>
      </div>
      <p style={lead}>
        {verdict.name} against the bars you set
        {report.success_bars.taste_win_share != null
          ? ` (taste ≥${pct(report.success_bars.taste_win_share)}, liking ≥${pct(report.success_bars.liking_share)}, buy ≥${pct(report.success_bars.buy_at_price_share)})`
          : ''}
        .
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {metrics.map(({ key, label, metric }) => (
          <div
            key={key}
            style={{
              padding: '12px 14px',
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md, 8px)',
              background: 'var(--white)',
            }}
          >
            <div style={{ ...eyebrow, marginBottom: 10 }}>{label}</div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 28,
                fontWeight: 600,
                color: 'var(--ink-90)',
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              {pct(metric.share ?? null)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Chip tone={barTone(metric.result)}>{barLabel(metric.result)}</Chip>
              {metric.bar != null ? (
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    color: 'var(--ink-45)',
                  }}
                >
                  bar {pct(metric.bar)}
                </span>
              ) : null}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--ink-40)',
              }}
            >
              n={metric.n ?? 0}
              {metric.lo != null && metric.hi != null
                ? ` · ${pct(metric.lo)}–${pct(metric.hi)}`
                : ''}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PromiseBlock({ report }: { report: IhutCoreReport }) {
  const map = report.promise_vs_delivery.map
  return (
    <section className="report-section">
      <h2 style={h2}>Promise vs delivery</h2>
      <p style={lead}>
        {report.promise_vs_delivery.note}
        {report.taste_only ? ' This box ran taste-only.' : null}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
        {map.map((row) => {
          const shelf = num(row.shelf_strength)
          const taste = num(row.taste_strength)
          return (
            <div
              key={row.ref}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 12,
                alignItems: 'center',
                padding: '10px 12px',
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-md, 8px)',
                background: row.is_yours ? 'var(--sage-soft, #eef6f1)' : 'var(--white)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--ink-85)',
                }}
              >
                {row.name}
                {row.is_yours ? ' · Yours' : ''}
              </div>
              <Metric label="Shelf" value={shelf} />
              <Metric label="Taste" value={taste} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ShareBlock({
  title,
  sub,
  rows,
  valueKey,
  valueLabel,
}: {
  title: string
  sub: string
  rows: IhutCoreShareRow[]
  valueKey:
    | 'top_two_share'
    | 'yes_share'
    | 'first_share'
    | 'liked_and_expected_good_share'
  valueLabel: string
}) {
  if (!rows.length) return null
  return (
    <section className="report-section">
      <h2 style={h2}>{title}</h2>
      <p style={lead}>{sub}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520 }}>
        {rows.map((row) => {
          const value = row[valueKey] ?? null
          return (
            <div key={`${title}-${row.ref}`}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 4,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--ink-85)' }}>{row.name}</span>
                <span style={{ color: 'var(--ink-55)' }}>
                  {valueLabel} {pct(value)}{' '}
                  <span style={{ color: 'var(--ink-40)' }}>(n={row.n})</span>
                </span>
              </div>
              <ShareBar share={value ?? 0} tone="own" />
            </div>
          )
        })}
      </div>
    </section>
  )
}

function BuyOrderBlock({ rows }: { rows: IhutCoreShareRow[] }) {
  if (!rows.length) return null
  return (
    <section className="report-section">
      <h2 style={h2}>Buy order</h2>
      <p style={lead}>Share picking each product first after tasting.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 520 }}>
        {rows.map((row) => (
          <div
            key={`buy-${row.ref}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: 12,
              alignItems: 'center',
              padding: '10px 12px',
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md, 8px)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--ink-85)',
              }}
            >
              {row.name}
            </div>
            <Metric label="First" value={row.first_share != null ? row.first_share * 100 : null} suffix="%" />
            <Metric label="Avg rank" value={row.avg_rank ?? null} digits={2} />
          </div>
        ))}
      </div>
    </section>
  )
}

function AttributeBlock({ rows }: { rows: IhutCoreAttributeRow[] }) {
  if (!rows.length) return null
  const byAttr = new Map<string, IhutCoreAttributeRow[]>()
  for (const row of rows) {
    const key = row.attribute_label || row.attribute
    const list = byAttr.get(key) ?? []
    list.push(row)
    byAttr.set(key, list)
  }
  return (
    <section className="report-section">
      <h2 style={h2}>Just-right attributes</h2>
      <p style={lead}>Too little / just right / too much — where the recipe pulls.</p>
      {[...byAttr.entries()].map(([label, group]) => (
        <div key={label} style={{ marginBottom: 18 }}>
          <h3 style={eyebrow}>{label}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.map((row) => (
              <div
                key={`${row.attribute}-${row.ref}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(100px, 1fr) 2fr',
                  gap: 10,
                  alignItems: 'center',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--ink-80)' }}>{row.name}</span>
                <TriBar
                  tooLittle={row.too_little_share}
                  justRight={row.just_right_share}
                  tooMuch={row.too_much_share}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function TriBar({
  tooLittle,
  justRight,
  tooMuch,
}: {
  tooLittle?: number | null
  justRight?: number | null
  tooMuch?: number | null
}) {
  const a = Math.max(0, tooLittle ?? 0)
  const b = Math.max(0, justRight ?? 0)
  const c = Math.max(0, tooMuch ?? 0)
  const sum = a + b + c
  if (sum <= 0) {
    return <span style={{ color: 'var(--ink-40)' }}>—</span>
  }
  return (
    <div>
      <div
        style={{
          display: 'flex',
          height: 10,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'var(--ink-08, #eee)',
        }}
        title={`Too little ${pct(a)} · Just right ${pct(b)} · Too much ${pct(c)}`}
      >
        <div style={{ width: `${(a / sum) * 100}%`, background: 'var(--amber, #c4832a)' }} />
        <div style={{ width: `${(b / sum) * 100}%`, background: 'var(--text-pro, #2f6b4f)' }} />
        <div style={{ width: `${(c / sum) * 100}%`, background: 'var(--ink-35, #888)' }} />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 4,
          fontSize: 11,
          color: 'var(--ink-45)',
        }}
      >
        <span>− {pct(a)}</span>
        <span>✓ {pct(b)}</span>
        <span>+ {pct(c)}</span>
      </div>
    </div>
  )
}

function WhyBlock({ rows }: { rows: { answer: string; n: number }[] }) {
  if (!rows.length) return null
  const total = rows.reduce((s, r) => s + r.n, 0) || 1
  return (
    <section className="report-section">
      <h2 style={h2}>What made the difference</h2>
      <p style={lead}>Sampled after taste battles.</p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', maxWidth: 480 }}>
        {rows.map((row) => (
          <li
            key={row.answer}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--ink-75)',
              padding: '6px 0',
              borderBottom: '1px solid var(--ink-08)',
            }}
          >
            <span>{row.answer}</span>
            <span style={{ color: 'var(--ink-45)' }}>
              {row.n} · {pct(row.n / total)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Day2Block({ report }: { report: IhutCoreReport }) {
  const d2 = report.day2
  if (!d2 || (!d2.preference_hold?.n && !d2.consumption?.length && !d2.wear?.length)) {
    return null
  }
  return (
    <section className="report-section">
      <h2 style={h2}>Day 2 — Live with it</h2>
      <p style={lead}>Preference hold and how the product wore after the first session.</p>
      {d2.preference_hold?.n > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <h3 style={eyebrow}>Still their pick</h3>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--ink-90)',
            }}
          >
            {pct(d2.preference_hold.same_favorite_share)}
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-40)' }}>
            same Day-1 favorite · n={d2.preference_hold.n}
          </div>
        </div>
      ) : null}
      {d2.consumption?.length ? (
        <div style={{ marginBottom: 14 }}>
          <h3 style={eyebrow}>How much left</h3>
          <CountList rows={d2.consumption} />
        </div>
      ) : null}
      {d2.wear?.length ? (
        <div>
          <h3 style={eyebrow}>Grown on you</h3>
          <CountList rows={d2.wear} />
        </div>
      ) : null}
    </section>
  )
}

function CountList({ rows }: { rows: { answer: string; n: number }[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {rows.map((row) => (
        <li
          key={row.answer}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--ink-70)',
            marginBottom: 4,
          }}
        >
          {row.answer}: {row.n}
        </li>
      ))}
    </ul>
  )
}

function Metric({
  label,
  value,
  digits = 2,
  suffix = '',
}: {
  label: string
  value: number | null
  digits?: number
  suffix?: string
}) {
  return (
    <div style={{ textAlign: 'right', minWidth: 64 }}>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-40)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink-80)',
        }}
      >
        {value == null ? '—' : `${value.toFixed(digits)}${suffix}`}
      </div>
    </div>
  )
}
