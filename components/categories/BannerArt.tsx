export type CategoryBannerArt = {
  banner_image_url: string | null
  icon_name: string | null
  l2_name: string
}

export default function BannerArt({
  row,
  tall,
  height,
}: {
  row: CategoryBannerArt
  tall?: boolean
  height?: number
}) {
  const h = height ?? (tall ? 140 : 96)
  const letterSize = h >= 140 ? 36 : 22
  if (row.banner_image_url) {
    return (
      <div
        style={{
          height: h,
          overflow: 'hidden',
          background: 'var(--surface-1)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={row.banner_image_url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    )
  }
  return (
    <div
      style={{
        height: h,
        background:
          'linear-gradient(145deg, var(--surface-1) 0%, var(--mist, #e8e4dc) 100%)',
        display: 'grid',
        placeItems: 'center',
      }}
      aria-hidden
    >
      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: letterSize,
          color: 'var(--ink-30)',
          letterSpacing: '-0.02em',
        }}
      >
        {(row.icon_name || row.l2_name).slice(0, 1).toUpperCase()}
      </span>
    </div>
  )
}
