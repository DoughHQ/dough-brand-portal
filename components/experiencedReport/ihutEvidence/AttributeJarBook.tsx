import type { IhutCoreAttributeRow } from '@/lib/experiencedReport/ihutCoreTypes'
import { DataGapNotice } from '../DecisionChapters'
import ev from '../ihutEvidence.module.css'
import { pct, unit } from './format'

export function groupAttributes(rows: IhutCoreAttributeRow[]) {
  const map = new Map<string, IhutCoreAttributeRow[]>()
  for (const row of rows) {
    const key = row.attribute_label || row.attribute
    const list = map.get(key) ?? []
    list.push(row)
    map.set(key, list)
  }
  return [...map.entries()].map(([label, items]) => ({
    label,
    items: [...items].sort(
      (a, b) =>
        unit(b.just_right_share) - unit(a.just_right_share) ||
        a.name.localeCompare(b.name),
    ),
  }))
}

export function AttributeJarBook({
  rows,
  heroRef,
}: {
  rows: IhutCoreAttributeRow[]
  heroRef: number
}) {
  const groups = groupAttributes(rows)
  if (!groups.length) {
    return (
      <DataGapNotice
        title="No attribute diagnostics yet"
        body="Just-right ratings are not included in this freeze."
      />
    )
  }

  return (
    <div className={ev.jarGroup}>
      {groups.map((group) => (
        <article className={ev.jarCard} key={group.label}>
          <div className={ev.jarCardHead}>
            <h4 className={ev.jarAttr}>{group.label}</h4>
            <span className={ev.jarMeta}>
              {group.items.length} product
              {group.items.length === 1 ? '' : 's'} · too little / just right /
              too much
            </span>
          </div>
          <div className={ev.jarRows}>
            {group.items.map((row) => {
              const yours = row.ref === heroRef
              const little = unit(row.too_little_share)
              const right = unit(row.just_right_share)
              const much = unit(row.too_much_share)
              return (
                <div className={ev.jarRow} key={`${row.ref}-${row.attribute}`}>
                  <div className={ev.jarName}>
                    {row.name}
                    {yours ? <span className={ev.yoursMark}>Yours</span> : null}
                  </div>
                  <div className={ev.jarStack} title={`n=${row.n}`}>
                    <div
                      className={ev.jarTooLittle}
                      style={{ width: `${little * 100}%` }}
                    />
                    <div
                      className={ev.jarJustRight}
                      style={{ width: `${right * 100}%` }}
                    />
                    <div
                      className={ev.jarTooMuch}
                      style={{ width: `${much * 100}%` }}
                    />
                  </div>
                  <div className={ev.num}>{pct(row.just_right_share)} JAR</div>
                </div>
              )
            })}
          </div>
          <div className={ev.jarLegend}>
            <span>
              <i className={`${ev.jarSwatch} ${ev.jarTooLittle}`} />
              Too little
            </span>
            <span>
              <i className={`${ev.jarSwatch} ${ev.jarJustRight}`} />
              Just right
            </span>
            <span>
              <i className={`${ev.jarSwatch} ${ev.jarTooMuch}`} />
              Too much
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}
