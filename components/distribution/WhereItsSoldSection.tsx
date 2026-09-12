'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  declareAvailability,
  delistDeclaration,
  fetchCanDeclare,
  fetchDistribution,
  fetchPendingReports,
  fetchRetailerRegions,
  fetchShoppableRetailers,
  reviewReport,
  withdrawDeclaration,
  type Capability,
  type RegionOption,
  type RetailerOption,
} from '@/lib/distribution/api'
import {
  actionsForState,
  claimLabel,
  confirmLabel,
  formatCalendarDate,
  formatRelativeTimestamp,
  shopperLine,
} from '@/lib/distribution/actions'
import {
  coordFromRow,
  parseCoord,
  serializeCoord,
  type DistributionCoord,
} from '@/lib/distribution/coords'
import {
  groupDistributionByBanner,
  reportsForCoord,
  type AvailabilityReport,
  type DistributionRow,
} from '@/lib/distribution/grouping'
import './whereItsSold.css'

const SEARCH_THRESHOLD = 8

type SkuOption = {
  sku_variant_id: number
  label: string
}

type Props = {
  productId: number
  canEdit: boolean
  skus: SkuOption[]
}

type ModalKind =
  | null
  | { kind: 'add'; prefill?: Partial<DistributionCoord> & { reportId?: number; note?: string } }
  | { kind: 'delist'; declarationId: number; coveredByNational: boolean }
  | { kind: 'dispute'; reportId: number }
  | { kind: 'nationwide-confirm'; pending: PendingDeclare }

type PendingDeclare = {
  retailerId: number
  scopeLevel: 'national' | 'region'
  geoRegionId: number | null
  skuVariantId: number | null
  notes?: string | null
  afterCorrectReportId?: number
  afterCorrectNote?: string
}

function todayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function SearchCombobox<T extends { id: string; label: string }>({
  options,
  valueId,
  placeholder,
  disabled,
  onChange,
}: {
  options: T[]
  valueId: string | null
  placeholder: string
  disabled?: boolean
  onChange: (id: string | null) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.id === valueId) ?? null
  const useSearch = options.length >= SEARCH_THRESHOLD

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (!useSearch) {
    return (
      <select
        disabled={disabled}
        value={valueId ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="wis-combobox" ref={rootRef}>
      {selected ? (
        <div className="wis-picked">
          <span>{selected.label}</span>
          {!disabled ? (
            <button
              type="button"
              className="wis-btn wis-btn--quiet"
              aria-label="Clear"
              onClick={() => {
                onChange(null)
                setQuery('')
              }}
            >
              ×
            </button>
          ) : null}
        </div>
      ) : null}
      <input
        disabled={disabled}
        placeholder={selected ? 'Change…' : placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {open ? (
        <ul className="wis-combobox__list" role="listbox">
          {filtered.length === 0 ? (
            <li className="wis-combobox__empty">No matches</li>
          ) : (
            filtered.slice(0, 100).map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  className="wis-combobox__option"
                  onClick={() => {
                    onChange(o.id)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}

function EvidenceStack({ row }: { row: DistributionRow }) {
  const items: { key: string; className: string; node: ReactNode }[] = []

  if (row.brand_status === 'active') {
    items.push({
      key: 'brand',
      className: 'wis-ev--brand',
      node: (
        <>
          You declared this
          {row.brand_declared_at ? ` · ${formatRelativeTimestamp(row.brand_declared_at)}` : ''}
        </>
      ),
    })
  }
  if (row.brand_delisted_on) {
    items.push({
      key: 'delisted',
      className: 'wis-ev--delisted',
      node: <>You marked this delisted as of {formatCalendarDate(row.brand_delisted_on)}</>,
    })
  }
  if (row.dough_seeded) {
    items.push({
      key: 'dough',
      className: 'wis-ev--dough',
      node: (
        <>
          Dough found this
          {row.seed_found_at ? ` · ${formatRelativeTimestamp(row.seed_found_at)}` : ''}
          {row.seed_evidence_url ? (
            <>
              {' '}
              ·{' '}
              <a href={row.seed_evidence_url} target="_blank" rel="noreferrer">
                evidence
              </a>
            </>
          ) : null}
        </>
      ),
    })
  }
  if (row.shopper_reports > 0) {
    items.push({
      key: 'shoppers',
      className: `wis-ev--shoppers${row.shopper_signal_stale ? ' wis-ev--stale' : ''}`,
      node: shopperLine(row.shopper_reports, row.last_reported_on),
    })
  }

  if (items.length === 0) return null
  return (
    <ul className="wis-evidence">
      {items.map((it) => (
        <li key={it.key} className={it.className}>
          {it.node}
        </li>
      ))}
    </ul>
  )
}

export default function WhereItsSoldSection({ productId, canEdit, skus }: Props) {
  const searchParams = useSearchParams()
  const focusCoord = useMemo(() => parseCoord(searchParams.get('coord')), [searchParams])

  const [capability, setCapability] = useState<Capability | null>(null)
  const [rows, setRows] = useState<DistributionRow[]>([])
  const [reports, setReports] = useState<AvailabilityReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalKind>(null)

  const multiVariant = skus.length > 1

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const cap = await fetchCanDeclare(supabase, productId)
    if (cap.error) {
      setCapability(null)
      setRows([])
      setReports([])
      setError(cap.error)
      setLoading(false)
      return
    }
    setCapability(cap.capability)
    if (!cap.capability.allowed) {
      setRows([])
      setReports([])
      setLoading(false)
      return
    }
    const [dist, pending] = await Promise.all([
      fetchDistribution(supabase, productId),
      fetchPendingReports(supabase, productId),
    ])
    if (dist.error) setError(dist.error)
    else if (pending.error) setError(pending.error)
    setRows(dist.rows)
    setReports(pending.reports)
    setLoading(false)
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!focusCoord || loading) return
    const el = document.getElementById(`coord-${serializeCoord(focusCoord)}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusCoord, loading, rows])

  const groups = useMemo(() => groupDistributionByBanner(rows), [rows])

  async function afterWrite(message: string) {
    setToast(message)
    setModal(null)
    await load()
  }

  async function runDeclare(pending: PendingDeclare) {
    setBusy('declare')
    setError(null)
    const supabase = createClient()
    const res = await declareAvailability(supabase, {
      productId,
      retailerId: pending.retailerId,
      scopeLevel: pending.scopeLevel,
      geoRegionId: pending.geoRegionId,
      skuVariantId: pending.skuVariantId,
      notes: pending.notes ?? null,
    })
    if (res.error) {
      setError(res.error)
      setBusy(null)
      return
    }
    if (pending.afterCorrectReportId != null) {
      const note = (pending.afterCorrectNote ?? '').trim()
      if (!note) {
        setError('Add a short note explaining the correction.')
        setBusy(null)
        return
      }
      const rev = await reviewReport(supabase, {
        reportId: pending.afterCorrectReportId,
        action: 'correct',
        note,
      })
      if (rev.error) {
        setError(rev.error)
        setBusy(null)
        return
      }
    }
    setBusy(null)
    await afterWrite('You updated distribution just now.')
  }

  async function onConfirmReport(report: AvailabilityReport, row: DistributionRow) {
    setBusy(`confirm-${report.report_id}`)
    setError(null)
    const supabase = createClient()
    const res = await reviewReport(supabase, {
      reportId: report.report_id,
      action: 'confirm',
    })
    setBusy(null)
    if (res.error) {
      setError(res.error)
      return
    }
    const contradicted = report.contradicts_delisting
      ? ` (was delisted${row.brand_delisted_on ? ` as of ${formatCalendarDate(row.brand_delisted_on)}` : ''})`
      : ''
    await afterWrite(`Confirmed shopper report${contradicted}.`)
  }

  async function onWithdraw(row: DistributionRow) {
    if (row.declaration_id == null) return
    setBusy(`withdraw-${row.declaration_id}`)
    setError(null)
    const supabase = createClient()
    const res = await withdrawDeclaration(supabase, row.declaration_id)
    setBusy(null)
    if (res.error) {
      setError(res.error)
      return
    }
    await afterWrite(`You withdrew ${row.retailer_name} · ${row.scope_label}.`)
  }

  async function onClaim(row: DistributionRow) {
    setBusy(`claim-${serializeCoord(coordFromRow(row))}`)
    await runDeclare({
      retailerId: row.retailer_id,
      scopeLevel: row.scope_level === 'national' ? 'national' : 'region',
      geoRegionId: row.geo_region_id,
      skuVariantId: row.sku_variant_id,
    })
  }

  async function onRedeclare(row: DistributionRow) {
    setBusy(`redeclare-${serializeCoord(coordFromRow(row))}`)
    await runDeclare({
      retailerId: row.retailer_id,
      scopeLevel: row.scope_level === 'national' ? 'national' : 'region',
      geoRegionId: row.geo_region_id,
      skuVariantId: row.sku_variant_id,
    })
  }

  const allowed = capability?.allowed === true
  const refused = capability != null && !capability.allowed

  return (
    <div className="pm-overview-card pm-overview-compete wis-section" id="where-its-sold">
      <div className="wis-header">
        <div>
          <h2 className="pm-overview-heading" style={{ marginBottom: 4 }}>
            Where it&apos;s sold
          </h2>
          {!refused ? (
            <>
              <p className="wis-lede">
                Distribution you and Dough know about — authorised to be carried, not whether it is
                on the shelf right now.
              </p>
              <p className="wis-coming">
                We use this to show shoppers where to find your product. That surface is coming
                soon.
              </p>
            </>
          ) : null}
        </div>
        {canEdit && allowed ? (
          <button
            type="button"
            className="wis-btn wis-btn--primary"
            onClick={() => setModal({ kind: 'add' })}
          >
            Add a place
          </button>
        ) : null}
      </div>

      {toast ? <div className="wis-toast">{toast}</div> : null}
      {error ? <div className="wis-error">{error}</div> : null}

      {loading ? (
        <p className="wis-lede">Loading distribution…</p>
      ) : refused ? (
        <p className="wis-refused">
          {capability?.reasonMessage ??
            'We need to confirm who owns this product before you can add distribution.'}
        </p>
      ) : rows.length === 0 ? (
        <div className="wis-empty">
          <h3>We don&apos;t know where this is sold yet.</h3>
          <p>
            Add the retailers that carry it, and we&apos;ll show it to shoppers looking for it near
            them.
          </p>
          {canEdit ? (
            <button
              type="button"
              className="wis-btn wis-btn--primary"
              onClick={() => setModal({ kind: 'add' })}
            >
              Add a place
            </button>
          ) : null}
        </div>
      ) : (
        <div className="wis-groups">
          {groups.map((g) => (
            <section key={g.retailer_id} className="wis-group">
              <div className="wis-group-head">
                <span className="wis-group-name">{g.retailer_name}</span>
                {g.parent_name ? (
                  <span className="wis-group-parent">· {g.parent_name}</span>
                ) : null}
                {g.needsAttention ? (
                  <span className="wis-chip wis-chip--attention">Needs your review</span>
                ) : null}
              </div>
              {g.rows.map((row) => {
                const coord = coordFromRow(row)
                const key = serializeCoord(coord)
                const pending = reportsForCoord(reports, row)
                const actions = actionsForState(row.brand_status, row.awaiting_review)
                const focused =
                  focusCoord != null &&
                  serializeCoord(focusCoord) === key

                return (
                  <div
                    key={key}
                    id={`coord-${key}`}
                    className={`wis-coord${focused ? ' wis-coord--flash' : ''}`}
                  >
                    <div className="wis-coord-top">
                      <span className="wis-chip wis-chip--scope">{row.scope_label}</span>
                      <span className="wis-variant">{row.variant_label}</span>
                      {row.awaiting_review > 0 ? (
                        <span className="wis-chip wis-chip--attention">Needs your review</span>
                      ) : null}
                    </div>

                    <EvidenceStack row={row} />

                    {row.covered_by_national ? (
                      <p className="wis-warn">
                        Covered by a nationwide claim at this banner
                        {row.variant_label ? ` for ${row.variant_label}` : ''}.
                      </p>
                    ) : null}

                    {canEdit ? (
                      <div className="wis-actions">
                        {actions.includes('claim') ? (
                          <button
                            type="button"
                            className="wis-btn wis-btn--primary"
                            disabled={busy != null}
                            onClick={() => void onClaim(row)}
                          >
                            {claimLabel()}
                          </button>
                        ) : null}
                        {actions.includes('redeclare') ? (
                          <button
                            type="button"
                            className="wis-btn wis-btn--primary"
                            disabled={busy != null}
                            onClick={() => void onRedeclare(row)}
                          >
                            Re-declare
                          </button>
                        ) : null}
                        {actions.includes('withdraw') && row.declaration_id != null ? (
                          <button
                            type="button"
                            className="wis-btn"
                            disabled={busy != null}
                            onClick={() => void onWithdraw(row)}
                          >
                            Withdraw
                          </button>
                        ) : null}
                        {actions.includes('delist') && row.declaration_id != null ? (
                          <button
                            type="button"
                            className="wis-btn wis-btn--danger"
                            disabled={busy != null}
                            onClick={() =>
                              setModal({
                                kind: 'delist',
                                declarationId: row.declaration_id!,
                                coveredByNational: row.covered_by_national,
                              })
                            }
                          >
                            Mark delisted
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {canEdit && pending.length > 0 ? (
                      <div className="wis-reports">
                        {pending.map((report) => (
                          <div key={report.report_id} className="wis-report">
                            <div className="wis-report-meta">
                              Shopper report · {formatCalendarDate(report.report_date)}
                              {report.contradicts_delisting ? (
                                <>
                                  <br />
                                  <span className="wis-warn" style={{ margin: 0 }}>
                                    {row.brand_delisted_on
                                      ? `You marked this delisted on ${formatCalendarDate(row.brand_delisted_on)}. Confirming will list it as carried again.`
                                      : 'Confirming will list it as carried again (contradicts your delisting).'}
                                  </span>
                                </>
                              ) : null}
                            </div>
                            <div className="wis-report-actions">
                              <button
                                type="button"
                                className="wis-btn wis-btn--primary"
                                disabled={busy != null}
                                title={confirmLabel(
                                  report.contradicts_delisting,
                                  row.brand_delisted_on,
                                )}
                                onClick={() => void onConfirmReport(report, row)}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="wis-btn"
                                disabled={busy != null}
                                onClick={() =>
                                  setModal({
                                    kind: 'add',
                                    prefill: {
                                      retailer_id: report.retailer_id,
                                      scope_level: report.scope_level,
                                      geo_region_id: report.geo_region_id,
                                      sku_variant_id: report.sku_variant_id,
                                      reportId: report.report_id,
                                    },
                                  })
                                }
                              >
                                Correct
                              </button>
                              <button
                                type="button"
                                className="wis-btn"
                                disabled={busy != null}
                                onClick={() =>
                                  setModal({ kind: 'dispute', reportId: report.report_id })
                                }
                              >
                                Dispute
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      )}

      {modal?.kind === 'add' ? (
        <AddPlaceModal
          productId={productId}
          multiVariant={multiVariant}
          skus={skus}
          prefill={modal.prefill}
          rows={rows}
          busy={busy != null}
          onClose={() => setModal(null)}
          onSubmit={(pending) => {
            if (pending.scopeLevel === 'national') {
              setModal({ kind: 'nationwide-confirm', pending })
              return
            }
            void runDeclare(pending)
          }}
        />
      ) : null}

      {modal?.kind === 'nationwide-confirm' ? (
        <NationwideConfirmModal
          pending={modal.pending}
          busy={busy != null}
          onCancel={() => setModal({ kind: 'add', prefill: undefined })}
          onConfirm={() => void runDeclare(modal.pending)}
        />
      ) : null}

      {modal?.kind === 'delist' ? (
        <DelistModal
          coveredByNational={modal.coveredByNational}
          busy={busy != null}
          onClose={() => setModal(null)}
          onSubmit={async (date) => {
            setBusy(`delist-${modal.declarationId}`)
            setError(null)
            const supabase = createClient()
            const res = await delistDeclaration(supabase, modal.declarationId, date)
            setBusy(null)
            if (res.error) {
              setError(res.error)
              return
            }
            await afterWrite(`Marked delisted as of ${formatCalendarDate(date)}.`)
          }}
        />
      ) : null}

      {modal?.kind === 'dispute' ? (
        <DisputeModal
          busy={busy != null}
          onClose={() => setModal(null)}
          onSubmit={async (note) => {
            setBusy(`dispute-${modal.reportId}`)
            setError(null)
            const supabase = createClient()
            const res = await reviewReport(supabase, {
              reportId: modal.reportId,
              action: 'dispute',
              note,
            })
            setBusy(null)
            if (res.error) {
              setError(res.error)
              return
            }
            await afterWrite('Disputed — escalated to Dough. The shopper report stays visible.')
          }}
        />
      ) : null}
    </div>
  )
}

function AddPlaceModal({
  multiVariant,
  skus,
  prefill,
  rows,
  busy,
  onClose,
  onSubmit,
}: {
  productId: number
  multiVariant: boolean
  skus: SkuOption[]
  prefill?: Partial<DistributionCoord> & { reportId?: number; note?: string }
  rows: DistributionRow[]
  busy: boolean
  onClose: () => void
  onSubmit: (pending: PendingDeclare) => void
}) {
  const [retailers, setRetailers] = useState<RetailerOption[]>([])
  const [regions, setRegions] = useState<RegionOption[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retailerId, setRetailerId] = useState<number | null>(prefill?.retailer_id ?? null)
  const [scope, setScope] = useState<'national' | 'region'>(
    prefill?.scope_level === 'national' ? 'national' : 'region',
  )
  const [geoRegionId, setGeoRegionId] = useState<number | null>(prefill?.geo_region_id ?? null)
  const [variantChoice, setVariantChoice] = useState<string>(
    prefill?.sku_variant_id != null
      ? String(prefill.sku_variant_id)
      : multiVariant
        ? ''
        : 'all',
  )
  const [correctNote, setCorrectNote] = useState('')
  const isCorrect = prefill?.reportId != null

  useEffect(() => {
    void (async () => {
      const supabase = createClient()
      const res = await fetchShoppableRetailers(supabase)
      if (res.error) setLoadError(res.error)
      else setRetailers(res.retailers)
    })()
  }, [])

  useEffect(() => {
    if (retailerId == null) {
      setRegions([])
      return
    }
    void (async () => {
      const supabase = createClient()
      const res = await fetchRetailerRegions(supabase, retailerId)
      if (res.error) setLoadError(res.error)
      else setRegions(res.regions)
    })()
  }, [retailerId])

  const retailerOptions = retailers.map((r) => ({
    id: String(r.id),
    label: r.name,
  }))
  const regionOptions = regions.map((r) => ({
    id: String(r.geo_region_id),
    label:
      r.region_type === 'state'
        ? `${r.region_name}${r.region_code ? ` (${r.region_code})` : ''}`
        : r.region_name,
  }))

  const coveredWarning = useMemo(() => {
    if (retailerId == null || scope !== 'region' || geoRegionId == null) return null
    const skuId =
      variantChoice === 'all' || variantChoice === ''
        ? null
        : Number(variantChoice)
    const hit = rows.find(
      (r) =>
        r.retailer_id === retailerId &&
        r.scope_level === 'national' &&
        r.brand_status === 'active' &&
        r.sku_variant_id === skuId,
    )
    if (hit) {
      return `This banner already has a nationwide claim${hit.variant_label ? ` for ${hit.variant_label}` : ''}. A regional claim is still allowed, but shoppers may already see it nationwide.`
    }
    const covered = rows.find(
      (r) =>
        r.retailer_id === retailerId &&
        r.geo_region_id === geoRegionId &&
        r.covered_by_national &&
        r.sku_variant_id === skuId,
    )
    if (covered) {
      return 'This region is already covered by a nationwide claim at this banner.'
    }
    return null
  }, [retailerId, scope, geoRegionId, variantChoice, rows])

  function submit() {
    if (retailerId == null) {
      setLoadError('Pick a retailer.')
      return
    }
    if (scope === 'region' && geoRegionId == null) {
      setLoadError('Pick a state or metro.')
      return
    }
    if (multiVariant && variantChoice === '') {
      setLoadError('Choose which pack sizes this applies to.')
      return
    }
    if (isCorrect && !correctNote.trim()) {
      setLoadError('Add a short note explaining the correction.')
      return
    }
    const skuVariantId =
      !multiVariant || variantChoice === 'all' ? null : Number(variantChoice)
    onSubmit({
      retailerId,
      scopeLevel: scope,
      geoRegionId: scope === 'region' ? geoRegionId : null,
      skuVariantId,
      afterCorrectReportId: prefill?.reportId,
      afterCorrectNote: isCorrect ? correctNote.trim() : undefined,
    })
  }

  return (
    <div className="wis-modal-backdrop" role="dialog" aria-modal="true">
      <div className="wis-modal">
        <h3>{isCorrect ? 'Correct this place' : 'Add a place'}</h3>
        <p className="wis-modal-sub">
          {isCorrect
            ? 'Declare the right distribution first. We only mark the shopper report as corrected after that succeeds.'
            : 'Tell us where this product is authorised to be carried.'}
        </p>
        {loadError ? <div className="wis-error">{loadError}</div> : null}

        <div className="wis-field">
          <label>Retailer</label>
          <SearchCombobox
            options={retailerOptions}
            valueId={retailerId == null ? null : String(retailerId)}
            placeholder="Search banners…"
            disabled={busy}
            onChange={(id) => {
              setRetailerId(id == null ? null : Number(id))
              setGeoRegionId(null)
            }}
          />
        </div>

        <div className="wis-field">
          <label>Scope</label>
          <div className="wis-radios">
            <label>
              <input
                type="radio"
                name="wis-scope"
                checked={scope === 'region'}
                onChange={() => setScope('region')}
                disabled={busy}
              />
              Specific state or metro
            </label>
            <label>
              <input
                type="radio"
                name="wis-scope"
                checked={scope === 'national'}
                onChange={() => setScope('national')}
                disabled={busy}
              />
              Nationwide at this retailer
            </label>
          </div>
        </div>

        {scope === 'region' ? (
          <div className="wis-field">
            <label>Region</label>
            <SearchCombobox
              options={regionOptions}
              valueId={geoRegionId == null ? null : String(geoRegionId)}
              placeholder={retailerId == null ? 'Pick a retailer first' : 'Search states & metros…'}
              disabled={busy || retailerId == null}
              onChange={(id) => setGeoRegionId(id == null ? null : Number(id))}
            />
          </div>
        ) : null}

        {multiVariant ? (
          <div className="wis-field">
            <label>Which variants</label>
            <select
              value={variantChoice}
              disabled={busy}
              onChange={(e) => setVariantChoice(e.target.value)}
            >
              <option value="">Select…</option>
              <option value="all">All pack sizes</option>
              {skus.map((s) => (
                <option key={s.sku_variant_id} value={String(s.sku_variant_id)}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {isCorrect ? (
          <div className="wis-field">
            <label>Why is this a correction?</label>
            <textarea
              value={correctNote}
              disabled={busy}
              onChange={(e) => setCorrectNote(e.target.value)}
              placeholder="Required — what should have been reported?"
            />
          </div>
        ) : null}

        {coveredWarning ? <p className="wis-warn">{coveredWarning}</p> : null}

        <div className="wis-modal-actions">
          <button type="button" className="wis-btn wis-btn--quiet" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="wis-btn wis-btn--primary"
            onClick={submit}
            disabled={busy}
          >
            {isCorrect ? 'Save correction' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

function NationwideConfirmModal({
  pending,
  busy,
  onCancel,
  onConfirm,
}: {
  pending: PendingDeclare
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="wis-modal-backdrop" role="dialog" aria-modal="true">
      <div className="wis-modal">
        <h3>Confirm nationwide</h3>
        <p className="wis-modal-sub">
          Shoppers anywhere will see this as carried at this retailer
          {pending.skuVariantId == null ? ' for all pack sizes' : ''}. One misclick is a national
          claim.
        </p>
        <div className="wis-modal-actions">
          <button type="button" className="wis-btn wis-btn--quiet" onClick={onCancel} disabled={busy}>
            Back
          </button>
          <button
            type="button"
            className="wis-btn wis-btn--primary"
            onClick={onConfirm}
            disabled={busy}
          >
            Confirm nationwide
          </button>
        </div>
      </div>
    </div>
  )
}

function DelistModal({
  coveredByNational,
  busy,
  onClose,
  onSubmit,
}: {
  coveredByNational: boolean
  busy: boolean
  onClose: () => void
  onSubmit: (date: string) => void
}) {
  const [date, setDate] = useState(todayIsoDate())
  return (
    <div className="wis-modal-backdrop" role="dialog" aria-modal="true">
      <div className="wis-modal">
        <h3>Mark delisted</h3>
        <p className="wis-modal-sub">
          Delisting means you were carried here and no longer are, as of this date — not that the
          earlier claim was a mistake.
        </p>
        {coveredByNational ? (
          <p className="wis-warn">
            A nationwide claim still covers this banner. Shoppers outside this region may still see
            it.
          </p>
        ) : null}
        <div className="wis-field">
          <label>As of when</label>
          <input
            type="date"
            value={date}
            max={todayIsoDate()}
            disabled={busy}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="wis-modal-actions">
          <button type="button" className="wis-btn wis-btn--quiet" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="wis-btn wis-btn--danger"
            disabled={busy || !date}
            onClick={() => onSubmit(date)}
          >
            Mark delisted
          </button>
        </div>
      </div>
    </div>
  )
}

function DisputeModal({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean
  onClose: () => void
  onSubmit: (note: string) => void
}) {
  const [note, setNote] = useState('')
  return (
    <div className="wis-modal-backdrop" role="dialog" aria-modal="true">
      <div className="wis-modal">
        <h3>Dispute this report</h3>
        <p className="wis-modal-sub">
          The shopper report stays on file and visible. Nothing is deleted — Dough will review.
        </p>
        <div className="wis-field">
          <label>Why are you disputing?</label>
          <textarea
            value={note}
            disabled={busy}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Required"
          />
        </div>
        <div className="wis-modal-actions">
          <button type="button" className="wis-btn wis-btn--quiet" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="wis-btn wis-btn--primary"
            disabled={busy || !note.trim()}
            onClick={() => onSubmit(note.trim())}
          >
            Dispute
          </button>
        </div>
      </div>
    </div>
  )
}
