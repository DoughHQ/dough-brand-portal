import type { CSSProperties, ReactNode } from 'react'
import type { DecisionStory } from '@/lib/experiencedReport/decisionStory'
import {
  deriveFieldBrief,
  derivePreferenceBrief,
  derivePriceBriefTile,
  pct01,
  type FieldBrief,
  type HeadToHeadRow,
  type PreferenceBrief,
  type PriceBriefTile,
} from '@/lib/experiencedReport/fieldBrief'
import type { OpponentRow } from '@/lib/experiencedReport/types'
import styles from './decisionBrief.module.css'

function callClass(call: PreferenceBrief['call']): string {
  switch (call) {
    case 'ahead':
      return styles.callAhead
    case 'behind':
      return styles.callBehind
    case 'too_close':
      return styles.callClose
    default:
      return styles.callForming
  }
}

function h2hCallClass(call: HeadToHeadRow['call']): string {
  switch (call) {
    case 'win':
      return styles.h2hWin
    case 'loss':
      return styles.h2hLoss
    default:
      return styles.h2hClose
  }
}

export function PreferenceIntervalBar({
  brief,
  productName,
}: {
  brief: PreferenceBrief
  productName: string
}) {
  if (brief.share == null) {
    return (
      <div className={styles.emptyNote}>
        <strong>Preference below reporting floor</strong>
        <span>No interval is drawn from an unreportable estimate.</span>
      </div>
    )
  }
  const share = brief.share * 100
  const lo = (brief.lo ?? brief.share) * 100
  const hi = (brief.hi ?? brief.share) * 100
  const left = Math.min(lo, hi)
  const width = Math.max(0.8, Math.abs(hi - lo))

  return (
    <div
      className={styles.intervalFigure}
      role="img"
      aria-label={`${productName} chosen ${pct01(brief.share)}; likely range ${pct01(brief.lo)} to ${pct01(brief.hi)}`}
    >
      <div className={styles.intervalTrack}>
        <span className={styles.evenSpine} aria-hidden="true" />
        <span
          className={styles.intervalBand}
          style={{ left: `${left}%`, width: `${width}%` } as CSSProperties}
        />
        <span
          className={styles.intervalPoint}
          style={{ left: `${share}%` } as CSSProperties}
        />
      </div>
      <div className={styles.intervalScale} aria-hidden="true">
        <span>0%</span>
        <span>50% even</span>
        <span>100%</span>
      </div>
      <p className={styles.intervalCaption}>
        Point estimate {pct01(brief.share)}
        {brief.lo != null && brief.hi != null
          ? ` · likely range ${pct01(brief.lo)}–${pct01(brief.hi)}`
          : ''}
        {brief.nDecisive != null ? ` · n=${brief.nDecisive} decisive` : ''}
      </p>
    </div>
  )
}

export function DecisionBriefHeader({
  eyebrow,
  productName,
  headline,
  lede,
  implication,
  metadata,
  preference,
  field,
  price,
  children,
}: {
  eyebrow: string
  productName: string
  headline: string
  lede: string
  implication: string
  metadata: string[]
  preference: PreferenceBrief
  field: FieldBrief
  price: PriceBriefTile
  children?: ReactNode
}) {
  return (
    <header className={styles.brief}>
      <div className={styles.briefTop}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <div className={`${styles.callChip} ${callClass(preference.call)}`}>
            {preference.callLabel}
          </div>
          <h1 className={styles.headline}>{headline}</h1>
          <p className={styles.lede}>{lede}</p>
        </div>
        <aside className={styles.supportBox}>
          <span className={styles.supportLabel}>What this supports</span>
          <p>{implication}</p>
        </aside>
      </div>

      <div className={styles.kpiGrid}>
        <article className={styles.kpi}>
          <span className={styles.kpiLabel}>Preference</span>
          <strong className={styles.kpiValue}>
            {pct01(preference.share)}
          </strong>
          <span className={styles.kpiHint}>
            {preference.lo != null && preference.hi != null
              ? `${pct01(preference.lo)}–${pct01(preference.hi)}`
              : 'Interval pending'}
          </span>
        </article>
        <article className={styles.kpi}>
          <span className={styles.kpiLabel}>Beat most</span>
          <strong className={styles.kpiValue}>
            {field.beatMost ? pct01(field.beatMost.winShare) : '—'}
          </strong>
          <span className={styles.kpiHint}>
            {field.beatMost
              ? field.beatMost.opponentName
              : 'No reportable H2H yet'}
          </span>
        </article>
        <article className={styles.kpi}>
          <span className={styles.kpiLabel}>Beat least</span>
          <strong className={styles.kpiValue}>
            {field.beatLeast ? pct01(field.beatLeast.winShare) : '—'}
          </strong>
          <span className={styles.kpiHint}>
            {field.beatLeast
              ? field.beatLeast.opponentName
              : 'No reportable H2H yet'}
          </span>
        </article>
        <article
          className={`${styles.kpi} ${
            price.status === 'not_measured' || price.status === 'off'
              ? styles.kpiMuted
              : ''
          }`}
        >
          <span className={styles.kpiLabel}>Price</span>
          <strong className={styles.kpiValue}>
            {price.priceLabel ?? price.title}
          </strong>
          <span className={styles.kpiHint}>{price.detail}</span>
        </article>
      </div>

      <PreferenceIntervalBar brief={preference} productName={productName} />

      {field.beatMost && field.beatLeast && field.fieldSize >= 2 ? (
        <p className={styles.fieldCallout}>
          Strongest pairwise win: <strong>{field.beatMost.opponentName}</strong>{' '}
          ({pct01(field.beatMost.winShare)}
          {field.beatMost.nWins != null && field.beatMost.nDecisive != null
            ? ` · ${field.beatMost.nWins}/${field.beatMost.nDecisive}`
            : ''}
          ). Weakest: <strong>{field.beatLeast.opponentName}</strong> (
          {pct01(field.beatLeast.winShare)}
          {field.beatLeast.nWins != null && field.beatLeast.nDecisive != null
            ? ` · ${field.beatLeast.nWins}/${field.beatLeast.nDecisive}`
            : ''}
          ).
        </p>
      ) : null}

      {children}

      <div className={styles.metaRow}>
        {metadata.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </header>
  )
}

export function HeadToHeadForest({
  field,
  productName,
}: {
  field: FieldBrief
  productName: string
}) {
  if (!field.rows.length) {
    return (
      <div className={styles.emptyNote}>
        <strong>No named head-to-head is reportable yet</strong>
        <span>
          Opponent intervals appear when each comparison clears its reporting
          floor. The report will not invent a 1–5 podium from incomplete pairs.
        </span>
      </div>
    )
  }

  return (
    <div className={styles.h2h}>
      <div className={styles.h2hCallouts}>
        {field.beatMost ? (
          <div className={`${styles.h2hCallout} ${styles.h2hWin}`}>
            <span className={styles.h2hCalloutLabel}>Beat most</span>
            <strong>{field.beatMost.opponentName}</strong>
            <span>
              {pct01(field.beatMost.winShare)}
              {field.beatMost.nWins != null && field.beatMost.nDecisive != null
                ? ` · ${field.beatMost.nWins} of ${field.beatMost.nDecisive} decisive`
                : ''}
            </span>
          </div>
        ) : null}
        {field.beatLeast ? (
          <div className={`${styles.h2hCallout} ${styles.h2hLoss}`}>
            <span className={styles.h2hCalloutLabel}>Beat least</span>
            <strong>{field.beatLeast.opponentName}</strong>
            <span>
              {pct01(field.beatLeast.winShare)}
              {field.beatLeast.nWins != null &&
              field.beatLeast.nDecisive != null
                ? ` · ${field.beatLeast.nWins} of ${field.beatLeast.nDecisive} decisive`
                : ''}
            </span>
          </div>
        ) : null}
      </div>

      <div
        className={styles.forest}
        role="img"
        aria-label={`${productName} win rate against each named competitor, with intervals`}
      >
        {field.rows.map((row) => {
          const value = row.winShare * 100
          const lo = (row.lo ?? row.winShare) * 100
          const hi = (row.hi ?? row.winShare) * 100
          const left = Math.min(lo, hi)
          const width = Math.max(0.8, Math.abs(hi - lo))
          const isBest = field.beatMost?.key === row.key
          const isWorst = field.beatLeast?.key === row.key
          return (
            <div
              className={`${styles.forestRow} ${h2hCallClass(row.call)}`}
              key={row.key}
            >
              <div className={styles.forestName}>
                <strong>{row.opponentName}</strong>
                <span>
                  {isBest ? 'Strongest win · ' : ''}
                  {isWorst && !isBest ? 'Weakest win · ' : ''}
                  {row.call === 'win'
                    ? 'Ahead'
                    : row.call === 'loss'
                      ? 'Behind'
                      : 'Too close'}
                </span>
              </div>
              <div className={styles.forestTrack}>
                <span className={styles.evenSpine} aria-hidden="true" />
                <span
                  className={styles.forestBand}
                  style={
                    { left: `${left}%`, width: `${width}%` } as CSSProperties
                  }
                />
                <span
                  className={styles.forestPoint}
                  style={{ left: `${value}%` } as CSSProperties}
                />
              </div>
              <div className={styles.forestValue}>{pct01(row.winShare)}</div>
            </div>
          )
        })}
        <div className={styles.intervalScale} aria-hidden="true">
          <span>0%</span>
          <span>50% even</span>
          <span>100%</span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.h2hTable}>
          <caption className={styles.srOnly}>
            Aggregate head-to-head results for {productName}
          </caption>
          <thead>
            <tr>
              <th scope="col">Opponent</th>
              <th scope="col">Result</th>
              <th scope="col">Win%</th>
              <th scope="col">Interval</th>
              <th scope="col">W–L</th>
              <th scope="col">n</th>
            </tr>
          </thead>
          <tbody>
            {field.rows.map((row) => (
              <tr key={`t-${row.key}`} className={h2hCallClass(row.call)}>
                <th scope="row">
                  {row.opponentName}
                  {row.opponentBrand ? (
                    <span className={styles.brandMuted}>
                      {' '}
                      · {row.opponentBrand}
                    </span>
                  ) : null}
                </th>
                <td>
                  {row.call === 'win'
                    ? 'Win'
                    : row.call === 'loss'
                      ? 'Loss'
                      : 'Too close'}
                </td>
                <td>{pct01(row.winShare)}</td>
                <td>
                  {row.lo != null && row.hi != null
                    ? `${pct01(row.lo)}–${pct01(row.hi)}`
                    : '—'}
                </td>
                <td>
                  {row.nWins != null && row.nLosses != null
                    ? `${row.nWins}–${row.nLosses}`
                    : '—'}
                </td>
                <td>{row.nDecisive ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function buildBriefParts(
  story: DecisionStory,
  opponents: OpponentRow[] | null | undefined,
  preference: {
    share: number | null
    lo: number | null
    hi: number | null
    nDecisive: number | null
    direction: 'more' | 'less' | 'close' | null
  },
) {
  return {
    preference: derivePreferenceBrief(preference),
    field: deriveFieldBrief(opponents),
    price: derivePriceBriefTile(story),
  }
}
