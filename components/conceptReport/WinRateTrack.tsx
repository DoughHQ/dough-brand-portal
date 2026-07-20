import type { WinRateFieldRow } from '@/lib/conceptReport/types'
import { isOwnConceptIntent } from '@/lib/conceptReport/copy'

export function WinRateTrack({ row }: { row: WinRateFieldRow }) {
  const own = isOwnConceptIntent(String(row.battle_intent))
  const placeable =
    row.placeable &&
    row.win_rate_of_100 != null &&
    row.win_rate_lo != null &&
    row.win_rate_hi != null

  if (!placeable) {
    return (
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--ink-muted)',
          margin: '8px 0 0',
          fontStyle: 'italic',
        }}
      >
        No reliable range yet.
      </p>
    )
  }

  const lo = Math.max(0, Math.min(100, row.win_rate_lo!))
  const hi = Math.max(0, Math.min(100, row.win_rate_hi!))
  const mid = Math.max(0, Math.min(100, row.win_rate_of_100!))
  const bandLeft = Math.min(lo, hi)
  const bandWidth = Math.max(0, Math.abs(hi - lo))

  return (
    <>
      <div
        style={{
          position: 'relative',
          height: 18,
          marginTop: 10,
          background: 'var(--surface-1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
        aria-hidden
      >
        <div
          style={{
            position: 'absolute',
            left: `${bandLeft}%`,
            width: `${bandWidth}%`,
            top: 0,
            bottom: 0,
            background: own ? 'var(--fill-pro)' : 'var(--border-strong)',
            opacity: own ? 1 : 0.35,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `calc(${mid}% - 1.25px)`,
            width: 2.5,
            top: 0,
            bottom: 0,
            background: own ? 'var(--text-pro)' : 'var(--ink)',
          }}
        />
      </div>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          color: 'var(--ink-muted)',
          margin: '8px 0 0',
        }}
      >
        Likely between {Math.round(lo)} and {Math.round(hi)} out of 100.
      </p>
    </>
  )
}
