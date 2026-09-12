'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  declareProductFacet,
  fetchDeclarableFacets,
  fetchProductFacetSummaries,
  withdrawProductFacetDeclaration,
} from '@/lib/facets/api'
import {
  composeShopperFacetLine,
  facetValueLabel,
  filterDerivedValues,
  formatFacetFooterLine,
  provenanceLabelFromSource,
  rowIsPickerEditable,
  type DeclarableFacetRow,
  type FacetDeclaredValue,
  type FacetDerivedValue,
  type FacetSummaryRow,
} from '@/lib/facets/productFacets'
import { FacetChipAdd, FacetSearchSelect } from '@/components/products/FacetValuePicker'
import './productFacets.css'

export const FACETS_LEDE =
  "We derive what we can from labels and ingredients. Add what only you know — it helps shoppers find your product. Allergens and ingredients are derived by Dough and can't be edited here."

function isLiveDeclared(d: FacetDeclaredValue): boolean {
  const s = (d.review_state || '').toLowerCase()
  return s !== 'pending' && s !== 'rejected' && s !== 'withdrawn'
}

function isPendingDeclared(d: FacetDeclaredValue): boolean {
  return (d.review_state || '').toLowerCase() === 'pending'
}

function sectionHasContent(row: DeclarableFacetRow): boolean {
  const derived = filterDerivedValues(row.facet_type, row.derived_values)
  const declared = row.declared_values ?? []
  return derived.length > 0 || declared.length > 0
}

type EditorProps = {
  productId: number
  canEdit?: boolean
  onChanged?: () => void
}

/** Facets dossier — product detail tab only. */
export default function ProductAttributesEditor({
  productId,
  canEdit = true,
  onChanged,
}: EditorProps) {
  const [rows, setRows] = useState<DeclarableFacetRow[] | null>(null)
  const [summary, setSummary] = useState<FacetSummaryRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [openAdd, setOpenAdd] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const [facets, summaries] = await Promise.all([
      fetchDeclarableFacets(supabase, productId),
      fetchProductFacetSummaries(supabase, [productId]),
    ])
    if (facets.error) setError(facets.error)
    else if (summaries.error) setError(summaries.error)
    setRows(facets.rows)
    setSummary(summaries.rows[0] ?? null)
    setLoading(false)
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  const { known, claims, empty } = useMemo(() => {
    const list = rows ?? []
    const knownRows: DeclarableFacetRow[] = []
    const claimRows: DeclarableFacetRow[] = []
    const emptyRows: DeclarableFacetRow[] = []
    for (const r of list) {
      const has = sectionHasContent(r)
      const picker = rowIsPickerEditable(r)
      if (has && !picker) knownRows.push(r)
      else if (has && picker) claimRows.push(r)
      else if (picker) emptyRows.push(r)
    }
    return { known: knownRows, claims: claimRows, empty: emptyRows }
  }, [rows])

  const shopperLine = useMemo(() => (rows ? composeShopperFacetLine(rows) : ''), [rows])

  const refreshAfterWrite = async () => {
    await load()
    onChanged?.()
  }

  const opportunity = summary ? formatFacetFooterLine(summary) : null
  const hasAny = known.length + claims.length + empty.length > 0

  return (
    <div className="pf-dossier">
      <header className="pf-hero">
        <p className="pf-hero__kicker">Shopper discovery</p>
        <h2 className="pf-hero__title">Facets</h2>
        {opportunity ? (
          <p className="pf-hero__opportunity">
            {opportunity}
            {summary && summary.pending_count > 0 ? (
              <span className="pf-footer__pending">{summary.pending_count} pending</span>
            ) : null}
          </p>
        ) : null}
        {shopperLine ? (
          <div className="pf-preview" aria-live="polite">
            <p className="pf-preview__kicker">Shoppers can find this as</p>
            <p className="pf-preview__line">{shopperLine}</p>
          </div>
        ) : (
          <p className="pf-hero__empty-preview">
            Nothing shoppers can filter on yet — Dough will fill what it can; you add the rest.
          </p>
        )}
        <details className="pf-hero__details">
          <summary>How this works</summary>
          <p>{FACETS_LEDE}</p>
        </details>
      </header>

      {error ? <p className="pf-status__error">{error}</p> : null}
      {loading && !rows ? (
        <div className="pf-status__loading">Loading attributes…</div>
      ) : null}
      {!loading && rows && !hasAny ? (
        <div className="pf-status__empty">No attributes for this product yet.</div>
      ) : null}

      {known.length > 0 ? (
        <section className="pf-room">
          <header className="pf-room__head">
            <p className="pf-room__kicker">Dough knows</p>
            <h3 className="pf-room__title">Already on the product</h3>
            <p className="pf-room__lede">Derived from labels and placement — trust chips, not edits.</p>
          </header>
          <div className="pf-known-grid">
            {known.map((row) => (
              <KnownTile key={row.facet_type} row={row} />
            ))}
          </div>
        </section>
      ) : null}

      {claims.length > 0 ? (
        <section className="pf-room">
          <header className="pf-room__head">
            <p className="pf-room__kicker">Your claims</p>
            <h3 className="pf-room__title">Started attributes</h3>
            <p className="pf-room__lede">Add or withdraw values you stand behind.</p>
          </header>
          <div className="pf-claim-stack">
            {claims.map((row) => (
              <ClaimCard
                key={row.facet_type}
                row={row}
                productId={productId}
                canEdit={canEdit}
                busyKey={busyKey}
                setBusyKey={setBusyKey}
                setError={setError}
                onWrote={refreshAfterWrite}
              />
            ))}
          </div>
        </section>
      ) : null}

      {empty.length > 0 ? (
        <section className="pf-room">
          <header className="pf-room__head">
            <p className="pf-room__kicker">You can add</p>
            <h3 className="pf-room__title">Open attributes</h3>
            <p className="pf-room__lede">Only what applies — one at a time.</p>
          </header>
          <div className="pf-add-list">
            {empty.map((row) => {
              const open = openAdd === row.facet_type
              return (
                <div
                  key={row.facet_type}
                  className={`pf-add-row${open ? ' pf-add-row--open' : ''}`}
                >
                  <button
                    type="button"
                    className="pf-add-row__hit"
                    aria-expanded={open}
                    onClick={() => setOpenAdd(open ? null : row.facet_type)}
                  >
                    <span className="pf-add-row__name">{row.display_name}</span>
                    <span className="pf-add-row__meta">
                      {row.requires_evidence ? 'Needs evidence' : 'Optional'}
                      <span className="pf-add-row__chev" aria-hidden>
                        {open ? '▾' : '›'}
                      </span>
                    </span>
                  </button>
                  {open ? (
                    <div className="pf-add-row__body">
                      <ClaimCard
                        row={row}
                        productId={productId}
                        canEdit={canEdit}
                        busyKey={busyKey}
                        setBusyKey={setBusyKey}
                        setError={setError}
                        onWrote={refreshAfterWrite}
                        bare
                      />
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function KnownTile({ row }: { row: DeclarableFacetRow }) {
  const derived = filterDerivedValues(row.facet_type, row.derived_values)
  return (
    <article className="pf-known">
      <p className="pf-known__attr">{row.display_name}</p>
      <ul className="pf-known__values">
        {derived.map((d: FacetDerivedValue) => (
          <li key={d.value}>
            <span className="pf-known__value">{facetValueLabel(row, d.value, d.label)}</span>
            <span className="pf-known__whisper">{provenanceLabelFromSource(d.source)}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

function ClaimCard({
  row,
  productId,
  canEdit,
  busyKey,
  setBusyKey,
  setError,
  onWrote,
  bare = false,
}: {
  row: DeclarableFacetRow
  productId: number
  canEdit: boolean
  busyKey: string | null
  setBusyKey: (k: string | null) => void
  setError: (e: string | null) => void
  onWrote: () => Promise<void>
  bare?: boolean
}) {
  const derived = filterDerivedValues(row.facet_type, row.derived_values)
  const declared = row.declared_values ?? []
  const live = declared.filter(isLiveDeclared)
  const pending = declared.filter(isPendingDeclared)
  const available = row.available_values ?? []
  const multi = row.cardinality === 'multi'
  const requiresEvidence = Boolean(row.requires_evidence)
  const showPicker = canEdit && rowIsPickerEditable(row)

  const liveValues = new Set(live.map((d) => d.value))
  const derivedSet = new Set(derived.map((d) => d.value))
  const taken = new Set([...liveValues, ...derivedSet])

  const [draftSingle, setDraftSingle] = useState<string | null>(
    live[0]?.value ?? null,
  )
  const [pendingAdd, setPendingAdd] = useState<string | null>(null)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [evidenceNote, setEvidenceNote] = useState('')

  useEffect(() => {
    setDraftSingle(live[0]?.value ?? null)
    setPendingAdd(null)
    setEvidenceUrl('')
    setEvidenceNote('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.facet_type, live.map((d) => d.declaration_id).join(',')])

  const onWithdraw = async (declarationId: number) => {
    if (!showPicker) return
    const supabase = createClient()
    setBusyKey(`${row.facet_type}:w-${declarationId}`)
    setError(null)
    const res = await withdrawProductFacetDeclaration(supabase, declarationId, false)
    setBusyKey(null)
    if (res.error) {
      setError(res.error)
      return
    }
    await onWrote()
  }

  const declareValues = async (values: string[]) => {
    if (!showPicker || values.length === 0) return
    if (requiresEvidence && !evidenceUrl.trim()) {
      setError('Add a link to your certification.')
      return
    }
    const supabase = createClient()
    setBusyKey(`${row.facet_type}:declare`)
    setError(null)
    let mutated = false
    let failed = false
    for (const value of values) {
      const res = await declareProductFacet(supabase, {
        productId,
        facetType: row.facet_type,
        facetValue: value,
        evidenceUrl: requiresEvidence ? evidenceUrl.trim() : null,
        evidenceNote: requiresEvidence ? evidenceNote.trim() || null : null,
      })
      if (res.error) {
        setError(res.error)
        failed = true
        break
      }
      mutated = true
    }
    setBusyKey(null)
    if (!failed) {
      setPendingAdd(null)
      setEvidenceUrl('')
      setEvidenceNote('')
    }
    // Reconcile even after partial success so chips match the DB.
    if (mutated) await onWrote()
  }

  const saveSingle = async () => {
    if (!showPicker) return
    const next = draftSingle
    const current = live[0]?.value ?? null
    if (next === current) return

    const supabase = createClient()
    setBusyKey(`${row.facet_type}:declare`)
    setError(null)
    let mutated = false

    for (const d of live) {
      if (next && d.value === next) continue
      const res = await withdrawProductFacetDeclaration(supabase, d.declaration_id, false)
      if (res.error) {
        setError(res.error)
        setBusyKey(null)
        if (mutated) await onWrote()
        return
      }
      mutated = true
    }

    if (next && !derivedSet.has(next)) {
      if (requiresEvidence && !evidenceUrl.trim()) {
        setError('Add a link to your certification.')
        setBusyKey(null)
        if (mutated) await onWrote()
        return
      }
      const res = await declareProductFacet(supabase, {
        productId,
        facetType: row.facet_type,
        facetValue: next,
        evidenceUrl: requiresEvidence ? evidenceUrl.trim() : null,
        evidenceNote: requiresEvidence ? evidenceNote.trim() || null : null,
      })
      if (res.error) {
        setError(res.error)
        setBusyKey(null)
        if (mutated) await onWrote()
        return
      }
      mutated = true
    }

    setBusyKey(null)
    if (mutated) await onWrote()
  }

  const singleDirty =
    (draftSingle ?? null) !== (live[0]?.value ?? null) &&
    !(draftSingle && derivedSet.has(draftSingle) && !live[0])

  const body = (
    <>
      {(derived.length > 0 || live.length > 0 || pending.length > 0) && (
        <div className="pf-chip-row" aria-label="Current values">
          {derived.map((d) => (
            <span
              key={`d-${d.value}`}
              className="pf-chip pf-chip--derived"
              title={provenanceLabelFromSource(d.source)}
            >
              {facetValueLabel(row, d.value, d.label)}
              <span className="pf-chip__meta">{provenanceLabelFromSource(d.source)}</span>
            </span>
          ))}
          {live.map((d) => (
            <span key={`c-${d.declaration_id}`} className="pf-chip pf-chip--declared">
              {facetValueLabel(row, d.value, d.label)}
              {showPicker ? (
                <button
                  type="button"
                  className="pf-chip__x"
                  aria-label={`Remove ${facetValueLabel(row, d.value, d.label)}`}
                  disabled={busyKey != null}
                  onClick={() => void onWithdraw(d.declaration_id)}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
          {pending.map((d) => (
            <span key={`p-${d.declaration_id}`} className="pf-chip pf-chip--pending">
              {facetValueLabel(row, d.value, d.label)}
              <span className="pf-chip__meta">Pending review</span>
              {showPicker ? (
                <button
                  type="button"
                  className="pf-chip__x"
                  aria-label={`Withdraw pending ${facetValueLabel(row, d.value, d.label)}`}
                  disabled={busyKey != null}
                  onClick={() => void onWithdraw(d.declaration_id)}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      )}

      {showPicker && available.length > 0 ? (
        <div className="pf-claim__editor">
          {multi ? (
            <FacetChipAdd
              options={available}
              takenValues={taken}
              lockedValues={derivedSet}
              disabled={busyKey != null}
              placeholder={`Add ${row.display_name.toLowerCase()}…`}
              onAdd={(value) => {
                if (requiresEvidence) {
                  setPendingAdd(value)
                } else {
                  void declareValues([value])
                }
              }}
            />
          ) : (
            <FacetSearchSelect
              options={available}
              value={draftSingle}
              lockedValues={derivedSet}
              disabled={busyKey != null}
              placeholder={`Search ${row.display_name.toLowerCase()}…`}
              onChange={setDraftSingle}
            />
          )}

          {(requiresEvidence && (pendingAdd || (singleDirty && draftSingle))) ||
          (!multi && singleDirty) ? (
            <>
              {requiresEvidence && (pendingAdd || (singleDirty && draftSingle)) ? (
                <div className="pf-evidence">
                  <label>
                    Evidence URL
                    <input
                      type="url"
                      placeholder="https://"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      disabled={busyKey != null}
                    />
                  </label>
                  <label>
                    Note (optional)
                    <textarea
                      rows={2}
                      value={evidenceNote}
                      onChange={(e) => setEvidenceNote(e.target.value)}
                      disabled={busyKey != null}
                    />
                  </label>
                </div>
              ) : null}
              <div className="pf-actions">
                <button
                  type="button"
                  className="pf-btn"
                  disabled={
                    busyKey != null ||
                    (requiresEvidence && !evidenceUrl.trim()) ||
                    (multi ? !pendingAdd : !singleDirty)
                  }
                  onClick={() => {
                    if (multi && pendingAdd) void declareValues([pendingAdd])
                    else void saveSingle()
                  }}
                >
                  {busyKey?.startsWith(`${row.facet_type}:`)
                    ? 'Saving…'
                    : requiresEvidence
                      ? 'Submit for review'
                      : 'Save'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  )

  if (bare) return <div className="pf-claim pf-claim--bare">{body}</div>

  return (
    <article className="pf-claim">
      <div className="pf-claim__head">
        <h4 className="pf-claim__title">{row.display_name}</h4>
        {requiresEvidence ? (
          <span className="pf-claim__badge">Evidence</span>
        ) : null}
      </div>
      {body}
    </article>
  )
}
