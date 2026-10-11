import type { IhutCoreShareRow } from '@/lib/experiencedReport/ihutCoreTypes'
import ev from '../ihutEvidence.module.css'
import { pct, unit } from './format'

export function ShareTable({
  rows,
  heroRef,
  valueKey,
  valueLabel,
}: {
  rows: IhutCoreShareRow[]
  heroRef: number
  valueKey: 'top_two_share' | 'first_share' | 'liked_and_expected_good_share'
  valueLabel: string
}) {
  const sorted = [...rows].sort(
    (a, b) => unit(b[valueKey] as number | null) - unit(a[valueKey] as number | null),
  )
  if (!sorted.length) return null
  const max = Math.max(0.01, ...sorted.map((r) => unit(r[valueKey] as number | null)))

  return (
    <div className={ev.tableWrap}>
      <table className={ev.table}>
        <thead>
          <tr>
            <th>Product</th>
            <th>{valueLabel}</th>
            <th>Distribution</th>
            <th>n</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const yours = row.ref === heroRef
            const share = unit(row[valueKey] as number | null)
            return (
              <tr key={row.ref} className={yours ? ev.yours : undefined}>
                <td>
                  {row.name}
                  {yours ? <span className={ev.yoursMark}>Yours</span> : null}
                </td>
                <td className={ev.num}>{pct(row[valueKey] as number | null)}</td>
                <td className={ev.barCell}>
                  <div className={ev.shareTrack}>
                    <div
                      className={`${ev.shareFill} ${yours ? '' : ev.shareFillMuted}`}
                      style={{ width: `${(share / max) * 100}%` }}
                    />
                  </div>
                </td>
                <td className={ev.num}>{row.n}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
