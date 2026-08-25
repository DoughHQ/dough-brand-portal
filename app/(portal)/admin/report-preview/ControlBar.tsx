'use client'

import { type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { previewDashboardHref } from '@/lib/categoryReport/href'
import { formatCount } from '@/lib/categoryReport/copy'
import type { CatalogProduct, CategoryMode, CategoryScope } from '@/lib/categoryReport/types'
import type { ScopeSearchHit } from '@/lib/categoryReport/scopeSearch'
import ScopeSearch from './ScopeSearch'

type Props = {
  scope: CategoryScope | null
  scopeId: number | null
  scopeName: string | null
  focal: number | null
  mode: CategoryMode
  catalog: CatalogProduct[]
  raters?: number
  threshold?: number
  battles?: number
  productsBattled?: number
}

const inputStyle: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid var(--ink-10)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  background: 'var(--white)',
  color: 'var(--ink)',
}

export default function ControlBar({
  scope,
  scopeId,
  scopeName,
  focal,
  mode,
  catalog,
  raters,
  threshold,
  battles,
  productsBattled,
}: Props) {
  const router = useRouter()

  function go(next: {
    scope?: CategoryScope
    id?: number | null
    focal?: number | null
    mode?: CategoryMode
  }) {
    const nextScope = next.scope ?? scope
    const nextId = next.id === undefined ? scopeId : next.id
    if (!nextScope || nextId == null) {
      router.replace('/admin/report-preview')
      return
    }
    router.replace(
      previewDashboardHref({
        scope: nextScope,
        id: nextId,
        focal: next.focal === undefined ? focal : next.focal,
        mode: next.mode ?? mode,
      })
    )
  }

  function onPick(hit: ScopeSearchHit) {
    go({ scope: hit.scope, id: hit.scopeId, focal: null })
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--white)',
        borderBottom: '1px solid var(--ink-10)',
        padding: '12px 32px',
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <ScopeSearch
          scope={scope}
          scopeId={scopeId}
          scopeName={scopeName}
          onSelect={onPick}
          onClear={() => router.replace('/admin/report-preview')}
        />

        {mode === 'admin' ? (
          <select
            value={focal == null ? '' : String(focal)}
            onChange={(e) => {
              const v = e.target.value
              go({ focal: v ? Number(v) : null })
            }}
            disabled={!scopeId || catalog.length === 0}
            style={{ ...inputStyle, minWidth: 200 }}
          >
            <option value="">No focal product</option>
            {catalog.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.name}
                {p.brand ? ` · ${p.brand}` : ''}
              </option>
            ))}
          </select>
        ) : null}

        <div
          style={{
            display: 'flex',
            background: 'var(--surface-1)',
            borderRadius: 6,
            padding: 3,
            gap: 2,
          }}
        >
          {(['admin', 'brand'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => go({ mode: m })}
              disabled={!scopeId}
              style={{
                padding: '5px 12px',
                border: 'none',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: mode === m ? 600 : 400,
                fontFamily: 'var(--font-sans)',
                cursor: scopeId ? 'pointer' : 'default',
                background: mode === m ? 'var(--white)' : 'transparent',
                color: mode === m ? 'var(--ink)' : 'var(--ink-50)',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {m === 'brand' ? 'Overview' : 'Admin'}
            </button>
          ))}
        </div>

        {mode === 'admin' && scopeId != null && threshold != null ? (
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: 16,
              fontSize: 12,
              color: 'var(--ink-50)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>
              <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>
                {formatCount(raters ?? 0)}
              </strong>
              {' / '}
              {formatCount(threshold)} raters
            </span>
            <span>{formatCount(battles ?? 0)} battles</span>
            <span>{formatCount(productsBattled ?? 0)} products</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
