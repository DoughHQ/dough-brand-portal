import Link from 'next/link'
import type { buildHomeStrip } from './homeStrip'
import { StripIcon } from './StripIcon'

export function SnapshotStrip({ strip }: { strip: ReturnType<typeof buildHomeStrip> }) {
  return (
    <section className="bh-strip" aria-label="Portfolio snapshot">
      {strip.map((cell) => (
        <Link key={cell.key} href={cell.href} className="bh-strip-cell portal-panel">
          <div className="bh-strip-icon">
            <StripIcon d={cell.icon} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="bh-strip-label">{cell.label}</div>
            <div className="bh-strip-value">{cell.value}</div>
            {cell.sub ? <div className="bh-strip-sub">{cell.sub}</div> : null}
          </div>
        </Link>
      ))}
    </section>
  )
}
