import type { CSSProperties, ReactNode } from 'react'
import type { OverviewBrief } from '@/lib/experiencedReport/overviewBrief'
import { pct01 } from '@/lib/experiencedReport/fieldBrief'
import type {
  FieldBrief,
  HeadToHeadRow,
  PreferenceBrief,
} from '@/lib/experiencedReport/fieldBrief'
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
  dark = true,
}: {
  brief: PreferenceBrief
  productName: string
  dark?: boolean
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
      className={`${styles.intervalFigure} ${dark ? '' : styles.intervalLight}`}
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
        <span>50% even split</span>
        <span>100%</span>
      </div>
    </div>
  )
}

/**
 * The permanent Bottom Line layer — first viewport answers the decision.
 * ANSWER → three proof tiles → price caveat. Screenshot-ready for email.
 */
function emphasizeShare(text: string, shareLabel: string): ReactNode {
  if (!shareLabel || shareLabel === '—' || !text.includes(shareLabel)) {
    return text
  }
  const parts = text.split(shareLabel)
  return parts.map((part, index) =>
    index === 0 ? (
      part
    ) : (
      <span key={`${shareLabel}-${index}`}>
        <span className={styles.ledeEm}>{shareLabel}</span>
        {part}
      </span>
    ),
  )
}

export function OverviewBottomLine({
  overview,
  eyebrow,
  metadata,
}: {
  overview: OverviewBrief
  eyebrow: string
  metadata: string[]
}) {
  return (
    <header className={styles.brief} id="overview">
      <div className={styles.briefEyebrowRow}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <div className={`${styles.callChip} ${callClass(overview.call)}`}>
          {overview.callLabel}
        </div>
      </div>

      <div className={styles.bottomLineGrid}>
        <div className={styles.bottomLineCopy}>
          <p className={styles.bottomLineKicker}>The bottom line</p>
          <h1 className={styles.headline}>{overview.bottomLine}</h1>
          <p className={styles.lede}>
            {emphasizeShare(overview.explanation, overview.preferencePct)}
          </p>
          <p className={styles.interpretation}>{overview.interpretation}</p>
          <a href="#performance" className={styles.jumpLink}>
            See the proof
            <span className={styles.jumpArrow} aria-hidden="true">
              ↓
            </span>
          </a>
        </div>

        <div className={styles.heroMetric}>
          <div className={styles.heroNumber}>{overview.preferencePct}</div>
          <div className={styles.heroLabel}>chosen after use</div>
          <PreferenceIntervalBar
            brief={overview.preference}
            productName={overview.productName}
          />
          <div className={styles.heroFacts}>
            <div>
              <strong>{overview.rangeLabel}</strong>
              <span>Likely range</span>
            </div>
            <div>
              <strong>
                {overview.nDecisiveLabel.replace(/ decisive choices/, '')}
              </strong>
              <span>Decisive choices</span>
            </div>
            <div>
              <strong>{overview.confidence.replace(/ confidence/i, '')}</strong>
              <span>Interval width</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.answerGrid}>
        {overview.tiles.map((tile) => (
          <a
            key={tile.id}
            href={tile.href}
            className={`${styles.answerTile} ${tile.muted ? styles.answerMuted : ''}`}
          >
            <span className={styles.answerLabel}>{tile.label}</span>
            <strong className={styles.answerValue}>{tile.value}</strong>
            <span className={styles.answerDetail}>{tile.detail}</span>
          </a>
        ))}
      </div>

      <div className={styles.metaRow}>
        {metadata.map((item) => (
          <span className={styles.metaItem} key={item}>
            {item}
          </span>
        ))}
      </div>
    </header>
  )
}

/** @deprecated Prefer OverviewBottomLine — kept for IHUT thin/forming states. */
export function DecisionBriefHeader({
  overview,
  eyebrow,
  metadata,
}: {
  overview: OverviewBrief
  eyebrow: string
  metadata: string[]
  /** unused legacy props accepted for gradual migrate */
  productName?: string
  headline?: string
  lede?: string
  implication?: string
  preference?: PreferenceBrief
  field?: FieldBrief
  price?: OverviewBrief['price']
  children?: ReactNode
}) {
  return (
    <OverviewBottomLine
      overview={overview}
      eyebrow={eyebrow}
      metadata={metadata}
    />
  )
}

export function HeadToHeadForest({
  field,
  productName,
  favoredLabel,
}: {
  field: FieldBrief
  productName: string
  favoredLabel?: string
}) {
  if (!field.rows.length) {
    return (
      <div className={styles.emptyNote}>
        <strong>No named head-to-head is reportable yet</strong>
        <span>
          Opponent intervals appear when each comparison clears its reporting
          floor. The report will not invent a podium from incomplete pairs.
        </span>
      </div>
    )
  }

  return (
    <div className={styles.h2h}>
      {favoredLabel ? <p className={styles.h2hLead}>{favoredLabel}</p> : null}

      <div className={styles.h2hCallouts}>
        {field.beatMost ? (
          <div className={`${styles.h2hCallout} ${styles.h2hWin}`}>
            <span className={styles.h2hCalloutLabel}>Beat most</span>
            <strong>{field.beatMost.opponentName}</strong>
            <span>
              {pct01(field.beatMost.winShare)}
              {field.beatMost.nWins != null && field.beatMost.nDecisive != null
                ? ` · ${field.beatMost.nWins} of ${field.beatMost.nDecisive}`
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
                ? ` · ${field.beatLeast.nWins} of ${field.beatLeast.nDecisive}`
                : ''}
            </span>
          </div>
        ) : null}
      </div>

      <div
        className={styles.forest}
        role="img"
        aria-label={`${productName} win rate against each named competitor`}
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
                  {isBest ? 'Strongest · ' : ''}
                  {isWorst && !isBest ? 'Weakest · ' : ''}
                  {row.call === 'win'
                    ? 'Ahead of even'
                    : row.call === 'loss'
                      ? 'Behind even'
                      : 'Crosses even'}
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
        <div className={styles.forestScale} aria-hidden="true">
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

export function EvidenceStrip({
  rankingPct,
  compositionPct,
  reliabilityNote,
}: {
  rankingPct: string | null
  compositionPct: string | null
  reliabilityNote: string
}) {
  return (
    <div className={styles.evidenceStrip}>
      <div>
        <span className={styles.evidenceLabel}>Evidence quality</span>
        <strong className={styles.evidenceTitle}>
          How much weight this preference signal can carry
        </strong>
      </div>
      <div className={styles.evidenceMetrics}>
        <div>
          <strong>{rankingPct ?? '—'}</strong>
          <span>Ranking validation</span>
        </div>
        <div>
          <strong>{compositionPct ?? '—'}</strong>
          <span>Evidence composition</span>
        </div>
        <div className={styles.evidenceNote}>
          <span>{reliabilityNote}</span>
          <a href="#method">See methodology →</a>
        </div>
      </div>
    </div>
  )
}
