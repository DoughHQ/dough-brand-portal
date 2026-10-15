export function BrandProductArt({
  url,
  name,
  className,
  letterClass,
}: {
  url: string | null
  name: string
  className: string
  letterClass: string
}) {
  if (url) {
    return (
      <div className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" />
      </div>
    )
  }
  const letter = (name.trim().slice(0, 1) || '?').toUpperCase()
  return (
    <div className={className} aria-hidden>
      <span className={letterClass}>{letter}</span>
    </div>
  )
}
