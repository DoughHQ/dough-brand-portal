'use client'

import type { CSSProperties } from 'react'
import { button, caption, panel, panelPending } from '@/lib/productMaster/styles'
import { formatMoney } from '@/lib/productMaster/format'
import type { MasterSku, ProductMaster } from '@/lib/productMaster/types'
import { ProductPricingTab } from './ProductDetailTabPanels'
import { ProposalBadge, SectionHeading, Stat } from './productMasterBits'
import type { ProductMasterWrites } from './useProductMasterWrites'

const muted: CSSProperties = { ...caption }
const secondaryBtn: CSSProperties = { ...button }

function pendingPanelStyle(active: boolean): CSSProperties {
  return active ? panelPending : panel
}

export function PricingTab({
  master,
  writes,
  selectedSku,
}: {
  master: ProductMaster
  writes: ProductMasterWrites
  selectedSku: MasterSku | null
}) {
  const { pendingFields, priceSurface, priceLoading, loadPriceSurface } = writes

  return (
    <ProductPricingTab>
      {/* Price */}
      <div style={pendingPanelStyle(pendingFields.has('price'))}>
        {/* Price comparison surface */}
        <SectionHeading>
          Price
          <ProposalBadge types={pendingFields} match="price" />
        </SectionHeading>
        <p style={{ ...muted, marginBottom: 12 }}>
          MSRP is edited on each SKU row. This section compares what you say vs what shoppers
          paid.
        </p>
        {selectedSku && (
          <p style={{ ...muted, marginBottom: 12 }}>
            This SKU
            {selectedSku.barcode ? ` · GTIN ${selectedSku.barcode}` : ''}: MSRP{' '}
            {formatMoney(selectedSku.msrp)}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 12 }}>
          <Stat label="Product MSRP (aggregate)" value={formatMoney(master.price?.msrp)} />
          <Stat
            label="Price tier"
            value={master.price?.price_tier ?? '—'}
            sub="from shopper prices"
          />
          <Stat
            label="Shopper observations"
            value={
              master.price?.observed?.publishable
                ? formatMoney(master.price.observed.median)
                : String(master.price?.observed?.observations ?? 0)
            }
            sub={
              master.price?.observed?.publishable
                ? 'median paid'
                : `${master.price?.observed?.observations ?? 0} shopper observations · need ${master.price?.min_observations_to_publish ?? 3} to publish a range.`
            }
          />
        </div>
        {master.price?.msrp_vs_observed && (
          <p style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 12, lineHeight: 1.5 }}>
            You say {formatMoney(master.price.msrp)} · shoppers paid a median of{' '}
            {formatMoney(master.price.observed.median)} · {master.price.msrp_vs_observed.reading} (
            {master.price.msrp_vs_observed.delta_pct > 0 ? '+' : ''}
            {master.price.msrp_vs_observed.delta_pct}%)
          </p>
        )}
        <button type="button" onClick={() => void loadPriceSurface()} style={secondaryBtn} disabled={priceLoading}>
          {priceLoading ? 'Loading…' : 'Retailer & metro breakdown'}
        </button>
        {priceSurface != null && (
          <pre
            style={{
              marginTop: 12,
              fontSize: 13,
              background: 'var(--surface)',
              padding: 12,
              borderRadius: 8,
              overflow: 'auto',
              maxHeight: 240,
            }}
          >
            {JSON.stringify(priceSurface, null, 2)}
          </pre>
        )}
      </div>
    </ProductPricingTab>
  )
}
