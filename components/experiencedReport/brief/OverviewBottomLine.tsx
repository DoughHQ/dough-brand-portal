import { type ReactNode } from 'react'
import type { OverviewBrief } from '@/lib/experiencedReport/overviewBrief'
import styles from '../decisionBrief.module.css'
import { callClass } from './briefCalls'
import { PreferenceIntervalBar } from './PreferenceIntervalBar'
import { FieldProofStrip } from './FieldProofStrip'

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
 * Layout mirrors concept DeckVerdictNext: finding + proof card.
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
  const priceMuted = overview.price.status !== 'tested'
  const won = overview.call === 'ahead'

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
          <p className={styles.bottomLineKicker}>
            {overview.call === 'forming' ? 'Provisional read' : 'The finding'}
          </p>
          <h1 className={styles.headline}>{overview.bottomLine}</h1>
          <div
            className={`${styles.heroNumber} ${won ? styles.heroNumberWon : ''}`}
          >
            {overview.preferencePct}
            <span className={styles.heroNumberUnit}>chosen after use</span>
          </div>
          <PreferenceIntervalBar
            brief={overview.preference}
            productName={overview.productName}
            dark={false}
          />
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

        <aside className={styles.proofCard}>
          <p className={styles.proofCardKicker}>Against the field</p>
          <h2 className={styles.proofCardTitle}>
            {overview.tiles.find((t) => t.id === 'field')?.detail ??
              'Named comparisons'}
          </h2>
          <FieldProofStrip
            field={overview.field}
            productName={overview.productName}
            hideHead
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
        </aside>
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
