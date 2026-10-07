'use client'

import { useId, useState, type CSSProperties, type ReactNode } from 'react'
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

function FieldProofStrip({
  field,
  productName,
}: {
  field: FieldBrief
  productName: string
}) {
  if (!field.rows.length) {
    return (
      <div className={styles.fieldStripEmpty}>
        Named head-to-heads appear here once each comparison clears its floor.
      </div>
    )
  }

  const maxShare = Math.max(...field.rows.map((row) => row.winShare), 0.01)

  return (
    <div
      className={styles.fieldStrip}
      role="list"
      aria-label={`${productName} against named competitors`}
    >
      <div className={styles.fieldStripHead}>
        <span>Against the field</span>
        <span>
          {field.rows.filter((r) => r.call === 'win').length} of {field.fieldSize}{' '}
          ahead of even
        </span>
      </div>
      {field.rows.map((row) => {
        const isBest = field.beatMost?.key === row.key
        const isWorst = field.beatLeast?.key === row.key && !isBest
        const width = `${Math.max(8, (row.winShare / maxShare) * 100)}%`
        return (
          <div
            className={`${styles.fieldStripRow} ${h2hCallClass(row.call)} ${
              isBest ? styles.fieldStripBest : ''
            } ${isWorst ? styles.fieldStripWorst : ''}`}
            key={row.key}
            role="listitem"
          >
            <div className={styles.fieldStripMeta}>
              <strong>{row.opponentName}</strong>
              <span>
                {isBest ? 'Strongest' : isWorst ? 'Soft spot' : row.call === 'win' ? 'Ahead' : row.call === 'loss' ? 'Behind' : 'Close'}
                {row.nWins != null && row.nLosses != null
                  ? ` · ${row.nWins}–${row.nLosses}`
                  : ''}
              </span>
            </div>
            <div className={styles.fieldStripBarTrack} aria-hidden="true">
              <span
                className={styles.fieldStripBar}
                style={{ width } as CSSProperties}
              />
              <span className={styles.fieldStripEven} />
            </div>
            <div className={styles.fieldStripValue}>{pct01(row.winShare)}</div>
          </div>
        )
      })}
    </div>
  )
}

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

/**
 * The permanent Bottom Line layer — first viewport answers the decision.
 * ANSWER → field proof → why/intent spine → supports / does not.
 */
export function OverviewBottomLine({
  overview,
  eyebrow,
  metadata,
}: {
  overview: OverviewBrief
  eyebrow: string
  metadata: string[]
}) {
  const fieldTile = overview.tiles.find((t) => t.id === 'field')
  const priceMuted = overview.price.status !== 'tested'

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
          <p className={styles.bottomLineKicker}>Overview</p>
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

        <div className={styles.heroStack}>
          <div className={styles.heroMetric}>
            <div className={styles.heroNumber}>{overview.preferencePct}</div>
            <div className={styles.heroLabel}>chosen after use</div>
          <PreferenceIntervalBar
            brief={overview.preference}
            productName={overview.productName}
            dark={false}
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
                <strong>
                  {overview.confidence.replace(/ confidence/i, '')}
                </strong>
                <span>Interval width</span>
              </div>
            </div>
          </div>
          <FieldProofStrip
            field={overview.field}
            productName={overview.productName}
          />
        </div>
      </div>

      <div className={styles.decisionSpine}>
        <a href="#why" className={styles.spineWhy}>
          <span className={styles.answerLabel}>Why it wins</span>
          <div className={styles.spineWhyPair}>
            <div>
              <em>Win condition</em>
              <strong>{overview.whyDriver ?? '—'}</strong>
            </div>
            <div className={styles.spineWhyDivider} aria-hidden="true" />
            <div>
              <em>Headwind</em>
              <strong>
                {overview.whyHeadwind
                  ? overview.whyHeadwind.replace(/^./, (c) => c.toUpperCase())
                  : '—'}
              </strong>
            </div>
          </div>
          <span className={styles.answerDetail}>
            {overview.tiles.find((t) => t.id === 'why')?.detail}
          </span>
        </a>

        <a href="#intent" className={styles.spineIntent}>
          <span className={styles.answerLabel}>Would they buy again?</span>
          <strong className={styles.answerValue}>{overview.intentValue}</strong>
          <span className={styles.answerDetail}>{overview.intentDetail}</span>
        </a>

        <a
          href="#price"
          className={`${styles.spinePrice} ${priceMuted ? styles.answerMuted : ''}`}
        >
          <span className={styles.answerLabel}>Price</span>
          <strong className={styles.answerValue}>
            {overview.price.priceLabel ?? overview.price.title}
          </strong>
          <span className={styles.answerDetail}>{overview.price.detail}</span>
        </a>
      </div>

      {fieldTile ? (
        <p className={styles.fieldSummary}>
          <span className={styles.answerLabel}>Against the field</span>
          <strong>{fieldTile.value}</strong>
          <span>{fieldTile.detail}</span>
        </p>
      ) : null}

      <div className={styles.supportsGrid}>
        <div className={styles.supportsCol}>
          <p className={styles.supportsLabel}>What this supports</p>
          <ul>
            {overview.supports.map((claim) => (
              <li key={claim.id}>{claim.text}</li>
            ))}
          </ul>
        </div>
        <div className={`${styles.supportsCol} ${styles.supportsMuted}`}>
          <p className={styles.supportsLabel}>What this does not support</p>
          <ul>
            {overview.doesNotSupport.map((claim) => (
              <li key={claim.id}>{claim.text}</li>
            ))}
          </ul>
        </div>
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
  const tableId = useId()
  const [showTable, setShowTable] = useState(false)

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
      <div className={styles.h2hVerdict}>
        {field.beatMost ? (
          <div className={`${styles.h2hCallout} ${styles.h2hWin}`}>
            <span className={styles.h2hCalloutLabel}>Beat most</span>
            <strong>{field.beatMost.opponentName}</strong>
            <span>
              {pct01(field.beatMost.winShare)}
              {field.beatMost.nWins != null && field.beatMost.nDecisive != null
                ? ` · ${field.beatMost.nWins} of ${field.beatMost.nDecisive}`
                : ''}
              {field.beatMost.nWins != null && field.beatMost.nLosses != null
                ? ` · W–L ${field.beatMost.nWins}–${field.beatMost.nLosses}`
                : ''}
            </span>
          </div>
        ) : null}
        {field.beatLeast ? (
          <div className={`${styles.h2hCallout} ${styles.h2hLoss}`}>
            <span className={styles.h2hCalloutLabel}>Soft spot</span>
            <strong>{field.beatLeast.opponentName}</strong>
            <span>
              {pct01(field.beatLeast.winShare)}
              {field.beatLeast.nWins != null &&
              field.beatLeast.nDecisive != null
                ? ` · ${field.beatLeast.nWins} of ${field.beatLeast.nDecisive}`
                : ''}
              {field.beatLeast.nWins != null && field.beatLeast.nLosses != null
                ? ` · W–L ${field.beatLeast.nWins}–${field.beatLeast.nLosses}`
                : ''}
            </span>
          </div>
        ) : null}
      </div>

      {favoredLabel ? <p className={styles.h2hLead}>{favoredLabel}</p> : null}

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
                <strong>
                  {row.call === 'win' ? 'Beat' : row.call === 'loss' ? 'Behind' : 'Even with'}{' '}
                  {row.opponentName}
                </strong>
                <span>
                  {isBest ? 'Strongest · ' : ''}
                  {isWorst && !isBest ? 'Soft spot · ' : ''}
                  {row.nWins != null && row.nLosses != null
                    ? `${row.nWins}–${row.nLosses}`
                    : row.call === 'win'
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

      <div className={styles.tableToggle}>
        <button
          type="button"
          className={styles.tableToggleBtn}
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? 'Hide full table' : 'Show full W–L table'}
        </button>
      </div>

      {showTable ? (
        <div className={styles.tableWrap} id={tableId}>
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
      ) : null}
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
