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
  reviewCoordinate,
  withdrawDeclaration,
  type Capability,
  type RegionOption,
  type RetailerOption,
} from '@/lib/distribution/api'
import {
  actionsForState,
  claimLabel,
  claimLabelLong,
  confirmLabel,
  formatCalendarDate,
  formatRelativeTimestamp,
  shopperDatesLine,
  shopperLine,
  shortVariantLabel,
} from '@/lib/distribution/actions'
import {
  coordFromRow,
  parseCoord,
  serializeCoord,
  type DistributionCoord,
} from '@/lib/distribution/coords'
import {
  claimableSeedRows,
  filterRowsByBannerQuery,
  hasSiblingDoughSeed,
  packConflict,
  partitionDistribution,
  reportsForCoord,
  seedPeekNames,
  shouldShowBannerFilter,
  type AvailabilityReport,
  type DistributionRow,
  type DistributionSection,
} from '@/lib/distribution/grouping'
import './whereItsSold.css'

const SEARCH_THRESHOLD = 8

type SkuOption = {
  sku_variant_id: number
  label: string
}

type Props = {
  productId: number
  productTitle?: string | null
  canEdit: boolean
  skus: SkuOption[]
}

type ModalKind =
  | null
  | {
      kind: 'add'
      prefill?: Partial<DistributionCoord> & {
        afterCorrect?: boolean
        note?: string
      }
    }
  | { kind: 'delist'; declarationId: number; coveredByNational: boolean }
  | { kind: 'dispute'; coord: DistributionCoord; retailerName: string; scopeLabel: string }
  | { kind: 'nationwide-confirm'; pending: PendingDeclare; returnToAdd?: boolean }
  | { kind: 'claim-all'; seeds: DistributionRow[] }

type PendingDeclare = {
  retailerId: number
  scopeLevel: 'national' | 'region'
  geoRegionId: number | null
  skuVariantId: number | null
  notes?: string | null
  afterCorrectCoord?: DistributionCoord
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

function EvidenceStack({
  row,
  reportDates,
  weakCorroboration,
}: {
  row: DistributionRow
  reportDates: string[]
  weakCorroboration: boolean
}) {
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
    const dates = shopperDatesLine(reportDates)
    items.push({
      key: 'shoppers',
      className: `wis-ev--shoppers${row.shopper_signal_stale ? ' wis-ev--stale' : ''}${
        weakCorroboration ? ' wis-ev--weak' : ''
      }`,
      node: (
        <>
          {shopperLine(row.shopper_reports, row.last_reported_on)}
          {dates ? (
            <>
              <br />
              <span className="wis-ev-dates">{dates}</span>
            </>
          ) : null}
          {weakCorroboration ? (
            <>
              <br />
              <span className="wis-ev-hint">Dough also found this banner — thin shopper signal</span>
            </>
          ) : null}
        </>
      ),
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

function CoordCard({
  row,
  allRows,
  reports,
  productTitle,
  canEdit,
  busy,
  focused,
  compact,
  onConfirm,
  onCorrect,
  onDispute,
  onClaim,
  onRedeclare,
  onWithdraw,
  onDelist,
}: {
  row: DistributionRow
  allRows: DistributionRow[]
  reports: AvailabilityReport[]
  productTitle?: string | null
  canEdit: boolean
  busy: string | null
  focused: boolean
  compact?: boolean
  onConfirm: (row: DistributionRow, pending: AvailabilityReport[]) => void
  onCorrect: (row: DistributionRow) => void
  onDispute: (row: DistributionRow) => void
  onClaim: (row: DistributionRow) => void
  onRedeclare: (row: DistributionRow) => void
  onWithdraw: (row: DistributionRow) => void
  onDelist: (row: DistributionRow) => void
}) {
  const coord = coordFromRow(row)
  const key = serializeCoord(coord)
  const pending = reportsForCoord(reports, row)
  const actions = actionsForState(row.brand_status, row.awaiting_review)
  const conflicts = packConflict(pending)
  const contradicts = pending.some((r) => r.contradicts_delisting)
  const weak =
    row.awaiting_review > 0 &&
    row.shopper_reports <= 1 &&
    (row.dough_seeded || hasSiblingDoughSeed(allRows, row))
  const variantShort = shortVariantLabel(row.variant_label, productTitle)
  // Seed rows assert "all packs" by default — repeating it 19× is noise.
  // Only show a pack label when it's a real / missing-data signal.
  const isDefaultAllPacks =
    variantShort === 'All pack sizes' && row.sku_variant_id == null
  const showVariant = !isDefaultAllPacks

  return (
    <div
      id={`coord-${key}`}
      className={`wis-coord${focused ? ' wis-coord--flash' : ''}${compact ? ' wis-coord--compact' : ''}`}
    >
      <div className="wis-coord-top">
        <span className="wis-banner-inline">
          {row.retailer_name}
          {row.parent_name ? (
            <span className="wis-group-parent"> · {row.parent_name}</span>
          ) : null}
        </span>
        <span className="wis-chip wis-chip--scope">{row.scope_label}</span>
        {showVariant ? (
          <span className="wis-variant" title={row.variant_label}>
            {variantShort}
          </span>
        ) : null}
      </div>

      <EvidenceStack
        row={row}
        reportDates={pending.map((r) => r.report_date)}
        weakCorroboration={weak}
      />

      {row.covered_by_national ? (
        <p className="wis-warn">
          Covered by a nationwide claim at this banner
          {variantShort ? ` for ${variantShort}` : ''}.
        </p>
      ) : null}

      {contradicts && row.brand_delisted_on ? (
        <p className="wis-warn">
          You marked this delisted on {formatCalendarDate(row.brand_delisted_on)}. Confirming will
          list it as carried again.
        </p>
      ) : contradicts ? (
        <p className="wis-warn">
          Confirming will list it as carried again (contradicts your delisting).
        </p>
      ) : null}

      {conflicts ? (
        <p className="wis-warn">
          Pending sightings name different pack sizes. Correct or Dispute each path — Confirm is
          blocked until they agree.
        </p>
      ) : null}

      {canEdit ? (
        <div className="wis-actions">
          {actions.includes('confirm') ? (
            <button
              type="button"
              className="wis-btn wis-btn--primary"
              disabled={busy != null || conflicts}
              title={confirmLabel(contradicts, row.brand_delisted_on)}
              onClick={() => onConfirm(row, pending)}
            >
              Confirm
            </button>
          ) : null}
          {actions.includes('correct') ? (
            <button
              type="button"
              className="wis-btn"
              disabled={busy != null}
              onClick={() => onCorrect(row)}
            >
              Correct
            </button>
          ) : null}
          {actions.includes('dispute') ? (
            <button
              type="button"
              className="wis-btn"
              disabled={busy != null}
              onClick={() => onDispute(row)}
            >
              Dispute
            </button>
          ) : null}
          {actions.includes('claim') ? (
            <button
              type="button"
              className="wis-btn"
              disabled={busy != null}
              title={claimLabelLong()}
              onClick={() => onClaim(row)}
            >
              {claimLabel()}
            </button>
          ) : null}
          {actions.includes('redeclare') ? (
            <button
              type="button"
              className="wis-btn"
              disabled={busy != null}
              onClick={() => onRedeclare(row)}
            >
              Re-declare
            </button>
          ) : null}
          {actions.includes('withdraw') && row.declaration_id != null ? (
            <button
              type="button"
              className="wis-btn wis-btn--quiet"
              disabled={busy != null}
              onClick={() => onWithdraw(row)}
            >
              Withdraw
            </button>
          ) : null}
          {actions.includes('delist') && row.declaration_id != null ? (
            <button
              type="button"
              className="wis-btn wis-btn--danger"
              disabled={busy != null}
              onClick={() => onDelist(row)}
            >
              Mark delisted
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function WhereItsSoldSection({
  productId,
  productTitle,
  canEdit,
  skus,
}: Props) {
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
  const [bannerQuery, setBannerQuery] = useState('')
  const [seedsOpen, setSeedsOpen] = useState(false)

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
    const inSeeds = rows.some(
      (r) =>
        serializeCoord(coordFromRow(r)) === serializeCoord(focusCoord) &&
        !r.needs_attention &&
        r.brand_status == null,
    )
    if (inSeeds) setSeedsOpen(true)
    const t = window.setTimeout(() => {
      const el = document.getElementById(`coord-${serializeCoord(focusCoord)}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    return () => window.clearTimeout(t)
  }, [focusCoord, loading, rows])

  const filteredRows = useMemo(
    () => filterRowsByBannerQuery(rows, bannerQuery),
    [rows, bannerQuery],
  )
  const sections = useMemo(() => partitionDistribution(filteredRows), [filteredRows])
  const seedSection = sections.find((s) => s.id === 'dough_seeds')
  const claimable = useMemo(
    () => claimableSeedRows(seedSection?.rows ?? []),
    [seedSection],
  )
  const seedPeek = useMemo(() => seedPeekNames(seedSection?.rows ?? []), [seedSection])
  const showFilter = shouldShowBannerFilter(rows.length)
  const needsCount = sections.find((s) => s.id === 'needs_review')?.rows.length ?? 0

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
    if (pending.afterCorrectCoord) {
      const note = (pending.afterCorrectNote ?? '').trim()
      if (!note) {
        setError('Add a short note explaining the correction.')
        setBusy(null)
        return
      }
      const c = pending.afterCorrectCoord
      const rev = await reviewCoordinate(supabase, {
        productId,
        retailerId: c.retailer_id,
        scopeLevel: c.scope_level,
        action: 'correct',
        geoRegionId: c.geo_region_id,
        retailLocationId: c.retail_location_id,
        skuVariantId: c.sku_variant_id,
        note,
      })
      if (rev.error) {
        setError(rev.error)
        setBusy(null)
        return
      }
    }
    setBusy(null)
    await afterWrite(
      pending.afterCorrectCoord
        ? 'Correction saved — original sightings stay on file as contested.'
        : 'You updated distribution just now.',
    )
  }

  async function onConfirmCoord(row: DistributionRow, pending: AvailabilityReport[]) {
    if (packConflict(pending)) return
    setBusy(`confirm-${serializeCoord(coordFromRow(row))}`)
    setError(null)
    const supabase = createClient()
    const res = await reviewCoordinate(supabase, {
      productId,
      retailerId: row.retailer_id,
      scopeLevel: row.scope_level,
      action: 'confirm',
      geoRegionId: row.geo_region_id,
      retailLocationId: row.retail_location_id,
      skuVariantId: row.sku_variant_id,
    })
    setBusy(null)
    if (res.error) {
      setError(res.error)
      return
    }
    const n = res.result?.reportsAffected ?? pending.length
    await afterWrite(
      n === 1
        ? `Confirmed — added ${row.retailer_name} · ${row.scope_label} to your distribution.`
        : `Confirmed ${n} shopper reports — added ${row.retailer_name} · ${row.scope_label}.`,
    )
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
    if (row.scope_level === 'national') {
      setModal({
        kind: 'nationwide-confirm',
        returnToAdd: false,
        pending: {
          retailerId: row.retailer_id,
          scopeLevel: 'national',
          geoRegionId: null,
          skuVariantId: row.sku_variant_id,
        },
      })
      return
    }
    setBusy(`claim-${serializeCoord(coordFromRow(row))}`)
    await runDeclare({
      retailerId: row.retailer_id,
      scopeLevel: 'region',
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

  async function onClaimAll(seeds: DistributionRow[]) {
    setBusy('claim-all')
    setError(null)
    const supabase = createClient()
    let ok = 0
    const failures: string[] = []
    for (const row of seeds) {
      const res = await declareAvailability(supabase, {
        productId,
        retailerId: row.retailer_id,
        scopeLevel: row.scope_level === 'national' ? 'national' : 'region',
        geoRegionId: row.geo_region_id,
        skuVariantId: row.sku_variant_id,
      })
      if (res.error) {
        failures.push(`${row.retailer_name}: ${res.error}`)
      } else {
        ok += 1
      }
    }
    setBusy(null)
    setModal(null)
    if (failures.length === 0) {
      await afterWrite(`Claimed ${ok} place${ok === 1 ? '' : 's'} — added to your distribution.`)
      return
    }
    setToast(`Claimed ${ok} of ${seeds.length}. ${failures.length} failed.`)
    setError(failures.slice(0, 3).join(' · '))
    await load()
  }

  const allowed = capability?.allowed === true
  const refused = capability != null && !capability.allowed

  const cardHandlers = {
    onConfirm: onConfirmCoord,
    onCorrect: (row: DistributionRow) =>
      setModal({
        kind: 'add',
        prefill: {
          retailer_id: row.retailer_id,
          scope_level: row.scope_level,
          geo_region_id: row.geo_region_id,
          retail_location_id: row.retail_location_id,
          sku_variant_id: row.sku_variant_id,
          afterCorrect: true,
        },
      }),
    onDispute: (row: DistributionRow) =>
      setModal({
        kind: 'dispute',
        coord: coordFromRow(row),
        retailerName: row.retailer_name,
        scopeLabel: row.scope_label,
      }),
    onClaim,
    onRedeclare,
    onWithdraw,
    onDelist: (row: DistributionRow) => {
      if (row.declaration_id == null) return
      setModal({
        kind: 'delist',
        declarationId: row.declaration_id,
        coveredByNational: row.covered_by_national,
      })
    },
  }

  return (
    <div className="pm-overview-card pm-overview-compete wis-section" id="where-its-sold">
      <div className="wis-header">
        <div>
          <h2 className="pm-overview-heading" style={{ marginBottom: 4 }}>
            Where it&apos;s sold
            {!loading && !refused && needsCount > 0 ? (
              <span className="wis-heading-count"> · {needsCount} need review</span>
            ) : null}
          </h2>
          {!refused ? (
            <>
              <p className="wis-lede">
                Authorised to be carried — not whether it is on the shelf right now.
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
        <>
          {showFilter ? (
            <div className="wis-filter">
              <input
                type="search"
                placeholder="Filter by banner or region…"
                value={bannerQuery}
                onChange={(e) => setBannerQuery(e.target.value)}
                aria-label="Filter distribution by banner"
              />
            </div>
          ) : null}

          <div className="wis-sections">
            {sections.map((section) => {
              if (section.rows.length === 0) return null
              if (section.id === 'dough_seeds') {
                return (
                  <SeedSection
                    key={section.id}
                    section={section}
                    peek={seedPeek}
                    open={seedsOpen}
                    onToggle={() => setSeedsOpen((v) => !v)}
                    claimable={claimable}
                    canEdit={canEdit}
                    busy={busy}
                    allRows={rows}
                    reports={reports}
                    productTitle={productTitle}
                    focusCoord={focusCoord}
                    onClaimAll={() => setModal({ kind: 'claim-all', seeds: claimable })}
                    {...cardHandlers}
                  />
                )
              }
              return (
                <section
                  key={section.id}
                  className={`wis-bucket wis-bucket--${section.id}`}
                  aria-labelledby={`wis-${section.id}`}
                >
                  <div className="wis-bucket-head">
                    <h3 id={`wis-${section.id}`} className="wis-bucket-title">
                      {section.title}
                      <span className="wis-bucket-count">{section.rows.length}</span>
                    </h3>
                  </div>
                  <div className="wis-bucket-body">
                    {section.rows.map((row) => {
                      const key = serializeCoord(coordFromRow(row))
                      const focused =
                        focusCoord != null && serializeCoord(focusCoord) === key
                      return (
                        <CoordCard
                          key={key}
                          row={row}
                          allRows={rows}
                          reports={reports}
                          productTitle={productTitle}
                          canEdit={canEdit}
                          busy={busy}
                          focused={focused}
                          {...cardHandlers}
                        />
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </>
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
              setModal({ kind: 'nationwide-confirm', pending, returnToAdd: true })
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
          onCancel={() =>
            setModal(modal.returnToAdd ? { kind: 'add', prefill: undefined } : null)
          }
          onConfirm={() => void runDeclare(modal.pending)}
        />
      ) : null}

      {modal?.kind === 'claim-all' ? (
        <ClaimAllModal
          seeds={modal.seeds}
          busy={busy != null}
          onClose={() => setModal(null)}
          onConfirm={() => void onClaimAll(modal.seeds)}
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
          place={`${modal.retailerName} · ${modal.scopeLabel}`}
          busy={busy != null}
          onClose={() => setModal(null)}
          onSubmit={async (note) => {
            setBusy(`dispute-${serializeCoord(modal.coord)}`)
            setError(null)
            const supabase = createClient()
            const c = modal.coord
            const res = await reviewCoordinate(supabase, {
              productId,
              retailerId: c.retailer_id,
              scopeLevel: c.scope_level,
              action: 'dispute',
              geoRegionId: c.geo_region_id,
              retailLocationId: c.retail_location_id,
              skuVariantId: c.sku_variant_id,
              note,
            })
            setBusy(null)
            if (res.error) {
              setError(res.error)
              return
            }
            const n = res.result?.reportsAffected ?? 0
            await afterWrite(
              n > 1
                ? `Disputed ${n} reports — escalated to Dough. Sightings stay visible.`
                : 'Disputed — escalated to Dough. The shopper report stays visible.',
            )
          }}
        />
      ) : null}
    </div>
  )
}

function SeedSection({
  section,
  peek,
  open,
  onToggle,
  claimable,
  canEdit,
  busy,
  allRows,
  reports,
  productTitle,
  focusCoord,
  onClaimAll,
  ...handlers
}: {
  section: DistributionSection
  peek: { names: string[]; remaining: number }
  open: boolean
  onToggle: () => void
  claimable: DistributionRow[]
  canEdit: boolean
  busy: string | null
  allRows: DistributionRow[]
  reports: AvailabilityReport[]
  productTitle?: string | null
  focusCoord: DistributionCoord | null
  onClaimAll: () => void
  onConfirm: (row: DistributionRow, pending: AvailabilityReport[]) => void
  onCorrect: (row: DistributionRow) => void
  onDispute: (row: DistributionRow) => void
  onClaim: (row: DistributionRow) => void
  onRedeclare: (row: DistributionRow) => void
  onWithdraw: (row: DistributionRow) => void
  onDelist: (row: DistributionRow) => void
}) {
  const n = section.rows.length
  const peekText =
    peek.names.length === 0
      ? null
      : peek.remaining > 0
        ? `${peek.names.join(', ')} and ${peek.remaining} more`
        : peek.names.join(', ')

  return (
    <section
      className={`wis-bucket wis-bucket--dough_seeds${open ? ' is-open' : ''}`}
      aria-labelledby="wis-dough_seeds"
    >
      <div className="wis-seed-header">
        <button
          type="button"
          className="wis-seed-expand"
          id="wis-dough_seeds"
          aria-expanded={open}
          onClick={onToggle}
        >
          <span className="wis-seed-chevron" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d={open ? 'M4.5 7.5L9 12L13.5 7.5' : 'M7.5 4.5L12 9L7.5 13.5'}
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="wis-seed-expand__copy">
            <span className="wis-bucket-title">
              Dough found this at {n} more retailer{n === 1 ? '' : 's'}
            </span>
            {!open && peekText ? (
              <span className="wis-seed-peek">{peekText}</span>
            ) : null}
            <span className="wis-seed-expand__hint">
              {open ? 'Hide list' : 'Review each retailer'}
            </span>
          </span>
        </button>
        {canEdit && claimable.length > 0 ? (
          <button
            type="button"
            className="wis-btn wis-btn--quiet wis-claim-all"
            disabled={busy != null}
            onClick={onClaimAll}
          >
            Claim all ({claimable.length})
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="wis-bucket-body">
          {section.rows.map((row) => {
            const key = serializeCoord(coordFromRow(row))
            const focused = focusCoord != null && serializeCoord(focusCoord) === key
            return (
              <CoordCard
                key={key}
                row={row}
                allRows={allRows}
                reports={reports}
                productTitle={productTitle}
                canEdit={canEdit}
                busy={busy}
                focused={focused}
                compact
                {...handlers}
              />
            )
          })}
        </div>
      ) : null}
    </section>
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
  prefill?: Partial<DistributionCoord> & { afterCorrect?: boolean; note?: string }
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
  const isCorrect = Boolean(prefill?.afterCorrect)

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
      variantChoice === 'all' || variantChoice === '' ? null : Number(variantChoice)
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
      afterCorrectCoord: isCorrect
        ? {
            retailer_id: prefill!.retailer_id!,
            scope_level: prefill!.scope_level!,
            geo_region_id: prefill!.geo_region_id ?? null,
            retail_location_id: prefill!.retail_location_id ?? null,
            sku_variant_id: prefill!.sku_variant_id ?? null,
          }
        : undefined,
      afterCorrectNote: isCorrect ? correctNote.trim() : undefined,
    })
  }

  return (
    <div className="wis-modal-backdrop" role="dialog" aria-modal="true">
      <div className="wis-modal">
        <h3>{isCorrect ? 'Correct this place' : 'Add a place'}</h3>
        <p className="wis-modal-sub">
          {isCorrect
            ? 'Declare the right distribution first. We only mark the shopper reports as corrected after that succeeds.'
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

function ClaimAllModal({
  seeds,
  busy,
  onClose,
  onConfirm,
}: {
  seeds: DistributionRow[]
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const national = seeds.filter((s) => s.scope_level === 'national').length
  const peek = seedPeekNames(seeds, 5)
  return (
    <div className="wis-modal-backdrop" role="dialog" aria-modal="true">
      <div className="wis-modal">
        <h3>Claim all {seeds.length} places?</h3>
        <p className="wis-modal-sub">
          {peek.names.join(', ')}
          {peek.remaining > 0 ? ` and ${peek.remaining} more` : ''}.
          {national > 0
            ? ` ${national} of these are nationwide — shoppers anywhere will see those banners.`
            : ''}
        </p>
        <div className="wis-modal-actions">
          <button type="button" className="wis-btn wis-btn--quiet" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="wis-btn wis-btn--primary"
            onClick={onConfirm}
            disabled={busy}
          >
            Claim all
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
  place,
  busy,
  onClose,
  onSubmit,
}: {
  place: string
  busy: boolean
  onClose: () => void
  onSubmit: (note: string) => void
}) {
  const [note, setNote] = useState('')
  return (
    <div className="wis-modal-backdrop" role="dialog" aria-modal="true">
      <div className="wis-modal">
        <h3>Dispute {place}</h3>
        <p className="wis-modal-sub">
          Every pending shopper report at this place stays on file and visible. Nothing is deleted
          — Dough will review.
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
