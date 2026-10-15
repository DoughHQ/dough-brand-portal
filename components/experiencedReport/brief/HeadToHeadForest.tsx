import { useId, useState, type CSSProperties } from 'react'
import { pct01 } from '@/lib/experiencedReport/fieldBrief'
import type { FieldBrief } from '@/lib/experiencedReport/fieldBrief'
import styles from '../decisionBrief.module.css'
import { h2hCallClass } from './briefCalls'

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
