import type { ReactNode } from 'react'
import { formatCount, formatSharePct } from '@/lib/categoryReport/copy'
import type { CategoryReport } from '@/lib/categoryReport/types'

function CountBars({
  items,
  note,
}: {
  items: { label: string; value: number | null }[]
  note: string | null
}) {
  const nums = items.map((i) => i.value).filter((v): v is number => v != null && v >= 0)
  const max = nums.length ? Math.max(...nums, 1) : 1
  return (
    <div>
      {items.map((item) => {
        const w =
          item.value != null && Number.isFinite(item.value)
            ? Math.max(2, (item.value / max) * 100)
            : 0
        return (
          <div key={item.label} style={{ marginBottom: 10 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span style={{ color: 'var(--ink-50)' }}>{item.label}</span>
              <span
                style={{
                  fontWeight: 500,
                  color: item.value != null ? 'var(--ink)' : 'var(--ink-30)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {item.value == null ? '—' : formatCount(item.value)}
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 99,
                background: 'var(--ink-10)',
                overflow: 'hidden',
              }}
            >
              {item.value != null ? (
                <div
                  style={{
                    width: `${w}%`,
                    height: '100%',
                    background: 'var(--sage, #3E6B4A)',
                  }}
                />
              ) : null}
            </div>
          </div>
        )
      })}
      {note ? (
        <p style={{ fontSize: 11, color: 'var(--ink-30)', margin: '4px 0 0', lineHeight: 1.45 }}>
          {note}
        </p>
      ) : null}
    </div>
  )
}

function ShareBar({
  label,
  value,
  note,
}: {
  label: string
  value: number | null
  note: string | null
}) {
  const fill =
    value != null && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: 12,
          marginBottom: 6,
        }}
      >
        <span style={{ color: 'var(--ink-50)' }}>{label}</span>
        <span
          style={{
            fontWeight: 500,
            color: fill != null ? 'var(--ink)' : 'var(--ink-30)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatSharePct(value) ?? '—'}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 99,
          background: 'var(--ink-10)',
          overflow: 'hidden',
        }}
      >
        {fill != null ? (
          <div
            style={{
              width: `${fill * 100}%`,
              height: '100%',
              background: 'var(--sage, #3E6B4A)',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 8px)',
            }}
          />
        )}
      </div>
      {note ? (
        <p style={{ fontSize: 11, color: 'var(--ink-30)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {note}
        </p>
      ) : null}
    </div>
  )
}

function Card({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div style={{ padding: '4px 0 8px' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

export default function EvidenceCharts({ report }: { report: CategoryReport }) {
  const e = report.evidence
  const cov = e.coverage
  const conc = e.concentration
  const rater = e.rater_concentration
  const pos = e.position_balance

  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 18,
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 16px',
          letterSpacing: '-0.01em',
        }}
      >
        Evidence
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
        <Card title="Coverage">
          <CountBars
            items={[
              { label: 'Products ranked', value: cov?.products_ranked ?? null },
              { label: 'With battles', value: cov?.products_with_battles ?? null },
              { label: 'Active in scope', value: cov?.products_active_in_scope ?? null },
            ]}
            note={
              cov?.note ??
              (cov == null ? 'Coverage block missing from payload.' : null)
            }
          />
          <p style={{ fontSize: 11, color: 'var(--ink-30)', margin: '8px 0 0' }}>
            Counts only — never a catalog percentage.
          </p>
        </Card>

        <Card title="Concentration">
          <ShareBar
            label="Top-3 battle share"
            value={conc?.top3_battle_share ?? null}
            note={null}
          />
          <div style={{ marginTop: 14, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: 'var(--ink-50)' }}>Battles / product (median)</span>
              <span
                style={{
                  fontWeight: 500,
                  color:
                    conc?.battles_per_product_median != null ? 'var(--ink)' : 'var(--ink-30)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {conc?.battles_per_product_median == null
                  ? '—'
                  : String(conc.battles_per_product_median)}
              </span>
            </div>
          </div>
          {conc?.note ? (
            <p style={{ fontSize: 11, color: 'var(--ink-30)', margin: '8px 0 0', lineHeight: 1.45 }}>
              {conc.note}
            </p>
          ) : conc == null ? (
            <p style={{ fontSize: 11, color: 'var(--ink-30)', margin: '8px 0 0' }}>
              Concentration block missing from payload.
            </p>
          ) : null}
        </Card>

        <Card title="Rater concentration">
          <ShareBar
            label="Max single-rater share"
            value={rater?.max_single_rater_share ?? null}
            note={
              rater?.note ??
              (rater == null ? 'Rater concentration block missing from payload.' : null)
            }
          />
        </Card>

        <Card title="Position balance">
          <div style={{ fontSize: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <span style={{ color: 'var(--ink-50)' }}>Instrumented battles</span>
              <span
                style={{
                  fontWeight: 500,
                  color: pos?.instrumented_battles != null ? 'var(--ink)' : 'var(--ink-30)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatCount(pos?.instrumented_battles ?? null)}
              </span>
            </div>
          </div>
          <ShareBar
            label="Left-slot win share"
            value={pos?.left_slot_win_share ?? null}
            note={
              pos?.note ??
              (pos == null ? 'Position balance block missing from payload.' : null)
            }
          />
        </Card>
      </div>
    </section>
  )
}
