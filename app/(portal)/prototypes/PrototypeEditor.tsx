'use client'

import { useEffect, useState, useTransition } from 'react'
import CategoryCombobox from '@/app/(portal)/studies/concept/CategoryCombobox'
import {
  getTaxonomyNodeAction,
  type TaxonomyNodeInfo,
} from '@/app/(portal)/studies/concept/actions'
import {
  archiveBrandPrototypeAction,
  declarePrototypeAllergensAction,
  saveBrandPrototypeAction,
} from './actions'
import PrototypeAllergenDeclare from './PrototypeAllergenDeclare'
import PrototypeImageUploader from './PrototypeImageUploader'
import type { PrototypeListItem, PrototypePackaging } from '@/lib/prototypes/types'

type Props = {
  brandId: number
  initial: PrototypeListItem | null
  onClose: () => void
  onSaved: (row: PrototypeListItem) => void
  onArchived: (id: string) => void
}

export default function PrototypeEditor({
  brandId,
  initial,
  onClose,
  onSaved,
  onArchived,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(initial?.name ?? '')
  const [internalLabel, setInternalLabel] = useState(initial?.internal_label ?? '')
  const [packaging, setPackaging] = useState<PrototypePackaging>(
    initial?.packaging ?? 'plain_sample'
  )
  const [price, setPrice] = useState(
    initial?.planned_price != null ? String(initial.planned_price) : ''
  )
  const [imagePaths, setImagePaths] = useState<string[]>(initial?.image_paths ?? [])
  const [node, setNode] = useState<TaxonomyNodeInfo | null>(null)
  const [taxonomyNodeId, setTaxonomyNodeId] = useState<number | null>(
    initial?.taxonomy_node_id ?? null
  )
  const [contains, setContains] = useState<string[]>(initial?.allergens_contains ?? [])
  const [mayContain, setMayContain] = useState<string[]>(initial?.allergens_may_contain ?? [])
  const [allergensDeclared, setAllergensDeclared] = useState(
    initial?.allergens_declared_at != null
  )
  const [error, setError] = useState<string | null>(null)
  const [prototypeId, setPrototypeId] = useState<string | null>(initial?.id ?? null)

  useEffect(() => {
    if (taxonomyNodeId == null) {
      setNode(null)
      return
    }
    let cancelled = false
    void getTaxonomyNodeAction(taxonomyNodeId).then((n) => {
      if (!cancelled) setNode(n)
    })
    return () => {
      cancelled = true
    }
  }, [taxonomyNodeId])

  function parsePrice(): number | null {
    const t = price.trim()
    if (!t) return null
    const n = Number(t)
    if (!Number.isFinite(n) || n <= 0) return null
    return Math.round(n * 100) / 100
  }

  function save(andDeclare: boolean) {
    setError(null)
    if (!name.trim()) {
      setError('Name the prototype.')
      return
    }
    if (taxonomyNodeId == null) {
      setError('Pick a category.')
      return
    }
    const plannedPrice = parsePrice()
    if (price.trim() && plannedPrice == null) {
      setError('Enter a valid shelf price, or leave it blank.')
      return
    }

    startTransition(async () => {
      const saved = await saveBrandPrototypeAction({
        prototypeId,
        brandId,
        name,
        internalLabel: internalLabel.trim() || null,
        taxonomyNodeId,
        packaging,
        plannedPrice,
        imagePaths,
      })
      if (!saved.ok) {
        setError(saved.error)
        return
      }
      setPrototypeId(saved.data.id)

      if (andDeclare || allergensDeclared) {
        if (!allergensDeclared) {
          onSaved(saved.data)
          onClose()
          return
        }
        const declared = await declarePrototypeAllergensAction({
          prototypeId: saved.data.id,
          contains,
          mayContain,
        })
        if (!declared.ok) {
          setError(declared.error)
          onSaved(saved.data)
          return
        }
        onSaved(declared.data)
        onClose()
        return
      }

      onSaved(saved.data)
      onClose()
    })
  }

  function archive() {
    if (!prototypeId) {
      onClose()
      return
    }
    if (!window.confirm('Archive this prototype? It will leave the active library.')) return
    startTransition(async () => {
      const result = await archiveBrandPrototypeAction(prototypeId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onArchived(prototypeId)
      onClose()
    })
  }

  return (
    <div className="proto-editor-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="proto-editor"
        role="dialog"
        aria-modal="true"
        aria-label={initial ? 'Edit prototype' : 'Add prototype'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="proto-editor-header">
          <div>
            <div className="proto-eyebrow">{initial ? 'Edit' : 'New'}</div>
            <h2 className="proto-editor-title">
              {initial ? initial.name : 'Add a prototype'}
            </h2>
            <p className="proto-help-tight">
              Private to your brand. Respondents never see the internal label. Seating in a box
              lands with the next IHUT engine.
            </p>
          </div>
          <button type="button" className="proto-quiet-btn" onClick={onClose} aria-label="Close">
            Close
          </button>
        </header>

        <div className="proto-editor-body">
          <label className="proto-field">
            <span className="proto-field-label">Name shown to respondents</span>
            <input
              className="proto-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Honey sesame chips"
              maxLength={120}
              disabled={pending}
              autoFocus={!initial}
            />
          </label>

          <label className="proto-field">
            <span className="proto-field-label">Internal label · never shown</span>
            <input
              className="proto-input"
              value={internalLabel}
              onChange={(e) => setInternalLabel(e.target.value)}
              placeholder="e.g. v3 formula · blue bag"
              maxLength={120}
              disabled={pending}
            />
          </label>

          <div className="proto-field">
            <span className="proto-field-label">Category</span>
            <CategoryCombobox
              selected={node}
              pendingNodeId={node ? null : taxonomyNodeId}
              required
              onSelect={(n) => {
                setNode(n)
                setTaxonomyNodeId(n.taxonomy_node_id)
              }}
              onClear={() => {
                setNode(null)
                setTaxonomyNodeId(null)
              }}
            />
          </div>

          <div className="proto-field">
            <span className="proto-field-label">Packaging</span>
            <div className="proto-seg">
              <button
                type="button"
                className={`proto-seg-btn${packaging === 'plain_sample' ? ' proto-seg-on' : ''}`}
                disabled={pending}
                onClick={() => setPackaging('plain_sample')}
              >
                Plain sample
              </button>
              <button
                type="button"
                className={`proto-seg-btn${packaging === 'final_packaging' ? ' proto-seg-on' : ''}`}
                disabled={pending}
                onClick={() => setPackaging('final_packaging')}
              >
                Final packaging
              </button>
            </div>
            <p className="proto-help-tight">
              {packaging === 'plain_sample'
                ? 'Taste-only studies. Shown as Sample A / B to respondents.'
                : 'Shopper-facing pack. Enables shelf, opening, and expectation questions.'}
            </p>
          </div>

          <label className="proto-field">
            <span className="proto-field-label">Planned shelf price · optional</span>
            <input
              className="proto-input"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="4.99"
              disabled={pending}
            />
          </label>

          <div className="proto-field">
            <span className="proto-field-label">Photos</span>
            <PrototypeImageUploader
              brandId={brandId}
              imagePaths={imagePaths}
              disabled={pending}
              onChange={setImagePaths}
            />
          </div>

          <div className="proto-field">
            <span className="proto-field-label">Allergens</span>
            <PrototypeAllergenDeclare
              contains={contains}
              mayContain={mayContain}
              declared={allergensDeclared}
              disabled={pending}
              onChange={({ contains: c, mayContain: m, declared }) => {
                setContains(c)
                setMayContain(m)
                setAllergensDeclared(declared)
              }}
            />
          </div>

          {error ? (
            <p role="alert" className="proto-error">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="proto-editor-footer">
          {prototypeId ? (
            <button type="button" className="proto-quiet-btn proto-danger" disabled={pending} onClick={archive}>
              Archive
            </button>
          ) : (
            <span />
          )}
          <div className="proto-editor-footer-right">
            <button type="button" className="proto-quiet-btn" disabled={pending} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="proto-primary-btn"
              disabled={pending}
              onClick={() => save(true)}
            >
              {pending ? 'Saving…' : prototypeId ? 'Save' : 'Create prototype'}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
