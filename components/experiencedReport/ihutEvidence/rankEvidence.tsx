import type { IhutCoreStrengthRow } from '@/lib/experiencedReport/ihutCoreTypes'
import story from '@/components/reportStory/reportStory.module.css'
import ev from '../ihutEvidence.module.css'

function sortedRanks(rows: IhutCoreStrengthRow[]): IhutCoreStrengthRow[] {
  return [...rows]
    .filter((row) => row.rank != null)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
}

export function RankList({
  rows,
  heroRef,
}: {
  rows: IhutCoreStrengthRow[]
  heroRef: number
}) {
  const ranked = sortedRanks(rows)
  if (!ranked.length) {
    return <p className={story.cardText}>Not measured in this study.</p>
  }
  return (
    <ol className={ev.rankList}>
      {ranked.map((row) => {
        const yours = row.ref === heroRef || row.is_yours
        return (
          <li className={ev.rankListItem} key={`${row.ref}-${row.rank}`}>
            <span
              className={`${ev.rankBadge} ${yours ? ev.rankBadgeYours : ''}`}
            >
              {row.rank}
            </span>
            <span>
              {row.name}
              {yours ? <span className={ev.yoursMark}>Yours</span> : null}
            </span>
            <span className={story.finePrint} style={{ margin: 0 }}>
              {row.strength != null ? String(row.strength) : ''}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function movementFor(
  shelf: IhutCoreStrengthRow | undefined,
  taste: IhutCoreStrengthRow | undefined,
) {
  if (shelf?.rank == null || taste?.rank == null) return null
  const delta = shelf.rank - taste.rank
  if (delta > 0) return { kind: 'up' as const, label: `↑ ${delta} rank` }
  if (delta < 0) return { kind: 'down' as const, label: `↓ ${Math.abs(delta)} rank` }
  return { kind: 'held' as const, label: 'Held' }
}
