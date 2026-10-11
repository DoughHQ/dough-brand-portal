import story from '@/components/reportStory/reportStory.module.css'
import { DataGapNotice } from '../DecisionChapters'
import ev from '../ihutEvidence.module.css'
import { pct } from './format'

export function CountBank({
  rows,
  noun = 'response',
}: {
  rows: Array<{ answer: string; n: number }>
  noun?: string
}) {
  if (!rows.length) return null
  const sorted = [...rows].sort((a, b) => b.n - a.n)
  const max = Math.max(1, ...sorted.map((r) => r.n))
  return (
    <div className={story.rows}>
      {sorted.map((row) => (
        <div className={story.dataRow} key={row.answer}>
          <div className={story.rowLabel}>
            <span>{row.answer}</span>
            <strong>
              {row.n} {noun}
              {row.n === 1 ? '' : 's'}
            </strong>
          </div>
          <div className={story.rowTrack}>
            <div
              className={story.rowFill}
              style={{ width: `${(row.n / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function WhyBank({ rows }: { rows: Array<{ answer: string; n: number }> }) {
  if (!rows.length) {
    return (
      <DataGapNotice
        title="No coded taste reasons yet"
        body="Open-end themes will appear here when the freeze includes taste_why counts."
      />
    )
  }
  const sorted = [...rows].sort((a, b) => b.n - a.n)
  const max = Math.max(1, ...sorted.map((r) => r.n))
  const total = sorted.reduce((sum, r) => sum + r.n, 0)

  return (
    <div className={ev.whyBank}>
      {sorted.map((row, index) => (
        <div className={ev.whyRow} key={`${row.answer}-${index}`}>
          <span className={ev.whyRank}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <p className={ev.whyAnswer}>{row.answer}</p>
          <span className={ev.whyCount}>
            {row.n} · {pct(total > 0 ? row.n / total : null)} of mentions
          </span>
          <div className={ev.whyBarWrap}>
            <div
              className={ev.whyBar}
              style={{ width: `${(row.n / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
