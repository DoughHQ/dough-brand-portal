import { type CSSProperties } from 'react'
import { pct01 } from '@/lib/experiencedReport/fieldBrief'
import type { FieldBrief } from '@/lib/experiencedReport/fieldBrief'
import styles from '../decisionBrief.module.css'
import { h2hCallClass } from './briefCalls'

export function FieldProofStrip({
  field,
  productName,
  hideHead = false,
}: {
  field: FieldBrief
  productName: string
  hideHead?: boolean
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
      {hideHead ? null : (
        <div className={styles.fieldStripHead}>
          <span>Against the field</span>
          <span>
            {field.rows.filter((r) => r.call === 'win').length} of{' '}
            {field.fieldSize} ahead of even
          </span>
        </div>
      )}
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
                {isBest
                  ? 'Strongest'
                  : isWorst
                    ? 'Soft spot'
                    : row.call === 'win'
                      ? 'Ahead'
                      : row.call === 'loss'
                        ? 'Behind'
                        : 'Close'}
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
