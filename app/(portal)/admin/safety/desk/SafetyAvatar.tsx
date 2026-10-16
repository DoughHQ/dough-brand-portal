export function Avatar({
  url,
  name,
  className,
}: {
  url: string | null
  name: string
  className?: string
}) {
  const letter = (name.trim().slice(0, 1) || '?').toUpperCase()
  if (url) {
    return (
      <div className={className ?? 'safety-avatar'}>
        {/* eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo */}
        <img src={url} alt="" />
      </div>
    )
  }
  return (
    <div className={className ?? 'safety-avatar'} aria-hidden>
      {letter}
    </div>
  )
}
