import Link from 'next/link'
import type { ProductSignalCardModel } from '@/lib/brandHome/productSignalCards'
import ProductSignalCard from '@/components/brandHome/ProductSignalCard'
import { PRODUCT_NAME } from '@/lib/brand'
import { EmptyPanel } from './EmptyPanel'

export function ProductsSection({
  totalProductCount,
  signalCards,
}: {
  totalProductCount: number
  signalCards: ProductSignalCardModel[]
}) {
  const hasCatalogProducts = totalProductCount > 0
  const hasProductSignal = signalCards.length > 0
  const [lead, ...rest] = signalCards
  return (
    <section className="bh-region bh-region-products">
      <div className="bh-section-head">
        <h2 className="bh-h">Your products</h2>
        <Link href="/products" className="bh-link">
          View all products →
        </Link>
      </div>
      {!hasCatalogProducts ? (
        <EmptyPanel
          title={`Bring your products into ${PRODUCT_NAME}`}
          body="Add products to start building your brand workspace."
          href="/products"
          cta="Add products →"
        />
      ) : !hasProductSignal ? (
        <EmptyPanel
          title="No product signal yet"
          body={`Your products are on ${PRODUCT_NAME}. As consumers compare products they’ve tried, preference signals will begin appearing here.`}
          href="/products"
          cta="See all products →"
        />
      ) : lead ? (
        <div className="bh-panel bh-panel-products portal-panel">
          <ProductSignalCard card={lead} variant="lead" />
          {rest.length > 0 ? (
            <div className="bh-product-list">
              {rest.map((card) => (
                <ProductSignalCard key={card.productId} card={card} variant="row" />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
