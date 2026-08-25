import { Chip } from '@/components/experiencedReport/deckChrome'
import {
  AxisHeader,
  componentAxis,
  EloWhisker,
} from '@/components/categoryDashboard/EloWhisker'
import { formatBeta, formatCount, uniqueCiNotes } from '@/lib/categoryReport/copy'
import type { RankedProduct, RankingComponent } from '@/lib/categoryReport/types'

function adminHoverTitle(product: RankedProduct): string {
  const parts = [
    product.name,
    product.brand,
    `β ${formatBeta(product.beta)}`,
    `SE ${formatBeta(product.se_cluster)}`,
    `n ${formatCount(product.n_decisions)}`,
  ]
  if (!product.ci_available && product.ci_note) parts.push(product.ci_note)
  return parts.filter(Boolean).join(' · ')
}

function FieldRow({
  product,
  axis,
  admin,
}: {
  product: RankedProduct
  axis: ReturnType<typeof componentAxis>
  admin: boolean
}) {
  return (
    <div
      title={admin ? adminHoverTitle(product) : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px minmax(160px, 260px) 1fr',
        gap: 18,
        alignItems: 'center',
        padding: '16px 4px',
        minHeight: 56,
        background: product.is_focal ? 'var(--bg-pro)' : 'transparent',
        borderRadius: product.is_focal ? 4 : 0,
        opacity: product.is_suppressed ? 0.5 : 1,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 22,
          color: product.rank != null && product.rank <= 3 ? 'var(--ink)' : 'var(--ink-30)',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {product.rank ?? ''}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {product.name}
          </span>
          {product.is_focal ? <Chip tone="pro">Your product</Chip> : null}
          {product.is_suppressed ? <Chip>Inactive</Chip> : null}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-50)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {product.brand ?? '—'}
        </div>
      </div>
      <EloWhisker product={product} axis={axis} size="hero" />
    </div>
  )
}

export default function FieldPlot({
  component,
  index,
  total,
  admin,
  eloTransform,
  showTransform,
}: {
  component: RankingComponent
  index: number
  total: number
  admin: boolean
  eloTransform: string | null
  /** Only the first field in a composition should print the transform note. */
  showTransform?: boolean
}) {
  const axis = componentAxis(component.products)
  const anyInterval = component.products.some(
    (p) =>
      p.ci_available &&
      p.elo_lo != null &&
      p.elo_hi != null &&
      p.elo_lo !== p.elo_hi
  )
  const ciNotes = uniqueCiNotes(component.products)
  const title = admin
    ? `Component ${component.component_id} · ${component.size} item${component.size === 1 ? '' : 's'}`
    : component.is_primary
      ? total > 1
        ? 'Main field'
        : null
      : `Comparison group ${index + 1} of ${total}`

  return (
    <div style={{ marginBottom: index < total - 1 ? 28 : 0 }}>
      {title || total > 1 || (showTransform && eloTransform) || !anyInterval || ciNotes.length > 0 ? (
        <div style={{ marginBottom: 8, paddingLeft: 4 }}>
          {title ? (
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 17,
                fontWeight: 400,
                color: 'var(--ink)',
                margin: '0 0 4px',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
              {admin && component.is_primary ? (
                <span style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                  <Chip>Primary</Chip>
                </span>
              ) : null}
            </h3>
          ) : null}
          {total > 1 ? (
            <p
              style={{
                fontSize: 12,
                color: 'var(--ink-50)',
                margin: 0,
                lineHeight: 1.45,
                maxWidth: 560,
              }}
            >
              Not on a common scale with other groups — do not read across fields.
            </p>
          ) : null}
          {showTransform && eloTransform ? (
            <p style={{ fontSize: 11, color: 'var(--ink-30)', margin: '4px 0 0', lineHeight: 1.45 }}>
              Elo is Bradley-Terry strength: {eloTransform}
            </p>
          ) : null}
          {!anyInterval ? (
            <p style={{ fontSize: 11, color: 'var(--ink-30)', margin: '4px 0 0', lineHeight: 1.45 }}>
              Intervals unavailable — points only.
            </p>
          ) : null}
          {ciNotes.map((note) => (
            <p
              key={note}
              style={{ fontSize: 11, color: 'var(--ink-30)', margin: '4px 0 0', lineHeight: 1.45 }}
            >
              {note}
            </p>
          ))}
        </div>
      ) : null}
      {axis ? (
        <div style={{ padding: '0 4px 4px 48px' }}>
          <AxisHeader axis={axis} intervals={anyInterval} />
        </div>
      ) : null}
      <div>
        {component.products.map((product) => (
          <FieldRow
            key={product.product_id}
            product={product}
            axis={axis}
            admin={admin}
          />
        ))}
      </div>
    </div>
  )
}
