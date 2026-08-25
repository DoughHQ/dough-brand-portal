'use client'

import { useRouter } from 'next/navigation'
import {
  brandCategoryOverviewHref,
  previewDashboardHref,
} from '@/lib/categoryReport/href'
import type { CatalogProduct, CategoryMode, CategoryScope } from '@/lib/categoryReport/types'

const selectStyle = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--mist)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  background: 'var(--paper)',
  color: 'var(--ink)',
  minWidth: 220,
  maxWidth: 320,
} as const

/** Focal control for Overview — brand destination or admin preview harness. */
export default function OverviewFocalSelect({
  catalog,
  focal,
  scope,
  scopeId,
  mode,
  linkMode = 'preview',
}: {
  catalog: CatalogProduct[]
  focal: number | null
  scope: CategoryScope
  scopeId: number
  mode: CategoryMode
  linkMode?: 'brand' | 'preview'
}) {
  const router = useRouter()

  if (catalog.length === 0) return null

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
        }}
      >
        Your product
      </span>
      <select
        value={focal == null ? '' : String(focal)}
        onChange={(e) => {
          const v = e.target.value
          const nextFocal = v ? Number(v) : null
          const href =
            linkMode === 'brand'
              ? brandCategoryOverviewHref(scopeId, nextFocal)
              : previewDashboardHref({
                  scope,
                  id: scopeId,
                  focal: nextFocal,
                  mode,
                })
          router.replace(href)
        }}
        style={selectStyle}
      >
        <option value="">No focal product</option>
        {catalog.map((p) => (
          <option key={p.product_id} value={p.product_id}>
            {p.name}
            {p.brand ? ` · ${p.brand}` : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
