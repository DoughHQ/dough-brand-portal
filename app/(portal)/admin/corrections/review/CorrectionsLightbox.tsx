export function CorrectionsLightbox({
  expandedImg,
  setExpandedImg,
}: {
  expandedImg: string | null
  setExpandedImg: (value: string | null) => void
}) {
  if (!expandedImg) return null
  return (
    <div
      role="presentation"
      className="corr-lightbox"
      onClick={() => setExpandedImg(null)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo */}
      <img src={expandedImg} alt="Evidence full size" />
    </div>
  )
}
