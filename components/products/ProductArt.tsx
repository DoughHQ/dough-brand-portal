import '@/components/products/productTile.css'

export type ProductArtModel = {
  name: string
  image_url?: string | null
}

/** Letter-placeholder art used by portfolio tiles and the application product preview. */
export function ProductArt({ product }: { product: ProductArtModel }) {
  if (product.image_url) {
    return (
      <div className="prod-tile-art">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image_url} alt="" />
      </div>
    )
  }
  const letter = (product.name.trim().slice(0, 1) || '?').toUpperCase()
  return (
    <div className="prod-tile-art" aria-hidden>
      <span className="prod-tile-letter">{letter}</span>
    </div>
  )
}
