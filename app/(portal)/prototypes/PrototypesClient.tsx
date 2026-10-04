'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import CatPage from '@/components/categories/CatPage'
import '@/components/categories/categoriesPage.css'
import { allergenSummary } from '@/lib/prototypes/allergens'
import { readinessLabel } from '@/lib/prototypes/readiness'
import { resolvePrototypePreviewUrl } from '@/lib/prototypes/storage'
import type { PrototypeListItem, PrototypeReadiness } from '@/lib/prototypes/types'
import PrototypeEditor from './PrototypeEditor'
import './prototypesPage.css'

type Props = {
  brandId: number
  brandName: string
  initialItems: PrototypeListItem[]
  loadError?: string | null
}

function ReadinessPill({ readiness }: { readiness: PrototypeReadiness }) {
  return (
    <span className={`proto-pill proto-pill-${readiness}`}>{readinessLabel(readiness)}</span>
  )
}

function CardArt({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }
    let cancelled = false
    const supabase = createClient()
    void resolvePrototypePreviewUrl(supabase, path).then((u) => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [path])

  if (!url) return <div className="proto-card-art proto-card-art-empty" aria-hidden />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="proto-card-art" />
  )
}

export default function PrototypesClient({
  brandId,
  brandName,
  initialItems,
  loadError,
}: Props) {
  const [items, setItems] = useState(initialItems)
  const [editing, setEditing] = useState<PrototypeListItem | null | 'new'>(null)
  const [filter, setFilter] = useState<'all' | PrototypeReadiness>('all')

  const readyCount = useMemo(() => items.filter((i) => i.readiness === 'ready').length, [items])
  const needsCount = items.length - readyCount

  const visible = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((i) => i.readiness === filter)
  }, [filter, items])

  function upsert(row: PrototypeListItem) {
    setItems((prev) => {
      const without = prev.filter((p) => p.id !== row.id)
      return [row, ...without]
    })
  }

  return (
    <CatPage>
      <header className="cat-header">
        <div className="cat-header-copy">
          <h1 className="cat-title">Prototypes</h1>
          <p className="cat-lede">
            Unreleased products for {brandName}. Private library — never the public catalog.
            Ready samples (photo + allergens) can be seated in an IHUT box study.
          </p>
        </div>
        <div className="prod-header-actions">
          <button type="button" className="proto-primary-btn" onClick={() => setEditing('new')}>
            Add prototype
          </button>
        </div>
      </header>

      <div className="cat-summary">
        <div className="cat-summary-card">
          <div>
            <div className="cat-summary-label">In library</div>
            <div className="cat-summary-value">{items.length}</div>
            <div className="cat-summary-hint">Active prototypes</div>
          </div>
        </div>
        <div className="cat-summary-card">
          <div>
            <div className="cat-summary-label">Ready</div>
            <div className="cat-summary-value">{readyCount}</div>
            <div className="cat-summary-hint">Photo + allergens declared</div>
          </div>
        </div>
        <div className="cat-summary-card">
          <div>
            <div className="cat-summary-label">Needs work</div>
            <div className="cat-summary-value">{needsCount}</div>
            <div className="cat-summary-hint">Missing photo or allergens</div>
          </div>
        </div>
      </div>

      {loadError ? (
        <p role="alert" className="proto-error">
          {loadError}
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="proto-toolbar">
          {(
            [
              ['all', 'All'],
              ['ready', 'Ready'],
              ['needs_allergens', 'Needs allergens'],
              ['needs_photo', 'Needs photo'],
              ['incomplete', 'Incomplete'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`prod-filter${filter === key ? ' prod-filter-on' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="proto-empty">
          <div className="proto-empty-eyebrow">Your first unreleased product</div>
          <h2 className="proto-empty-title">Build the library before you ship the box</h2>
          <p className="proto-empty-copy">
            Name it, mark plain sample or final packaging, add a photo, and declare allergens.
            When seating opens, every ready prototype is one tap away.
          </p>
          <button type="button" className="proto-primary-btn" onClick={() => setEditing('new')}>
            Add prototype
          </button>
        </div>
      ) : (
        <div className="proto-grid">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              className="proto-card"
              onClick={() => setEditing(item)}
            >
              <CardArt path={item.image_paths[0] ?? null} />
              <div className="proto-card-body">
                <div className="proto-card-top">
                  <ReadinessPill readiness={item.readiness} />
                  <span className="proto-pack">
                    {item.packaging === 'final_packaging' ? 'Final pack' : 'Plain sample'}
                  </span>
                </div>
                <div className="proto-card-name">{item.name}</div>
                {item.internal_label ? (
                  <div className="proto-card-internal">{item.internal_label}</div>
                ) : null}
                <div className="proto-card-meta">
                  {item.category_label ?? 'Category'}
                  {item.planned_price != null ? ` · $${item.planned_price.toFixed(2)}` : ''}
                </div>
                <div className="proto-card-allergens">
                  {item.allergens_declared_at != null
                    ? allergenSummary(
                        item.allergens_contains ?? [],
                        item.allergens_may_contain ?? []
                      )
                    : 'Allergens not declared'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {editing != null ? (
        <PrototypeEditor
          brandId={brandId}
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={upsert}
          onArchived={(id) => setItems((prev) => prev.filter((p) => p.id !== id))}
        />
      ) : null}
    </CatPage>
  )
}
