export function CatArt({ name, src }: { name: string; src: string | null }) {
  const letter = name.trim().slice(0, 1).toUpperCase() || 'C'
  return (
    <div className="bh-cat-art" aria-hidden>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed, catalog, or uploaded photo
        <img src={src} alt="" />
      ) : (
        <span className="bh-cat-art-fallback">{letter}</span>
      )}
    </div>
  )
}
