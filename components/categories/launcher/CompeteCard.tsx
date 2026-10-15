import Link from 'next/link'
import { type CategoryLauncherRow } from '@/lib/categoryLauncher'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'
import BannerArt from '@/components/categories/BannerArt'
import { competeStatus } from './launcherModel'
import { MetricCells, StatusChip } from './launcherParts'

export function CompeteCard({ row }: { row: CategoryLauncherRow }) {
  const status = competeStatus(row)
  const href = brandCategoryOverviewHref(row.l2_id)
  const cta = status === 'live' ? 'Open overview' : 'View category'
  return (
    <Link href={href} className="cat-tile">
      <BannerArt row={row} height={152} />
      <div className="cat-tile-body">
        {row.l1_name ? <div className="cat-kicker">{row.l1_name}</div> : null}
        <div className="cat-tile-name">{row.l2_name}</div>
        <div className="cat-tile-chip-row">
          <StatusChip status={status} />
        </div>
        <div className="cat-tile-metrics">
          <MetricCells row={row} size="sm" />
        </div>
      </div>
      <div className="cat-tile-action">
        <span className="cat-tile-btn cat-tile-btn-solid">{cta}</span>
      </div>
    </Link>
  )
}
