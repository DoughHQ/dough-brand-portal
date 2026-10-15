'use client'

import CatPage from '@/components/categories/CatPage'
import type { Brand } from '@/lib/queries'
import type {
  BrandCatalogSummary,
  BrandProductPageCursor,
  BrandProductPageItem,
} from '@/lib/brandHome/parseBrandProductPage'
import { ProductsHeader } from './catalog/ProductsHeader'
import { ProductsLoadMore } from './catalog/ProductsLoadMore'
import { ProductsResults } from './catalog/ProductsResults'
import { ProductsSummary } from './catalog/ProductsSummary'
import { ProductsToolbar } from './catalog/ProductsToolbar'
import { useProductsCatalog } from './catalog/useProductsCatalog'
import '@/components/categories/categoriesPage.css'
import '@/components/products/productTile.css'
import '@/components/products/productFacets.css'
import './productsPage.css'

interface ProductsClientProps {
  brand: Brand
  isImpersonating?: boolean
  summary: BrandCatalogSummary | null
  initialItems: BrandProductPageItem[]
  initialHasMore: boolean
  initialCursor: BrandProductPageCursor | null
}

export default function ProductsClient({
  brand,
  isImpersonating: _isImpersonating,
  summary,
  initialItems,
  initialHasMore,
  initialCursor,
}: ProductsClientProps) {
  const catalog = useProductsCatalog({
    summary,
    initialItems,
    initialHasMore,
    initialCursor,
  })

  return (
    <CatPage>
      <ProductsHeader
        brand={brand}
        summary={summary}
        listError={catalog.listError}
        facetError={catalog.facetError}
        addOpen={catalog.addOpen}
        setAddOpen={catalog.setAddOpen}
      />
      <ProductsSummary
        productCount={catalog.productCount}
        battledCount={catalog.battledCount}
        categoryCount={catalog.categoryCount}
        claimedCount={catalog.claimedCount}
        unclaimedCount={catalog.unclaimedCount}
      />
      <ProductsToolbar
        search={catalog.search}
        setSearch={catalog.setSearch}
        showBattledOnly={catalog.showBattledOnly}
        setShowBattledOnly={catalog.setShowBattledOnly}
        viewMode={catalog.viewMode}
        setViewMode={catalog.setViewMode}
      />
      <ProductsResults
        items={catalog.items}
        viewMode={catalog.viewMode}
        facetById={catalog.facetById}
        isPending={catalog.isPending}
        debouncedSearch={catalog.debouncedSearch}
      />
      {catalog.hasMore ? (
        <ProductsLoadMore loadingMore={catalog.loadingMore} loadMore={catalog.loadMore} />
      ) : null}
    </CatPage>
  )
}
