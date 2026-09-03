'use client'

import { ProductArt } from '@/components/products/ProductArt'
import '@/components/products/productTile.css'

export type ApplicationProduct = {
  product_id: number
  name: string
  image_url: string | null
}

/** Non-linking catalogue tile for the pre-auth application flow. */
export function ApplicationProductTile({
  product,
  flagged,
  onToggleFlagged,
}: {
  product: ApplicationProduct
  flagged: boolean
  onToggleFlagged: () => void
}) {
  return (
    <div className={`apply-product-tile${flagged ? ' is-flagged' : ''}`}>
      <ProductArt product={{ name: product.name, image_url: product.image_url }} />
      <div className="apply-product-tile-body">
        <div className="prod-tile-name">{product.name}</div>
      </div>
      <div className="apply-product-tile-action">
        <button
          type="button"
          className={`apply-product-tile-btn${flagged ? ' is-flagged' : ''}`}
          aria-pressed={flagged}
          onClick={onToggleFlagged}
        >
          {flagged ? 'Marked not mine' : 'Not mine'}
        </button>
      </div>
    </div>
  )
}
