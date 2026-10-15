import { type CSSProperties } from 'react'
import { pct01 } from '@/lib/experiencedReport/fieldBrief'
import type { PreferenceBrief } from '@/lib/experiencedReport/fieldBrief'
import styles from '../decisionBrief.module.css'

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
