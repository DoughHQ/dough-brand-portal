import styles from '@/components/reportStory/reportStory.module.css'
import { pct } from './storyFormat'

export function DistributionRows({
  rows,
}: {
  rows: Array<{ label: string; share: number; n: number }>
}) {
  return (
    <div className={styles.rows}>
      {rows.map((row, index) => (
        <div className={styles.dataRow} key={row.label}>
          <div className={styles.rowLabel}>
            <span>{row.label}</span>
            <strong>
              {pct(row.share)} · n={row.n}
            </strong>
          </div>
          <div className={styles.rowTrack}>
            <div
              className={index < 2 ? styles.rowFill : styles.rowFillMuted}
              style={{
                width: `${Math.max(0, Math.min(100, row.share * 100))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
