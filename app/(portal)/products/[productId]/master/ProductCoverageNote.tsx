import { caption } from '@/lib/productMaster/styles'
import { coveragePct } from '@/lib/productMaster/format'
import type { ProductMaster } from '@/lib/productMaster/types'

export function ProductCoverageNote({ cov }: { cov: ProductMaster['coverage'] }) {
  return (
    <>
      {cov && (
        <p style={{ ...caption, margin: '28px 0 0' }}>
          Across {cov.active_products.toLocaleString()} active products:{' '}
          {coveragePct(cov.with_nutrition, cov.active_products)} have nutrition ·{' '}
          {coveragePct(cov.with_micronutrients, cov.active_products)} have micronutrients ·{' '}
          {coveragePct(cov.with_image, cov.active_products)} have an image ·{' '}
          {coveragePct(cov.with_price, cov.active_products)} have a price.
          <span style={{ color: 'var(--ink-30)' }}> · as of {cov.as_of}</span>
        </p>
      )}
    </>
  )
}
