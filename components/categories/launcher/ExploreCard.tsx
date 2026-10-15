import Link from 'next/link'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'
import BannerArt from '@/components/categories/BannerArt'

export function ExploreCard({
  row,
}: {
  row: {
    l2_id: number
    l2_name: string
    l1_name: string | null
    banner_image_url: string | null
    icon_name: string | null
  }
}) {
  return (
    <Link href={brandCategoryOverviewHref(row.l2_id)} className="cat-tile">
      <BannerArt row={row} height={152} />
      <div className="cat-tile-body">
        {row.l1_name ? <div className="cat-kicker">{row.l1_name}</div> : null}
        <div className="cat-tile-name">{row.l2_name}</div>
      </div>
      <div className="cat-tile-action">
        <span className="cat-tile-btn cat-tile-btn-outline">Explore</span>
      </div>
    </Link>
  )
}
