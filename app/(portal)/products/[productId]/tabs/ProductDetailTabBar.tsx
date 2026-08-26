'use client'

import type { ProductDetailTab } from './productDetailTabs'
import { PRODUCT_DETAIL_TABS, PRODUCT_DETAIL_TAB_LABELS } from './productDetailTabs'
import './productDetailTabs.css'

export default function ProductDetailTabBar({
  active,
  packageCount,
  studyCount,
  onSelect,
}: {
  active: ProductDetailTab
  packageCount: number
  studyCount: number
  onSelect: (tab: ProductDetailTab) => void
}) {
  return (
    <nav className="pm-tabs" role="tablist" aria-label="Product sections">
      {PRODUCT_DETAIL_TABS.map((id) => {
        const selected = id === active
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`pm-tab${selected ? ' pm-tab-active' : ''}`}
            onClick={() => onSelect(id)}
          >
            <span>{PRODUCT_DETAIL_TAB_LABELS[id]}</span>
            {id === 'packages' && packageCount > 0 ? (
              <span className="pm-tab-count">{packageCount}</span>
            ) : null}
            {id === 'studies' && studyCount > 0 ? (
              <span className="pm-tab-count">{studyCount}</span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
