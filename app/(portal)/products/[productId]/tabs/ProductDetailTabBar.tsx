'use client'

import type { ProductDetailTab } from './productDetailTabs'
import { PRODUCT_DETAIL_TABS, PRODUCT_DETAIL_TAB_LABELS } from './productDetailTabs'
import { proofTabAskAria } from '@/lib/transparency/proofAskCounts'
import './productDetailTabs.css'

export default function ProductDetailTabBar({
  active,
  packageCount,
  studyCount,
  proofAskCount = 0,
  onSelect,
}: {
  active: ProductDetailTab
  packageCount: number
  studyCount: number
  proofAskCount?: number
  onSelect: (tab: ProductDetailTab) => void
}) {
  return (
    <nav className="pm-tabs" role="tablist" aria-label="Product sections">
      {PRODUCT_DETAIL_TABS.map((id) => {
        const selected = id === active
        const proofAsked = id === 'proof' && proofAskCount > 0
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={
              proofAsked ? proofTabAskAria(proofAskCount) : undefined
            }
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
            {proofAsked ? (
              <span className="pm-tab-count pm-tab-count--ask">{proofAskCount}</span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
