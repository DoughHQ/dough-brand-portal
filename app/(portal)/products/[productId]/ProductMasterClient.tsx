'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { PortalUser } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import { callWriteRpc, fetchProductMaster } from '@/lib/productMaster/fetch'
import { getHint, humanizeRpcError, type RpcErrorLike } from '@/lib/productMaster/errors'
import type { MasterSku, OpenCorrection, ProductMaster, RecentChange } from '@/lib/productMaster/types'
import { EvidenceRungChip } from '@/components/productMaster/EvidenceRungChip'
import { ComingSoonStub, SupportLink } from '@/components/productMaster/ComingSoonStub'
import {
  bodyText,
  button,
  caption,
  chip,
  consumerQuestion,
  fieldEmpty,
  fieldLabel,
  fieldValue,
  inputStyle as masterInput,
  metricCard,
  metricNumber,
  pageShell,
  panel,
  panelPending,
  productName as productNameStyle,
  sectionHeading,
} from '@/lib/productMaster/styles'
import ProductDetailTabBar from './tabs/ProductDetailTabBar'
import ProductSkuSwitcher from './tabs/ProductSkuSwitcher'
import {
  ProductActivityTab,
  ProductImagesTab,
  ProductIntelligenceTab,
  ProductNutritionTab,
  ProductOverviewTab,
  ProductPackagesTab,
  ProductPricingTab,
  ProductProofTab,
  ProductStudiesTab,
} from './tabs/ProductDetailTabPanels'
import {
  parseProductDetailTab,
  parseSelectedSkuId,
  type ProductDetailTab,
} from './tabs/productDetailTabs'
import { splitCategoryPath } from './tabs/overviewPresentation'
import {
  activeDietaryFlags,
  dietaryContainsItems,
  extendedNutrientRows,
  MACRO_ROWS,
  MICRO_ROWS,
  nutritionSummary,
  presentRows,
  servingRow,
  skuHasIngredientStatement,
  skuHasNutritionFacts,
  splitIngredientStatement,
  displayAllCapsPhrase,
} from './tabs/compositionPresentation'
import {
  buildHeadToHeadJobs,
  intelligenceVolumeStats,
  jobStatusCopy,
  pickHeadlineStanding,
  raterFloorCopy,
} from './tabs/intelligencePresentation'
import type { ProductStudyCard } from '@/lib/productMaster/productHeroStudies'

type Props = {
  portalUser: PortalUser
  effectiveBrandId: number
  initial: ProductMaster
  studies: ProductStudyCard[]
  isImpersonating?: boolean
}

const UNMAPPED_NUTRIENT = /^nutrient_\d+$/

const HEADLINE_NUTRIENTS: { key: string; label: string; suffix?: string }[] = [
  { key: 'serving_size', label: 'Serving' },
  { key: 'calories', label: 'Calories' },
  { key: 'total_carbs_g', label: 'Total carbs', suffix: 'g' },
  { key: 'protein_g', label: 'Protein', suffix: 'g' },
  { key: 'total_fat_g', label: 'Total fat', suffix: 'g' },
  { key: 'sodium_mg', label: 'Sodium', suffix: 'mg' },
]

const MORE_MACROS: { key: string; label: string; suffix?: string }[] = [
  { key: 'total_sugars_g', label: 'Total sugars', suffix: 'g' },
  { key: 'added_sugars_g', label: 'Added sugars', suffix: 'g' },
  { key: 'dietary_fiber_g', label: 'Dietary fiber', suffix: 'g' },
  { key: 'saturated_fat_g', label: 'Saturated fat', suffix: 'g' },
  { key: 'trans_fat_g', label: 'Trans fat', suffix: 'g' },
  { key: 'cholesterol_mg', label: 'Cholesterol', suffix: 'mg' },
]

const CORE_MICROS: { key: string; label: string; suffix?: string }[] = [
  { key: 'vitamin_d_mcg', label: 'Vitamin D', suffix: 'mcg' },
  { key: 'calcium_mg', label: 'Calcium', suffix: 'mg' },
  { key: 'iron_mg', label: 'Iron', suffix: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', suffix: 'mg' },
  { key: 'vitamin_a_mcg', label: 'Vitamin A', suffix: 'mcg' },
  { key: 'vitamin_c_mg', label: 'Vitamin C', suffix: 'mg' },
]

const IDENTITY_LABELS: Record<string, string> = {
  product_name_display: 'Display name',
  product_name_short: 'Short name',
  product_flavor_variant: 'Flavor / variant',
  product_variety: 'Variety',
  product_description: 'Description',
}

const CORRECTION_FIELD: Record<string, string> = {
  nutrition_facts: 'nutrition',
  ingredients: 'ingredients',
  category: 'category',
  name: 'name',
  brand: 'brand',
  price: 'price',
  product_image: 'images',
  allergens: 'allergens',
  other: 'other',
}

const sectionTitle: CSSProperties = {
  ...sectionHeading,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 4,
}

const muted: CSSProperties = { ...caption }

function formatMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return `$${Number(n).toFixed(2)}`
}

/** Label data is often ALL CAPS — present as title case when the whole string is uppercase. */
function displayProductName(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const letters = trimmed.replace(/[^A-Za-z]/g, '')
  if (letters.length >= 3 && letters === letters.toUpperCase()) {
    return trimmed
      .toLowerCase()
      .replace(/(^|[\s/(&\-])([a-z])/g, (_, p1: string, p2: string) => p1 + p2.toUpperCase())
  }
  return trimmed
}

function formatJsonValue(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    const s = JSON.stringify(v)
    return s.length > 80 ? s.slice(0, 77) + '…' : s
  } catch {
    return String(v)
  }
}

function relativeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s} second${s === 1 ? '' : 's'} ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}

function coveragePct(part: number, total: number): string {
  if (!total) return '0%'
  const pct = (part / total) * 100
  if (pct === 0) return '0%'
  if (pct < 0.1) return `${pct.toFixed(2)}%`
  if (pct < 1) return `${pct.toFixed(1)}%`
  if (pct < 10) return `${pct.toFixed(1)}%`
  return `${Math.round(pct)}%`
}

function skuLabel(sku: MasterSku): string {
  const parts = [
    sku.variant_name_display,
    sku.package_size_value != null
      ? `${sku.package_size_value}${sku.package_size_uom ? ` ${sku.package_size_uom}` : ''}`
      : null,
    sku.package_type,
  ].filter(Boolean)
  return parts.join(' · ') || `SKU ${sku.sku_variant_id}`
}

function ProposalBadge({ types, match }: { types: Set<string>; match: string }) {
  if (!types.has(match)) return null
  return (
    <span
      style={{
        ...chip,
        marginLeft: 8,
        color: 'var(--amber)',
        background: 'var(--amber-soft, rgba(192,120,24,0.12))',
      }}
    >
      Pending review
    </span>
  )
}

function systemFlagTitle(c: OpenCorrection): string {
  if (c.review_reason === 'no_match_auto_classify') return "We're classifying this product"
  if (c.review_reason === 'low_confidence_auto_classify') return "We're double-checking the category"
  return 'Dough is reviewing this product'
}

function proposalHeadline(c: OpenCorrection): string {
  const summary = (c.summary ?? '').trim()
  if (summary) return summary
  const type = CORRECTION_FIELD[c.correction_type] ?? c.correction_type
  return `A ${type} change is pending review`
}

function correctionsReviewHref(opts: { productId: number; correctionId?: string }): string {
  const params = new URLSearchParams()
  params.set('product', String(opts.productId))
  if (opts.correctionId) params.set('focus', opts.correctionId)
  return `/admin/corrections?${params.toString()}`
}

function pendingPanelStyle(active: boolean): CSSProperties {
  return active ? panelPending : panel
}

type StaleState = {
  fieldName: string
  localValue: unknown
  change: RecentChange | null
  pendingPatch: Record<string, unknown>
  retry: (newRowVersion: number) => Promise<void>
}

type CompetitorHit = { product_id: number; product_name_display: string }

export default function ProductMasterClient({
  portalUser,
  effectiveBrandId,
  initial,
  studies,
  isImpersonating,
}: Props) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const [master, setMaster] = useState(initial)
  const [tab, setTab] = useState<ProductDetailTab>(() =>
    parseProductDetailTab(searchParams.get('tab'))
  )
  const [skuId, setSkuId] = useState<number | null>(() =>
    parseSelectedSkuId(
      searchParams.get('sku'),
      initial.skus.map((s) => s.sku_variant_id)
    )
  )
  const [flash, setFlash] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [stale, setStale] = useState<StaleState | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAllNutrients, setShowAllNutrients] = useState<Record<number, boolean>>({})
  const [expandedSkus, setExpandedSkus] = useState<Record<number, boolean>>({})
  const [priceSurface, setPriceSurface] = useState<unknown | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [competitorQuery, setCompetitorQuery] = useState('')
  const [competitorHits, setCompetitorHits] = useState<CompetitorHit[]>([])
  const [competitors, setCompetitors] = useState<CompetitorHit[]>([])
  const [msrpDraft, setMsrpDraft] = useState<Record<number, string>>({})
  const [editingMsrp, setEditingMsrp] = useState<number | null>(null)
  const [editingIngredients, setEditingIngredients] = useState<number | null>(null)
  const [ingredientsDraft, setIngredientsDraft] = useState('')
  const [editingNutritionKey, setEditingNutritionKey] = useState<string | null>(null)
  const [nutritionDraft, setNutritionDraft] = useState('')
  const [uploading, setUploading] = useState(false)

  const canEdit =
    portalUser.role === 'brand_admin' || portalUser.role === 'dough_admin'
  const isAdmin = portalUser.role === 'dough_admin'
  const product = master.product
  const editable = new Set(master.editable_fields ?? [])

  const skuIds = useMemo(() => master.skus.map((s) => s.sku_variant_id), [master.skus])

  useEffect(() => {
    setTab(parseProductDetailTab(searchParams.get('tab')))
    setSkuId(parseSelectedSkuId(searchParams.get('sku'), skuIds))
  }, [searchParams, skuIds])

  const writeProductParams = useCallback(
    (patch: { tab?: ProductDetailTab; skuId?: number | null }) => {
      const params = new URLSearchParams(searchParams.toString())
      const nextTab = patch.tab ?? tab
      if (nextTab === 'overview') params.delete('tab')
      else params.set('tab', nextTab)

      const nextSku = patch.skuId !== undefined ? patch.skuId : skuId
      if (nextSku != null && skuIds.length > 1 && skuIds.includes(nextSku)) {
        params.set('sku', String(nextSku))
      } else {
        params.delete('sku')
      }

      const qs = params.toString()
      const path = `/products/${product.product_id}`
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false })
    },
    [router, searchParams, tab, skuId, skuIds, product.product_id]
  )

  const selectTab = useCallback(
    (next: ProductDetailTab) => {
      setTab(next)
      writeProductParams({ tab: next })
    },
    [writeProductParams]
  )

  const selectSku = useCallback(
    (next: number) => {
      setSkuId(next)
      writeProductParams({ skuId: next })
    },
    [writeProductParams]
  )

  const systemFlags = useMemo(
    () => (master.open_corrections ?? []).filter((c) => c.kind === 'system_flag'),
    [master.open_corrections]
  )
  const proposals = useMemo(
    () => (master.open_corrections ?? []).filter((c) => c.kind !== 'system_flag'),
    [master.open_corrections]
  )
  const correctionTypes = useMemo(() => {
    const set = new Set<string>()
    for (const c of proposals) {
      set.add(CORRECTION_FIELD[c.correction_type] ?? 'other')
    }
    return set
  }, [proposals])
  /** Includes system flags (category) so the right field lights up. */
  const pendingFields = useMemo(() => {
    const set = new Set<string>()
    for (const c of master.open_corrections ?? []) {
      if (c.kind === 'system_flag') set.add('category')
      else set.add(CORRECTION_FIELD[c.correction_type] ?? 'other')
    }
    return set
  }, [master.open_corrections])
  const proposalByField = useMemo(() => {
    const map = new Map<string, OpenCorrection>()
    for (const c of proposals) {
      const key = CORRECTION_FIELD[c.correction_type] ?? 'other'
      if (!map.has(key)) map.set(key, c)
    }
    return map
  }, [proposals])

  const multiSku = master.sku_count >= 2
  const selectedSku =
    master.skus.find((s) => s.sku_variant_id === skuId) ?? master.skus[0] ?? null

  const showJobScores = master.compare_groups.results != null
  const intelJobs = useMemo(
    () => buildHeadToHeadJobs(master.compare_groups.eligible, master.compare_groups.results),
    [master.compare_groups.eligible, master.compare_groups.results]
  )
  const intelHeadline = useMemo(() => pickHeadlineStanding(intelJobs), [intelJobs])
  const intelVolume = useMemo(
    () => intelligenceVolumeStats(master.intelligence),
    [master.intelligence]
  )
  const intelFloor = raterFloorCopy(master.intelligence)

  const refetch = useCallback(async () => {
    const result = await fetchProductMaster(supabase, product.product_id)
    if (result.ok) {
      setMaster(result.data)
      return result.data
    }
    setErrorMsg(humanizeRpcError(result.error))
    return null
  }, [supabase, product.product_id])

  function handleWriteError(
    error: RpcErrorLike,
    ctx?: {
      fieldName?: string
      localValue?: unknown
      pendingPatch?: Record<string, unknown>
      retry?: (rv: number) => Promise<void>
    }
  ) {
    const hint = getHint(error)
    if (hint === 'STALE_WRITE') {
      const change =
        master.recent_changes.find((c) => c.field_name === ctx?.fieldName) ??
        master.recent_changes[0] ??
        null
      setStale({
        fieldName: ctx?.fieldName ?? change?.field_name ?? 'field',
        localValue: ctx?.localValue,
        change,
        pendingPatch: ctx?.pendingPatch ?? {},
        retry:
          ctx?.retry ??
          (async () => {
            await refetch()
          }),
      })
      void refetch()
      return
    }
    if (
      hint === 'SKU_NOT_FOUND' ||
      hint === 'NUTRITION_NOT_FOUND' ||
      hint === 'INGREDIENTS_NOT_FOUND'
    ) {
      setFlash(humanizeRpcError(error))
      void refetch()
      return
    }
    if (hint === 'FIELD_NOT_EDITABLE') {
      console.error('[product-master] FIELD_NOT_EDITABLE', error)
    }
    if (hint === 'EMPTY_PATCH') {
      console.error('[product-master] EMPTY_PATCH', error)
    }
    setErrorMsg(humanizeRpcError(error))
  }

  async function saveIdentity(field: string, value: string) {
    if (!canEdit || !editable.has(field)) return
    setSaving(true)
    setErrorMsg(null)
    const patch = { [field]: value || null }
    const result = await callWriteRpc(supabase, 'update_product_fields', {
      p_product_id: product.product_id,
      p_expected_row_version: product.row_version,
      p_patch: patch,
    })
    setSaving(false)
    if (!result.ok) {
      handleWriteError(result.error, {
        fieldName: field,
        localValue: value,
        pendingPatch: patch,
        retry: async (rv) => {
          const r = await callWriteRpc(supabase, 'update_product_fields', {
            p_product_id: product.product_id,
            p_expected_row_version: rv,
            p_patch: patch,
          })
          if (!r.ok) handleWriteError(r.error)
          else {
            setEditingField(null)
            await refetch()
          }
        },
      })
      return
    }
    setEditingField(null)
    setFlash('Saved')
    await refetch()
  }

  async function saveMsrp(sku: MasterSku, raw: string) {
    if (!canEdit) return
    const price = Number(raw)
    if (!(price > 0)) {
      setErrorMsg('Price must be greater than zero.')
      return
    }
    setSaving(true)
    setErrorMsg(null)
    const result = await callWriteRpc(supabase, 'set_brand_msrp', {
      p_sku_variant_id: sku.sku_variant_id,
      p_price: price,
      p_currency: 'USD',
    })
    setSaving(false)
    if (!result.ok) {
      handleWriteError(result.error)
      return
    }
    setEditingMsrp(null)
    setFlash('MSRP saved')
    await refetch()
  }

  async function saveIngredients(sku: MasterSku, text: string) {
    if (!canEdit || !sku.ingredients || sku.ingredients.locked) return
    setSaving(true)
    setErrorMsg(null)
    const patch = { ingredients_text_raw: text }
    const result = await callWriteRpc(supabase, 'update_sku_ingredients', {
      p_sku_variant_id: sku.sku_variant_id,
      p_expected_row_version: sku.ingredients.row_version,
      p_patch: patch,
    })
    setSaving(false)
    if (!result.ok) {
      handleWriteError(result.error, {
        fieldName: 'ingredients_text_raw',
        localValue: text,
        pendingPatch: patch,
        retry: async () => {
          const fresh = await refetch()
          const next = fresh?.skus.find((s) => s.sku_variant_id === sku.sku_variant_id)
          if (!next?.ingredients) return
          const r = await callWriteRpc(supabase, 'update_sku_ingredients', {
            p_sku_variant_id: sku.sku_variant_id,
            p_expected_row_version: next.ingredients.row_version,
            p_patch: patch,
          })
          if (!r.ok) handleWriteError(r.error)
          else {
            setEditingIngredients(null)
            await refetch()
          }
        },
      })
      return
    }
    setEditingIngredients(null)
    setFlash('Ingredients saved')
    await refetch()
  }

  async function saveNutritionField(sku: MasterSku, key: string, raw: string) {
    if (!canEdit || !sku.nutrition || sku.nutrition.locked) return
    setSaving(true)
    setErrorMsg(null)
    const num = raw.trim() === '' ? null : Number(raw)
    const patch = { [key]: num }
    const result = await callWriteRpc(supabase, 'update_sku_nutrition', {
      p_sku_variant_id: sku.sku_variant_id,
      p_expected_row_version: sku.nutrition.row_version,
      p_patch: patch,
    })
    setSaving(false)
    if (!result.ok) {
      handleWriteError(result.error, {
        fieldName: key,
        localValue: raw,
        pendingPatch: patch,
        retry: async () => {
          const fresh = await refetch()
          const next = fresh?.skus.find((s) => s.sku_variant_id === sku.sku_variant_id)
          if (!next?.nutrition) return
          const r = await callWriteRpc(supabase, 'update_sku_nutrition', {
            p_sku_variant_id: sku.sku_variant_id,
            p_expected_row_version: next.nutrition.row_version,
            p_patch: patch,
          })
          if (!r.ok) handleWriteError(r.error)
          else {
            setEditingNutritionKey(null)
            await refetch()
          }
        },
      })
      return
    }
    setEditingNutritionKey(null)
    setFlash('Nutrition saved')
    await refetch()
  }

  async function uploadImage(file: File) {
    if (!canEdit) return
    setUploading(true)
    setErrorMsg(null)
    const brandFolder = product.brand_id ?? effectiveBrandId
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${brandFolder}/${Date.now()}-${safeName}`
    const { error: upErr } = await supabase.storage.from('brand-assets').upload(path, file, {
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })
    if (upErr) {
      setUploading(false)
      setErrorMsg(upErr.message || 'Upload failed.')
      return
    }
    const result = await callWriteRpc(supabase, 'register_brand_product_image', {
      p_product_id: product.product_id,
      p_image_role: 'front',
      p_storage_path: path,
      p_sku_variant_id: null,
      p_supersede_image_id: null,
      p_make_primary: master.images.length === 0,
    })
    setUploading(false)
    if (!result.ok) {
      handleWriteError(result.error)
      return
    }
    setFlash('Image registered')
    await refetch()
  }

  async function promoteImage(imageId: number) {
    if (!canEdit) return
    const result = await callWriteRpc(supabase, 'set_primary_product_image', {
      p_product_image_id: imageId,
    })
    if (!result.ok) {
      handleWriteError(result.error)
      return
    }
    await refetch()
  }

  async function loadPriceSurface() {
    setPriceLoading(true)
    const result = await callWriteRpc(supabase, 'get_product_price_surface', {
      p_product_id: product.product_id,
    })
    setPriceLoading(false)
    if (!result.ok) {
      handleWriteError(result.error)
      return
    }
    setPriceSurface(result.data)
  }

  async function searchCompetitors(q: string) {
    setCompetitorQuery(q)
    if (q.trim().length < 2) {
      setCompetitorHits([])
      return
    }
    // Brand users: local stub list (no brand-safe product search RPC yet).
    // dough_admin: search_products_admin when available.
    if (isAdmin) {
      const { data, error } = await supabase.rpc('search_products_admin' as never, {
        p_query: q.trim(),
      } as never)
      if (!error && Array.isArray(data)) {
        setCompetitorHits(
          (data as { product_id: number; product_name_clean?: string }[])
            .slice(0, 8)
            .map((r) => ({
              product_id: r.product_id,
              product_name_display: r.product_name_clean ?? `Product ${r.product_id}`,
            }))
        )
        return
      }
    }
    setCompetitorHits(
      STUB_COMPETITORS.filter((c) =>
        c.product_name_display.toLowerCase().includes(q.toLowerCase())
      )
    )
  }

  function startEditIdentity(field: string, current: string | null) {
    if (!canEdit || !editable.has(field)) return
    setEditingField(field)
    setDraft(current ?? '')
    setErrorMsg(null)
  }

  function priorForField(field: string): RecentChange | undefined {
    return master.recent_changes.find((c) => c.field_name === field)
  }

  const cov = master.coverage
  const skuPending =
    pendingFields.has('nutrition') ||
    pendingFields.has('ingredients') ||
    pendingFields.has('price')

  const renderSkuFields = (sku: MasterSku) => (
    <SkuBlock
      sku={sku}
      hideIdentity
      canEdit={canEdit}
      correctionTypes={correctionTypes}
      multiSku={multiSku}
      showAll={!!showAllNutrients[sku.sku_variant_id]}
      onToggleAll={() =>
        setShowAllNutrients((s) => ({
          ...s,
          [sku.sku_variant_id]: !s[sku.sku_variant_id],
        }))
      }
      editingMsrp={editingMsrp === sku.sku_variant_id}
      msrpDraft={msrpDraft[sku.sku_variant_id] ?? ''}
      onStartMsrp={() => {
        setEditingMsrp(sku.sku_variant_id)
        setMsrpDraft((d) => ({
          ...d,
          [sku.sku_variant_id]: sku.msrp != null ? String(sku.msrp) : '',
        }))
      }}
      onMsrpDraft={(v) => setMsrpDraft((d) => ({ ...d, [sku.sku_variant_id]: v }))}
      onSaveMsrp={() => saveMsrp(sku, msrpDraft[sku.sku_variant_id] ?? '')}
      onCancelMsrp={() => setEditingMsrp(null)}
      editingIngredients={editingIngredients === sku.sku_variant_id}
      ingredientsDraft={ingredientsDraft}
      onStartIngredients={() => {
        setEditingIngredients(sku.sku_variant_id)
        setIngredientsDraft(sku.ingredients?.ingredients_text_raw ?? '')
      }}
      onIngredientsDraft={setIngredientsDraft}
      onSaveIngredients={() => saveIngredients(sku, ingredientsDraft)}
      onCancelIngredients={() => setEditingIngredients(null)}
      editingNutritionKey={editingNutritionKey}
      nutritionDraft={nutritionDraft}
      onStartNutrition={(key, val) => {
        setEditingNutritionKey(`${sku.sku_variant_id}:${key}`)
        setNutritionDraft(val ?? '')
      }}
      onNutritionDraft={setNutritionDraft}
      onSaveNutrition={(key) => saveNutritionField(sku, key, nutritionDraft)}
      onCancelNutrition={() => setEditingNutritionKey(null)}
      saving={saving}
    />
  )

  const ingredientSkus =
    selectedSku && skuHasIngredientStatement(selectedSku) ? [selectedSku] : []
  const nutritionSkus =
    selectedSku && skuHasNutritionFacts(selectedSku) ? [selectedSku] : []
  const showDietaryCard =
    master.dietary != null || (ingredientSkus.length === 0 && nutritionSkus.length === 0)
  const compositionSplit = ingredientSkus.length > 0 && showDietaryCard

  return (
    <div style={pageShell}>
      <Link
        href="/products"
        style={{
          display: 'inline-flex',
          fontSize: 13,
          color: 'var(--ink-50)',
          marginBottom: 20,
          textDecoration: 'none',
        }}
      >
        ← Products
      </Link>

      {isImpersonating && (
        <div
          style={{
            background: 'var(--amber-pale, #f3e6d0)',
            border: '1px solid rgba(192,120,24,0.2)',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--amber)',
          }}
        >
          Viewing as brand — this is exactly what they see.
        </div>
      )}

      {systemFlags.map((c) => (
        <div
          key={c.id}
          style={{
            marginBottom: 16,
            padding: '14px 16px',
            borderRadius: 8,
            background: 'var(--cream, #faf8f3)',
            border: '1px solid var(--ink-10)',
          }}
        >
          <div style={{ ...bodyText, fontWeight: 500, marginBottom: 6 }}>{systemFlagTitle(c)}</div>
          <div style={{ ...bodyText, color: 'var(--ink-muted, rgba(28,38,32,0.55))' }}>
            {c.summary}
          </div>
          <div style={{ ...caption, marginTop: 8 }}>
            Category is highlighted below.
            {!isAdmin && ' Nothing for you to do — we\u2019ll update it shortly.'}
            {isAdmin && ' Assign or confirm the category in Corrections.'}
          </div>
          {isAdmin && (
            <Link
              href={correctionsReviewHref({ productId: product.product_id, correctionId: c.id })}
              style={{
                ...button,
                display: 'inline-flex',
                marginTop: 12,
                textDecoration: 'none',
                background: 'var(--sage)',
                borderColor: 'var(--sage)',
                color: '#fff',
              }}
            >
              Review in Corrections →
            </Link>
          )}
        </div>
      ))}
      {proposals.map((c) => {
        const fieldKey = CORRECTION_FIELD[c.correction_type] ?? 'other'
        return (
          <div
            key={c.id}
            style={{
              marginBottom: 16,
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid rgba(192,120,24,0.25)',
              background: 'var(--amber-soft, rgba(192,120,24,0.08))',
            }}
          >
            <div style={{ ...bodyText, fontWeight: 500, marginBottom: 6, color: 'var(--amber)' }}>
              {proposalHeadline(c)}
            </div>
            <div style={{ ...caption }}>
              The {fieldKey === 'other' ? 'related' : fieldKey} field is highlighted on this page.
              {!isAdmin && ' Dough reviews shared fields before they go live.'}
            </div>
            {isAdmin && (
              <Link
                href={correctionsReviewHref({ productId: product.product_id, correctionId: c.id })}
                style={{
                  ...button,
                  display: 'inline-flex',
                  marginTop: 12,
                  textDecoration: 'none',
                  background: 'var(--sage)',
                  borderColor: 'var(--sage)',
                  color: '#fff',
                }}
              >
                Review in Corrections →
              </Link>
            )}
          </div>
        )
      })}

      {flash && (
        <div style={{ ...muted, marginBottom: 12, color: 'var(--sage)' }}>{flash}</div>
      )}
      {errorMsg && (
        <div style={{ ...muted, marginBottom: 12, color: 'var(--clay, #a6543c)' }}>{errorMsg}</div>
      )}

      {stale && (
        <StaleWritePanel
          stale={stale}
          onKeep={async () => {
            setStale(null)
            setEditingField(null)
            await refetch()
          }}
          onReapply={async () => {
            const fresh = await refetch()
            if (!fresh) return
            setStale(null)
            await stale.retry(fresh.product.row_version)
          }}
          onDismiss={() => setStale(null)}
        />
      )}

      {/* Hero */}
      <div
        style={{
          ...panel,
          display: 'grid',
          gridTemplateColumns: 'minmax(160px, 220px) minmax(0, 1fr)',
          gap: 28,
          alignItems: 'center',
          marginBottom: 20,
          padding: '28px 32px',
        }}
      >
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            maxWidth: 220,
            borderRadius: 10,
            background: 'var(--cream, #faf8f3)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--ink-10)',
          }}
        >
          {product.primary_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.primary_image_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }}
            />
          ) : (
            <span style={{ fontSize: 40, color: 'var(--ink-30)' }}>
              {(product.product_name_display ?? '?')[0]}
            </span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...caption, marginBottom: 10 }}>
            {product.category_path ?? 'Not yet categorized'}
            <ProposalBadge types={pendingFields} match="category" />
          </div>
          <IdentityField
            label="Display name"
            field="product_name_display"
            value={product.product_name_display}
            editing={editingField === 'product_name_display'}
            draft={draft}
            canEdit={canEdit && editable.has('product_name_display')}
            prior={priorForField('product_name_display')}
            pending={pendingFields.has('name')}
            onStart={() => startEditIdentity('product_name_display', product.product_name_display)}
            onDraft={setDraft}
            onSave={() => saveIdentity('product_name_display', draft)}
            onCancel={() => setEditingField(null)}
            saving={saving}
            large
          />
          <div
            style={{
              ...bodyText,
              marginTop: 10,
              color: 'var(--ink-muted, rgba(28,38,32,0.55))',
              ...(pendingFields.has('brand')
                ? {
                    padding: '8px 10px',
                    marginLeft: -10,
                    borderRadius: 8,
                    background: 'var(--amber-soft, rgba(192,120,24,0.08))',
                    border: '1px solid rgba(192,120,24,0.28)',
                  }
                : {}),
            }}
          >
            <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{product.brand_name}</span>
            <span title="Brand reassigns ownership"> · locked</span>
            <ProposalBadge types={pendingFields} match="brand" />
            {proposalByField.get('brand') && (
              <div style={{ ...caption, marginTop: 6, color: 'var(--amber)' }}>
                {proposalByField.get('brand')!.summary}
              </div>
            )}
          </div>
          {master.sku_count > 0 && (
            <div style={{ ...caption, marginTop: 10 }}>
              {master.sku_count} SKU{master.sku_count === 1 ? '' : 's'}
              {master.price?.msrp != null ? ` · MSRP ${formatMoney(master.price.msrp)}` : ''}
              {master.price?.price_tier ? ` · ${master.price.price_tier}` : ''}
            </div>
          )}
        </div>
      </div>

      <ProductSkuSwitcher
        options={master.skus.map((sku) => ({
          id: sku.sku_variant_id,
          label: displayAllCapsPhrase(skuLabel(sku)),
          barcode: sku.barcode,
        }))}
        selectedId={selectedSku?.sku_variant_id ?? null}
        canEdit={canEdit}
        addSubject={`Add SKU — product ${product.product_id}`}
        onSelect={selectSku}
      />

      <ProductDetailTabBar
        active={tab}
        packageCount={master.sku_count}
        studyCount={studies.length}
        onSelect={selectTab}
      />

      {tab === 'overview' && (
        <ProductOverviewTab>
          {/* Identity */}
          <div
            className={`pm-overview-card${pendingFields.has('name') ? ' pm-overview-card-pending' : ''}`}
          >
            <OverviewHeading>
              Identity
              <ProposalBadge types={pendingFields} match="name" />
            </OverviewHeading>
            <div className="pm-id-rows">
              {(['product_name_short', 'product_flavor_variant', 'product_variety', 'product_description'] as const).map(
                (field) => (
                  <IdentityField
                    key={field}
                    label={IDENTITY_LABELS[field]}
                    field={field}
                    value={product[field]}
                    editing={editingField === field}
                    draft={draft}
                    canEdit={canEdit && editable.has(field)}
                    prior={priorForField(field)}
                    pending={false}
                    onStart={() => startEditIdentity(field, product[field])}
                    onDraft={setDraft}
                    onSave={() => saveIdentity(field, draft)}
                    onCancel={() => setEditingField(null)}
                    saving={saving}
                    multiline={field === 'product_description'}
                    compact
                  />
                )
              )}
            </div>
          </div>
          {/* Category */}
          <div
            className={`pm-overview-card${pendingFields.has('category') ? ' pm-overview-card-pending' : ''}`}
          >
            <OverviewHeading>
              Category
              <ProposalBadge types={pendingFields} match="category" />
            </OverviewHeading>
            <CategoryBreadcrumb path={product.category_path} />
            <span className="pm-overview-locked" title="Shared field">
              Locked
            </span>
            {(proposalByField.get('category') || systemFlags[0]) && (
              <div style={{ ...caption, marginTop: 6, color: 'var(--amber)' }}>
                {(proposalByField.get('category') ?? systemFlags[0])!.summary}
              </div>
            )}
            {product.l3_confidence_score != null && (
              <p className="pm-overview-meta">
                Confidence {Math.round(Number(product.l3_confidence_score) * 100)}%
                {isAdmin && product.l3_source ? ` · ${product.l3_source}` : ''}
              </p>
            )}
            <p className="pm-overview-blurb">
              Category decides which products yours battles. Changes are reviewed because other brands
              are measured in the same set.
              {isAdmin && pendingFields.has('category')
                ? ' Approve or assign the category in Corrections — not on this page.'
                : ''}
            </p>
            {isAdmin && pendingFields.has('category') && (
              <Link
                href={correctionsReviewHref({
                  productId: product.product_id,
                  correctionId: (proposalByField.get('category') ?? systemFlags[0])?.id,
                })}
                style={{
                  ...button,
                  display: 'inline-flex',
                  marginTop: 12,
                  textDecoration: 'none',
                  background: 'var(--sage)',
                  borderColor: 'var(--sage)',
                  color: '#fff',
                }}
              >
                Review category in Corrections →
              </Link>
            )}
            {canEdit && (
              <div className="pm-overview-cat-action">
                {!categoryOpen ? (
                  <button
                    type="button"
                    onClick={() => setCategoryOpen(true)}
                    className="pm-overview-quiet-btn"
                  >
                    Request a category change
                  </button>
                ) : (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 16,
                      background: 'var(--cream, #faf8f3)',
                      borderRadius: 8,
                      border: '1px solid var(--ink-10)',
                    }}
                  >
                    <p style={{ ...consumerQuestion, margin: '0 0 12px' }}>
                      &ldquo;When someone reaches for your product instead of something else — what&apos;s
                      the something else?&rdquo;
                    </p>
                    <input
                      value={competitorQuery}
                      onChange={(e) => void searchCompetitors(e.target.value)}
                      placeholder="Search products…"
                      style={inputStyle}
                    />
                    {competitorHits.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
                        {competitorHits.map((h) => (
                          <li key={h.product_id}>
                            <button
                              type="button"
                              disabled={competitors.length >= 5 || competitors.some((c) => c.product_id === h.product_id)}
                              onClick={() => {
                                if (competitors.length >= 5) return
                                setCompetitors((prev) => [...prev, h])
                              }}
                              style={{
                                ...secondaryBtn,
                                width: '100%',
                                textAlign: 'left',
                                marginBottom: 4,
                                border: 'none',
                                background: 'transparent',
                              }}
                            >
                              {h.product_name_display}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {competitors.map((c) => (
                        <span
                          key={c.product_id}
                          style={{
                            fontSize: 13,
                            background: 'var(--white)',
                            border: '1px solid var(--ink-10)',
                            borderRadius: 4,
                            padding: '4px 8px',
                          }}
                        >
                          {c.product_name_display}
                          <button
                            type="button"
                            onClick={() =>
                              setCompetitors((prev) => prev.filter((x) => x.product_id !== c.product_id))
                            }
                            style={{ marginLeft: 6, border: 'none', background: 'none', cursor: 'pointer' }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <p style={{ ...muted, marginBottom: 8 }}>Select 3–5 competitors.</p>
                    <ComingSoonStub
                      label="Submit request"
                      subject={`Category change request — product ${product.product_id}`}
                    />
                    <button
                      type="button"
                      onClick={() => setCategoryOpen(false)}
                      style={{ ...secondaryBtn, marginLeft: 8, marginTop: 8 }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Compete */}
          <div className="pm-overview-card pm-overview-compete">
            <OverviewHeading>Where this product competes</OverviewHeading>
            {(master.compare_groups.eligible?.length ?? 0) === 0 ? (
              <p style={caption}>No compare groups on file for this category yet.</p>
            ) : (
              <div className="pm-compete-groups">
                {master.compare_groups.eligible.map((g) => {
                  const question = g.consumer_question
                  const setName = g.name && g.name !== question ? g.name : null
                  const split = Boolean(question && setName)
                  return (
                    <div key={g.compare_group_id}>
                      <div className={`pm-compete-row${split ? '' : ' pm-compete-row-solo'}`}>
                        <div className="pm-compete-question">
                          {question ? (
                            <p>&ldquo;{question}&rdquo;</p>
                          ) : (
                            <p>{g.name}</p>
                          )}
                        </div>
                        {split ? <div className="pm-compete-set">{setName}</div> : null}
                      </div>
                      {g.has_results && (
                        <div className="pm-compete-results">Has results</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ProductOverviewTab>
      )}

      {tab === 'packages' && (
        <ProductPackagesTab>
          <div className="pm-sku-header">
            <div>
              <h2 className="pm-sku-title">
                SKUs
                {multiSku && <ProposalBadge types={pendingFields} match="nutrition" />}
                {multiSku && <ProposalBadge types={pendingFields} match="ingredients" />}
                {multiSku && <ProposalBadge types={pendingFields} match="price" />}
              </h2>
              <p className="pm-sku-sub">
                {master.sku_count === 0
                  ? 'No SKUs associated with this product'
                  : `${master.sku_count} SKU${master.sku_count === 1 ? '' : 's'} associated with this product`}
              </p>
            </div>
          </div>

          {master.sku_count === 0 ? (
            <div className="pm-sku-empty">
              <p className="pm-sku-empty-title">No SKUs yet</p>
              <p className="pm-sku-empty-copy">
                About 37% of the catalog has no SKU yet. Adding one is how this product becomes
                measurable.
              </p>
            </div>
          ) : (
            <div className={`pm-sku-list${skuPending ? ' pm-sku-list-pending' : ''}`}>
              {master.skus.map((sku) => {
                const canToggle = multiSku
                const open = !canToggle || (expandedSkus[sku.sku_variant_id] ?? false)
                const isSelected = selectedSku?.sku_variant_id === sku.sku_variant_id
                return (
                  <div
                    key={sku.sku_variant_id}
                    className={`pm-sku-item${isSelected ? ' pm-sku-item-selected' : ''}`}
                  >
                    {canToggle ? (
                      <button
                        type="button"
                        className="pm-sku-row"
                        aria-expanded={open}
                        onClick={() => {
                          selectSku(sku.sku_variant_id)
                          setExpandedSkus((e) => ({
                            ...e,
                            [sku.sku_variant_id]: !open,
                          }))
                        }}
                      >
                        <span className="pm-sku-chevron" aria-hidden>
                          {open ? '⌄' : '›'}
                        </span>
                        <span className="pm-sku-main">
                          <span className="pm-sku-name">{skuLabel(sku)}</span>
                          {sku.barcode ? (
                            <span className="pm-sku-gtin">
                              <span className="pm-sku-gtin-label">GTIN</span>
                              {sku.barcode}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    ) : (
                      <div className="pm-sku-row pm-sku-row-static">
                        <span className="pm-sku-main">
                          <span className="pm-sku-name">{skuLabel(sku)}</span>
                          {sku.barcode ? (
                            <span className="pm-sku-gtin">
                              <span className="pm-sku-gtin-label">GTIN</span>
                              {sku.barcode}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    )}
                    {open && <div className="pm-sku-detail">{renderSkuFields(sku)}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </ProductPackagesTab>
      )}

      {tab === 'pricing' && (
        <ProductPricingTab>
          {/* Price */}
          <div style={pendingPanelStyle(pendingFields.has('price'))}>
            {/* Price comparison surface */}
            <SectionHeading>
              Price
              <ProposalBadge types={pendingFields} match="price" />
            </SectionHeading>
            <p style={{ ...muted, marginBottom: 12 }}>
              MSRP is edited on each SKU row. This section compares what you say vs what shoppers
              paid.
            </p>
            {selectedSku && (
              <p style={{ ...muted, marginBottom: 12 }}>
                This SKU
                {selectedSku.barcode ? ` · GTIN ${selectedSku.barcode}` : ''}: MSRP{' '}
                {formatMoney(selectedSku.msrp)}
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 12 }}>
              <Stat label="Product MSRP (aggregate)" value={formatMoney(master.price?.msrp)} />
              <Stat
                label="Price tier"
                value={master.price?.price_tier ?? '—'}
                sub="from shopper prices"
              />
              <Stat
                label="Shopper observations"
                value={
                  master.price?.observed?.publishable
                    ? formatMoney(master.price.observed.median)
                    : String(master.price?.observed?.observations ?? 0)
                }
                sub={
                  master.price?.observed?.publishable
                    ? 'median paid'
                    : `${master.price?.observed?.observations ?? 0} shopper observations · need ${master.price?.min_observations_to_publish ?? 3} to publish a range.`
                }
              />
            </div>
            {master.price?.msrp_vs_observed && (
              <p style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 12, lineHeight: 1.5 }}>
                You say {formatMoney(master.price.msrp)} · shoppers paid a median of{' '}
                {formatMoney(master.price.observed.median)} · {master.price.msrp_vs_observed.reading} (
                {master.price.msrp_vs_observed.delta_pct > 0 ? '+' : ''}
                {master.price.msrp_vs_observed.delta_pct}%)
              </p>
            )}
            <button type="button" onClick={() => void loadPriceSurface()} style={secondaryBtn} disabled={priceLoading}>
              {priceLoading ? 'Loading…' : 'Retailer & metro breakdown'}
            </button>
            {priceSurface != null && (
              <pre
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  background: 'var(--cream, #faf8f3)',
                  padding: 12,
                  borderRadius: 8,
                  overflow: 'auto',
                  maxHeight: 240,
                }}
              >
                {JSON.stringify(priceSurface, null, 2)}
              </pre>
            )}
          </div>
        </ProductPricingTab>
      )}

      {tab === 'nutrition' && (
        <ProductNutritionTab>
          <div className="pm-comp-header">
            <h2 className="pm-comp-title">Ingredients & nutrition</h2>
            <p className="pm-comp-sub">
              Product composition, nutrition, and dietary information.
            </p>
          </div>
          <div className={compositionSplit ? 'pm-comp-grid' : 'pm-comp-stack'}>
            {ingredientSkus.length > 0 && (
              <section className="pm-comp-card">
                <h3 className="pm-comp-heading">
                  Ingredients
                  <ProposalBadge types={pendingFields} match="ingredients" />
                </h3>
                {ingredientSkus.map((sku) => {
                  const ing = sku.ingredients
                  if (!ing?.ingredients_text_raw) return null
                  return (
                    <div key={sku.sku_variant_id} className="pm-comp-sku">
                      <ul className="pm-comp-ing-list">
                        {splitIngredientStatement(ing.ingredients_text_raw).map((item, i) => (
                          <li key={`${sku.sku_variant_id}-${i}`}>{displayAllCapsPhrase(item)}</li>
                        ))}
                      </ul>
                      {ing.locked && (
                        <p className="pm-comp-locked">
                          Dough verified this against the label.{' '}
                          <SupportLink subject={`Locked ingredients — SKU ${sku.sku_variant_id}`}>
                            Contact us to change it
                          </SupportLink>
                          .
                        </p>
                      )}
                      {ing.allergens_contains?.length || ing.allergens_may_contain?.length ? (
                        <p className="pm-comp-allergens">
                          {ing.allergens_contains?.length
                            ? `Contains: ${ing.allergens_contains.join(', ')}`
                            : null}
                          {ing.allergens_may_contain?.length
                            ? `${ing.allergens_contains?.length ? ' · ' : ''}May contain: ${ing.allergens_may_contain.join(', ')}`
                            : null}
                        </p>
                      ) : null}
                      <div className="pm-comp-rung">
                        <EvidenceRungChip rung={ing.evidence_rung} />
                      </div>
                    </div>
                  )
                })}
              </section>
            )}

            {showDietaryCard && (
              <section
                className={`pm-comp-card pm-comp-dietary${pendingFields.has('allergens') ? ' pm-comp-card-pending' : ''}`}
              >
                <h3 className="pm-comp-heading">
                  Dietary & allergens
                  <ProposalBadge types={pendingFields} match="allergens" />
                </h3>
                {!master.dietary ? (
                  <p className="pm-comp-empty">No dietary flags on file.</p>
                ) : (
                  <>
                    <div className="pm-comp-flags">
                      {activeDietaryFlags(master.dietary).map((flag) => (
                        <span key={flag.key} className="pm-comp-flag">
                          {flag.label}
                        </span>
                      ))}
                      <EvidenceRungChip rung={master.dietary.evidence_rung} />
                    </div>
                    {dietaryContainsItems(master.dietary).length > 0 && (
                      <div className="pm-comp-contains">
                        <p className="pm-comp-label">Contains</p>
                        <p className="pm-comp-contains-value">
                          {dietaryContainsItems(master.dietary).join(', ')}
                        </p>
                      </div>
                    )}
                    <p className="pm-comp-note">Read-only — no write path for dietary flags yet.</p>
                  </>
                )}
              </section>
            )}

            {nutritionSkus.length > 0 && (
              <section className="pm-comp-card pm-comp-nutrition">
                <h3 className="pm-comp-heading">
                  Nutrition
                  <ProposalBadge types={pendingFields} match="nutrition" />
                </h3>
                {nutritionSkus.map((sku) => {
                  const n = sku.nutrition
                  if (!n) return null
                  const summary = nutritionSummary(n)
                  const serving = servingRow(n)
                  const macros = presentRows(
                    n,
                    summary.length > 0
                      ? MACRO_ROWS.filter(
                          (def) =>
                            !['calories', 'protein_g', 'total_carbs_g', 'total_fat_g'].includes(def.key)
                        )
                      : MACRO_ROWS
                  )
                  const micros = presentRows(n, MICRO_ROWS)
                  const extra = extendedNutrientRows(n)
                  const mainRows = serving ? [serving, ...macros] : macros
                  return (
                    <div key={sku.sku_variant_id} className="pm-comp-sku">
                      {n.locked && (
                        <p className="pm-comp-locked">
                          Dough verified this against the label.{' '}
                          <SupportLink subject={`Locked nutrition — SKU ${sku.sku_variant_id}`}>
                            Contact us to change it
                          </SupportLink>
                          .
                        </p>
                      )}
                      {summary.length > 0 && (
                        <dl className="pm-comp-summary">
                          {summary.map((row) => (
                            <div key={row.label} className="pm-comp-summary-item">
                              <dt>{row.label}</dt>
                              <dd>{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {mainRows.length > 0 && (
                        <dl className="pm-comp-rows">
                          {mainRows.map((row) => (
                            <div key={row.label} className="pm-comp-row">
                              <dt>{row.label}</dt>
                              <dd>{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {micros.length > 0 && (
                        <>
                          <p className="pm-comp-subhead">Micronutrients</p>
                          <dl className="pm-comp-rows">
                            {micros.map((row) => (
                              <div key={row.label} className="pm-comp-row">
                                <dt>{row.label}</dt>
                                <dd>{row.value}</dd>
                              </div>
                            ))}
                          </dl>
                        </>
                      )}
                      {extra.length > 0 && (
                        <dl className="pm-comp-rows">
                          {extra.map((row) => (
                            <div key={row.label} className="pm-comp-row">
                              <dt>{row.label}</dt>
                              <dd>{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <div className="pm-comp-rung">
                        <EvidenceRungChip rung={n.evidence_rung} />
                      </div>
                    </div>
                  )
                })}
              </section>
            )}
          </div>
        </ProductNutritionTab>
      )}

      {tab === 'intelligence' && (
        <ProductIntelligenceTab>
          <div className="pm-intel-header">
            <h2 className="pm-intel-title">Intelligence</h2>
            <p className="pm-intel-sub">
              How this product stands in Dough head-to-heads — the jobs shoppers actually vote on.
            </p>
          </div>

          {intelHeadline ? (
            <section className="pm-intel-hero">
              <p className="pm-intel-eyebrow">Standing</p>
              <p className="pm-intel-hero-rank">{intelHeadline.rankLabel}</p>
              <p className="pm-intel-hero-q">&ldquo;{intelHeadline.question}&rdquo;</p>
              <div className="pm-intel-hero-meta">
                {intelHeadline.eloLabel ? <span>Elo {intelHeadline.eloLabel}</span> : null}
                {intelHeadline.recordLabel ? <span>{intelHeadline.recordLabel}</span> : null}
                {intelHeadline.setName ? <span>{intelHeadline.setName}</span> : null}
              </div>
              <p className="pm-intel-hero-note">
                Unpublished ranking. Organic Elo has no confidence interval.
              </p>
            </section>
          ) : null}

          {intelVolume.length > 0 ? (
            <>
              <dl className="pm-intel-stats">
                {intelVolume.map((stat) => (
                  <div key={stat.key} className="pm-intel-stat">
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                  </div>
                ))}
              </dl>
              {intelFloor ? <p className="pm-intel-floor">{intelFloor}</p> : null}
            </>
          ) : null}

          {intelJobs.length === 0 ? (
            <div className="pm-intel-empty">
              <h3>No comparison jobs on file</h3>
              <p>
                This product isn’t in a Dough head-to-head yet. Jobs appear once the category has
                an active compare group.
              </p>
            </div>
          ) : (
            <>
              <h3 className="pm-intel-section">Head-to-heads</h3>
              <div className="pm-intel-jobs">
                {intelJobs.map((job) => {
                const title = job.question ?? job.setName ?? 'Comparison job'
                const quoted = Boolean(job.question)
                const status = jobStatusCopy(job, showJobScores)
                return (
                  <article key={job.compareGroupId} className="pm-intel-job">
                    {job.battleLevelLabel ? (
                      <p className="pm-intel-eyebrow">{job.battleLevelLabel}</p>
                    ) : null}
                    <h3 className="pm-intel-job-q">
                      {quoted ? <>&ldquo;{title}&rdquo;</> : title}
                    </h3>
                    {job.setName && job.question ? (
                      <p className="pm-intel-job-set">{job.setName}</p>
                    ) : null}

                    {job.standings.map((standing) => {
                      const metrics = [
                        standing.rankLabel
                          ? { key: 'rank', label: 'Rank', value: standing.rankLabel }
                          : standing.rankComparable === false
                            ? { key: 'rank', label: 'Rank', value: 'Not comparable yet' }
                            : null,
                        standing.eloLabel
                          ? { key: 'elo', label: 'Elo', value: standing.eloLabel, sub: 'No confidence interval' }
                          : null,
                        standing.recordLabel
                          ? { key: 'record', label: 'Record', value: standing.recordLabel }
                          : null,
                      ].filter((m): m is { key: string; label: string; value: string; sub?: string } => m != null)

                      return (
                        <div key={standing.key} className="pm-intel-standing">
                          {metrics.length > 0 ? (
                            <dl className="pm-intel-metrics">
                              {metrics.map((metric) => (
                                <div key={metric.key} className="pm-intel-metric">
                                  <dt>{metric.label}</dt>
                                  <dd>{metric.value}</dd>
                                  {metric.sub ? (
                                    <p className="pm-intel-metric-sub">{metric.sub}</p>
                                  ) : null}
                                </div>
                              ))}
                            </dl>
                          ) : null}
                          {standing.maturityLabel || standing.seedSource ? (
                            <p className="pm-intel-hero-note">
                              {[
                                standing.maturityLabel,
                                standing.seedSource ? `Seeded from ${standing.seedSource}` : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}

                    {status ? <p className="pm-intel-status">{status}</p> : null}
                  </article>
                )
              })}
              </div>
            </>
          )}

          {!showJobScores && intelJobs.length > 0 ? (
            <p className="pm-intel-note">
              Published Elo and rankings aren’t shown here. Organic scores have no confidence
              interval.
            </p>
          ) : master.intelligence?.admin_only && showJobScores ? (
            <p className="pm-intel-note">
              Admin view. These scores are unpublished and must not be presented as a brand-facing
              ranking.
            </p>
          ) : null}
        </ProductIntelligenceTab>
      )}

      {tab === 'studies' && <ProductStudiesTab studies={studies} />}

      {tab === 'proof' && <ProductProofTab />}

      {tab === 'images' && (
        <ProductImagesTab>
          {/* Images */}
          <div style={pendingPanelStyle(pendingFields.has('images'))}>
            {/* Images */}
            <SectionHeading>
              Images
              <ProposalBadge types={pendingFields} match="images" />
            </SectionHeading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              {master.images.map((img) => (
                <div key={img.product_image_id} style={{ width: 100, textAlign: 'center' }}>
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 8,
                      background: 'var(--cream, #faf8f3)',
                      overflow: 'hidden',
                      opacity: img.superseded_by_id ? 0.55 : 1,
                      border: img.is_primary ? '2px solid var(--sage)' : '1px solid var(--ink-10)',
                    }}
                  >
                    {img.public_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.public_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : null}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <EvidenceRungChip rung={img.evidence_rung} />
                  </div>
                  {img.is_primary ? (
                    <div style={{ fontSize: 13, color: 'var(--sage)', marginTop: 2 }}>Primary</div>
                  ) : (
                    canEdit &&
                    !img.superseded_by_id && (
                      <button
                        type="button"
                        onClick={() => void promoteImage(img.product_image_id)}
                        style={{ ...secondaryBtn, fontSize: 13, padding: '2px 6px', marginTop: 4 }}
                      >
                        Make primary
                      </button>
                    )
                  )}
                  {img.superseded_by_id && (
                    <div style={{ fontSize: 13, color: 'var(--ink-30)' }}>History</div>
                  )}
                </div>
              ))}
            </div>
            {canEdit && (
              <label style={{ ...secondaryBtn, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void uploadImage(f)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>
        </ProductImagesTab>
      )}

      {tab === 'activity' && <ProductActivityTab />}


      {/* Coverage footer */}
      {cov && (
        <p style={{ ...muted, margin: '28px 0 0' }}>
          Across {cov.active_products.toLocaleString()} active products:{' '}
          {coveragePct(cov.with_nutrition, cov.active_products)} have nutrition ·{' '}
          {coveragePct(cov.with_micronutrients, cov.active_products)} have micronutrients ·{' '}
          {coveragePct(cov.with_image, cov.active_products)} have an image ·{' '}
          {coveragePct(cov.with_price, cov.active_products)} have a price.
          <span style={{ color: 'var(--ink-30)' }}> · as of {cov.as_of}</span>
        </p>
      )}
    </div>
  )
}

const STUB_COMPETITORS: CompetitorHit[] = [
  { product_id: 1, product_name_display: 'Nature Valley Sweet & Salty' },
  { product_id: 2, product_name_display: 'KIND Dark Chocolate Nuts' },
  { product_id: 3, product_name_display: 'Clif Bar Chocolate Chip' },
  { product_id: 4, product_name_display: 'RXBAR Peanut Butter' },
  { product_id: 5, product_name_display: 'Larabar Apple Pie' },
]

const secondaryBtn: CSSProperties = {
  ...button,
}

const inputStyle: CSSProperties = {
  ...masterInput,
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 style={sectionTitle}>{children}</h2>
}

function OverviewHeading({ children }: { children: ReactNode }) {
  return <h2 className="pm-overview-heading">{children}</h2>
}

function CategoryBreadcrumb({ path }: { path: string | null }) {
  const parts = splitCategoryPath(path)
  if (parts.length === 0) {
    return (
      <div className="pm-overview-path">
        <span className="pm-overview-path-seg">{path ?? 'Not yet categorized'}</span>
      </div>
    )
  }
  return (
    <div className="pm-overview-path">
      {parts.map((part, i) => {
        const last = i === parts.length - 1
        return (
          <span key={`${part}-${i}`}>
            {i > 0 ? <span className="pm-overview-path-sep">›</span> : null}
            <span
              className={
                last ? 'pm-overview-path-seg pm-overview-path-current' : 'pm-overview-path-seg'
              }
            >
              {part}
            </span>
          </span>
        )
      })}
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={metricCard}>
      <div style={{ ...fieldLabel, marginBottom: 6 }}>{label}</div>
      <div style={metricNumber}>{value}</div>
      {sub && <div style={{ ...caption, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function IdentityField({
  label,
  field,
  value,
  editing,
  draft,
  canEdit,
  prior,
  pending,
  onStart,
  onDraft,
  onSave,
  onCancel,
  saving,
  large,
  multiline,
  compact,
}: {
  label: string
  field: string
  value: string | null
  editing: boolean
  draft: string
  canEdit: boolean
  prior?: RecentChange
  pending: boolean
  onStart: () => void
  onDraft: (v: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  large?: boolean
  multiline?: boolean
  compact?: boolean
}) {
  if (editing) {
    const editor = (
      <>
        {prior && (
          <div style={{ ...muted, marginBottom: 6 }}>
            Overwriting {formatJsonValue(prior.old_value)} → {formatJsonValue(prior.new_value)} set by{' '}
            {prior.actor_label} {relativeAgo(prior.changed_at)}
          </div>
        )}
        {multiline ? (
          <textarea value={draft} onChange={(e) => onDraft(e.target.value)} rows={4} style={inputStyle} />
        ) : (
          <input value={draft} onChange={(e) => onDraft(e.target.value)} style={inputStyle} autoFocus />
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" onClick={onSave} disabled={saving} style={secondaryBtn}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onCancel} style={secondaryBtn}>
            Cancel
          </button>
        </div>
      </>
    )
    if (compact) {
      return (
        <div className="pm-id-row">
          <div className="pm-id-label">{label}</div>
          <div className="pm-id-edit">{editor}</div>
        </div>
      )
    }
    return (
      <div>
        <div style={{ ...fieldLabel, marginBottom: 4 }}>{label}</div>
        {editor}
      </div>
    )
  }

  const display = (large ? displayProductName(value) : value) || (canEdit ? 'Add' : '—')
  const isAdd = !value && canEdit

  if (compact) {
    return (
      <div className="pm-id-row">
        <div className="pm-id-label">
          {label}
          {pending && <ProposalBadge types={new Set(['name'])} match="name" />}
        </div>
        <button
          type="button"
          onClick={canEdit ? onStart : undefined}
          disabled={!canEdit}
          className={`pm-id-value${isAdd ? ' pm-id-add' : ''}`}
          title={canEdit ? 'Click to edit' : undefined}
        >
          {display}
        </button>
      </div>
    )
  }

  return (
    <div>
      {!large && (
        <div style={{ ...fieldLabel, marginBottom: 4 }}>
          {label}
          {pending && <ProposalBadge types={new Set(['name'])} match="name" />}
        </div>
      )}
      <button
        type="button"
        onClick={canEdit ? onStart : undefined}
        disabled={!canEdit}
        style={{
          ...(large ? productNameStyle : fieldValue),
          ...(!value && canEdit ? fieldEmpty : {}),
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: canEdit ? 'pointer' : 'default',
          width: '100%',
        }}
        title={canEdit ? 'Click to edit' : undefined}
      >
        {display}
      </button>
    </div>
  )
}

function StaleWritePanel({
  stale,
  onKeep,
  onReapply,
  onDismiss,
}: {
  stale: StaleState
  onKeep: () => void
  onReapply: () => void
  onDismiss: () => void
}) {
  const [compare, setCompare] = useState(false)
  const change = stale.change
  return (
    <div
      style={{
        marginBottom: 20,
        padding: 16,
        border: '1px solid rgba(192,120,24,0.35)',
        background: 'var(--amber-pale, #f3e6d0)',
        borderRadius: 8,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>
        This product changed while you were editing.
      </div>
      {change ? (
        <p style={{ ...muted, margin: '0 0 12px', color: 'var(--ink)' }}>
          {change.actor_label} changed <code>{change.field_name}</code> from{' '}
          &ldquo;{formatJsonValue(change.old_value)}&rdquo; to &ldquo;{formatJsonValue(change.new_value)}&rdquo;{' '}
          {relativeAgo(change.changed_at)}.
        </p>
      ) : (
        <p style={{ ...muted, margin: '0 0 12px' }}>Someone else saved. Your edit was not applied.</p>
      )}
      {compare && change && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Theirs</div>
            {formatJsonValue(change.new_value)}
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Yours</div>
            {formatJsonValue(stale.localValue)}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={onKeep} style={secondaryBtn}>
          Keep theirs
        </button>
        <button type="button" onClick={onReapply} style={secondaryBtn}>
          Reapply mine
        </button>
        <button type="button" onClick={() => setCompare((c) => !c)} style={secondaryBtn}>
          Compare
        </button>
        <button type="button" onClick={onDismiss} style={{ ...secondaryBtn, opacity: 0.7 }}>
          Dismiss
        </button>
      </div>
    </div>
  )
}

function SkuBlock({
  sku,
  canEdit,
  correctionTypes,
  multiSku,
  showAll,
  onToggleAll,
  editingMsrp,
  msrpDraft,
  onStartMsrp,
  onMsrpDraft,
  onSaveMsrp,
  onCancelMsrp,
  editingIngredients,
  ingredientsDraft,
  onStartIngredients,
  onIngredientsDraft,
  onSaveIngredients,
  onCancelIngredients,
  editingNutritionKey,
  nutritionDraft,
  onStartNutrition,
  onNutritionDraft,
  onSaveNutrition,
  onCancelNutrition,
  saving,
  hideIdentity,
}: {
  sku: MasterSku
  canEdit: boolean
  correctionTypes: Set<string>
  multiSku: boolean
  showAll: boolean
  onToggleAll: () => void
  editingMsrp: boolean
  msrpDraft: string
  onStartMsrp: () => void
  onMsrpDraft: (v: string) => void
  onSaveMsrp: () => void
  onCancelMsrp: () => void
  editingIngredients: boolean
  ingredientsDraft: string
  onStartIngredients: () => void
  onIngredientsDraft: (v: string) => void
  onSaveIngredients: () => void
  onCancelIngredients: () => void
  editingNutritionKey: string | null
  nutritionDraft: string
  onStartNutrition: (key: string, val: string | null) => void
  onNutritionDraft: (v: string) => void
  onSaveNutrition: (key: string) => void
  onCancelNutrition: () => void
  saving: boolean
  hideIdentity?: boolean
}) {
  const n = sku.nutrition
  const ing = sku.ingredients

  function nutrientValue(key: string): string | null {
    if (!n) return null
    if (key === 'serving_size') {
      if (n.serving_size_value == null) return null
      return `${n.serving_size_value}${n.serving_size_uom ? ` ${n.serving_size_uom}` : ''}`
    }
    const v = (n as Record<string, unknown>)[key]
    return v == null ? null : String(v)
  }

  const extended = Object.entries(n?.extended_nutrients ?? {}).filter(
    ([k]) => !UNMAPPED_NUTRIENT.test(k)
  )

  return (
    <div>
      {!hideIdentity && (
        <div style={{ ...muted, marginBottom: 10 }}>
          {skuLabel(sku)}
          {sku.barcode ? ` · ${sku.barcode}` : ''}
        </div>
      )}

      {/* MSRP on package row */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ ...fieldLabel, marginBottom: 4 }}>
          MSRP
          {!multiSku && <ProposalBadge types={correctionTypes} match="price" />}
        </div>
        {editingMsrp ? (
          <div>
            <input
              value={msrpDraft}
              onChange={(e) => onMsrpDraft(e.target.value)}
              type="number"
              step="0.01"
              style={{ ...inputStyle, maxWidth: 140 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" onClick={onSaveMsrp} disabled={saving} style={secondaryBtn}>
                Save
              </button>
              <button type="button" onClick={onCancelMsrp} style={secondaryBtn}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={canEdit ? onStartMsrp : undefined}
            disabled={!canEdit}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 16,
              fontFamily: 'var(--font-serif, var(--font-display))',
              cursor: canEdit ? 'pointer' : 'default',
              color: 'var(--ink)',
            }}
          >
            {formatMoney(sku.msrp)}
          </button>
        )}
      </div>

      {/* Nutrition */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ ...bodyText, fontWeight: 500, marginBottom: 8 }}>
          Nutrition
          {!multiSku && <ProposalBadge types={correctionTypes} match="nutrition" />}
          {n && <EvidenceRungChip rung={n.evidence_rung} />}
        </div>
        {!n ? (
          <p style={muted}>No nutrition on file.</p>
        ) : (
          <>
            {n.locked && (
              <p style={{ ...muted, marginBottom: 8 }}>
                🔒 Dough verified this against the label.{' '}
                <SupportLink subject={`Locked nutrition — SKU ${sku.sku_variant_id}`}>
                  Contact us to change it
                </SupportLink>
                .
              </p>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 10,
              }}
            >
              {HEADLINE_NUTRIENTS.map(({ key, label, suffix }) => {
                const editKey = `${sku.sku_variant_id}:${key}`
                const editableKey = key === 'serving_size' ? null : key
                const display = nutrientValue(key)
                if (editingNutritionKey === editKey && editableKey && !n.locked) {
                  return (
                    <div key={key}>
                      <div style={{ ...fieldLabel }}>{label}</div>
                      <input
                        value={nutritionDraft}
                        onChange={(e) => onNutritionDraft(e.target.value)}
                        style={inputStyle}
                      />
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button
                          type="button"
                          style={{ ...secondaryBtn, padding: '2px 6px', fontSize: 13 }}
                          onClick={() => onSaveNutrition(editableKey)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          style={{ ...secondaryBtn, padding: '2px 6px', fontSize: 13 }}
                          onClick={onCancelNutrition}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={key}>
                    <div style={{ ...fieldLabel }}>{label}</div>
                    <button
                      type="button"
                      disabled={!canEdit || n.locked || !editableKey}
                      onClick={() =>
                        editableKey &&
                        onStartNutrition(
                          editableKey,
                          (n as Record<string, unknown>)[editableKey] != null
                            ? String((n as Record<string, unknown>)[editableKey])
                            : ''
                        )
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: 15,
                        cursor: canEdit && !n.locked && editableKey ? 'pointer' : 'default',
                        color: 'var(--ink)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {display != null
                        ? key === 'serving_size'
                          ? display
                          : suffix
                            ? `${display} ${suffix}`
                            : display
                        : '—'}
                    </button>
                  </div>
                )
              })}
            </div>
            <button type="button" onClick={onToggleAll} style={{ ...secondaryBtn, marginBottom: 8 }}>
              {showAll ? 'Hide nutrients' : 'More nutrients'}
            </button>
            {showAll && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[...MORE_MACROS, ...CORE_MICROS].map(({ key, label, suffix }) => {
                  const v = (n as Record<string, unknown>)[key]
                  return (
                    <div key={key} style={{ fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-50)' }}>{label}</span>
                      <div>
                        {v == null ? '—' : `${v}${suffix ? ` ${suffix}` : ''}`}
                      </div>
                    </div>
                  )
                })}
                {extended.map(([k, v]) => (
                  <div key={k} style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--ink-50)' }}>{k.replace(/_/g, ' ')}</span>
                    <div>{v == null ? '—' : String(v)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Ingredients */}
      <div>
        <div style={{ ...bodyText, fontWeight: 500, marginBottom: 8 }}>
          Ingredients
          {!multiSku && <ProposalBadge types={correctionTypes} match="ingredients" />}
          {ing && <EvidenceRungChip rung={ing.evidence_rung} />}
        </div>
        {!ing ? (
          <p style={muted}>No ingredients on file.</p>
        ) : (
          <>
            {ing.locked && (
              <p style={{ ...muted, marginBottom: 8 }}>
                🔒 Dough verified this against the label.{' '}
                <SupportLink subject={`Locked ingredients — SKU ${sku.sku_variant_id}`}>
                  Contact us to change it
                </SupportLink>
                .
              </p>
            )}
            {editingIngredients && !ing.locked ? (
              <div>
                <textarea
                  value={ingredientsDraft}
                  onChange={(e) => onIngredientsDraft(e.target.value)}
                  rows={5}
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" onClick={onSaveIngredients} disabled={saving} style={secondaryBtn}>
                    Save
                  </button>
                  <button type="button" onClick={onCancelIngredients} style={secondaryBtn}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={!canEdit || ing.locked}
                onClick={onStartIngredients}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  textAlign: 'left',
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                  cursor: canEdit && !ing.locked ? 'pointer' : 'default',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {ing.ingredients_text_raw || (canEdit && !ing.locked ? 'Add ingredients' : '—')}
              </button>
            )}
            {(ing.allergens_contains?.length || ing.allergens_may_contain?.length) ? (
              <p style={{ ...muted, marginTop: 8 }}>
                {ing.allergens_contains?.length
                  ? `Contains: ${ing.allergens_contains.join(', ')}`
                  : null}
                {ing.allergens_may_contain?.length
                  ? `${ing.allergens_contains?.length ? ' · ' : ''}May contain: ${ing.allergens_may_contain.join(', ')}`
                  : null}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
