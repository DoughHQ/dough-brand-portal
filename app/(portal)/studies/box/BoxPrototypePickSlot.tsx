'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { listBrandPrototypesAction } from '../../prototypes/actions'
import { readinessLabel } from '@/lib/prototypes/readiness'
import { resolvePrototypePreviewUrl } from '@/lib/prototypes/storage'
import type { PrototypeListItem } from '@/lib/prototypes/types'
import { createClient } from '@/lib/supabase'

type Props = {
  /** Prototype ids already seated in this draft. */
  taken: Set<string>
  onPick: (item: PrototypeListItem, imageUrl: string | null) => void
  onCancel?: () => void
}

function Thumb({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }
    let cancelled = false
    void resolvePrototypePreviewUrl(createClient(), path).then((u) => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [path])

  if (!url) {
    return (
      <span
        aria-hidden
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: 'var(--surface-1)',
          border: '1px solid var(--ink-10)',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={44}
      height={44}
      style={{
        width: 44,
        height: 44,
        objectFit: 'contain',
        borderRadius: 8,
        background: 'var(--surface-1)',
        border: '1px solid var(--ink-10)',
        flexShrink: 0,
      }}
    />
  )
}

export default function BoxPrototypePickSlot({ taken, onPick, onCancel }: Props) {
  const [items, setItems] = useState<PrototypeListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pickingId, setPickingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void listBrandPrototypesAction().then((res) => {
      if (cancelled) return
      if (!res.ok) {
        setError(res.error)
        setItems([])
        return
      }
      setItems(res.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const ready = useMemo(
    () => (items ?? []).filter((i) => i.readiness === 'ready' && i.archived_at == null),
    [items]
  )
  const notReady = useMemo(
    () =>
      (items ?? []).filter((i) => i.readiness !== 'ready' && i.archived_at == null),
    [items]
  )

  async function pick(item: PrototypeListItem) {
    if (taken.has(item.id) || item.readiness !== 'ready') return
    setPickingId(item.id)
    const imageUrl = await resolvePrototypePreviewUrl(
      createClient(),
      item.image_paths[0] ?? null
    )
    onPick(item, imageUrl)
    setPickingId(null)
  }

  return (
    <div
      style={{
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-md)',
        padding: 14,
        background: 'var(--paper)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-80)' }}>
          Choose a ready prototype
        </div>
        {onCancel ? (
          <button type="button" className="cb-quiet-action" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>

      {items == null ? (
        <p className="cb-field-note" style={{ margin: 0 }}>
          Loading library…
        </p>
      ) : error ? (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--red)' }}>
          {error}
        </p>
      ) : ready.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.45 }}>
          <p style={{ margin: '0 0 8px' }}>
            No ready prototypes yet. A seatable sample needs a photo and a declared
            allergen list.
          </p>
          <Link href="/prototypes" className="cb-quiet-action">
            Open prototype library →
          </Link>
          {notReady.length > 0 ? (
            <p style={{ margin: '10px 0 0', fontSize: 12 }}>
              {notReady.length} in the library still{' '}
              {notReady.length === 1 ? 'needs' : 'need'} work (
              {readinessLabel(notReady[0].readiness).toLowerCase()}
              {notReady.length > 1 ? ', …' : ''}).
            </p>
          ) : null}
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {ready.map((item) => {
            const isTaken = taken.has(item.id)
            const busy = pickingId === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={isTaken || busy}
                  onClick={() => void pick(item)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    textAlign: 'left',
                    border: '1px solid var(--ink-10)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    background: isTaken ? 'var(--surface-1)' : 'var(--paper)',
                    cursor: isTaken ? 'not-allowed' : 'pointer',
                    opacity: isTaken ? 0.55 : 1,
                  }}
                >
                  <Thumb path={item.image_paths[0] ?? null} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        display: 'block',
                        fontWeight: 600,
                        fontSize: 14,
                        color: 'var(--ink-80)',
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: 'var(--ink-50)',
                        marginTop: 2,
                      }}
                    >
                      {item.category_label ?? 'Uncategorized'}
                      {item.packaging === 'plain_sample' ? ' · Plain sample' : ' · Final packaging'}
                      {isTaken ? ' · Already in this box' : ''}
                      {busy ? ' · Adding…' : ''}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {ready.length > 0 ? (
        <p className="cb-field-note" style={{ margin: '10px 0 0' }}>
          Need a new sample?{' '}
          <Link href="/prototypes" className="cb-quiet-action">
            Manage library
          </Link>
        </p>
      ) : null}
    </div>
  )
}
