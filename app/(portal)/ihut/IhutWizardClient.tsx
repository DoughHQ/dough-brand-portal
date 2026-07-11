'use client'

import { useReducer, useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import type {
  PortalUser,
  Brand,
  QuestionType,
  ProtocolQuestionRow,
  MissionWizardDraft,
  ValidatedCommissionProduct,
  MissionTemplate,
} from '@/lib/queries'
import type { MissionMenuSelection } from '../admin/studies/new/MissionMenuClient'
import type { CampaignDraft, BrandQuestion } from '@/lib/ihut/types'
import MissionMenuClient from '../admin/studies/new/MissionMenuClient'
import {
  MIN_COMPLETIONS_FLOOR,
  MAX_COMPLETIONS,
  DEFAULT_PAYOUT_PER_USER_CENTS,
  EXPECTED_COMPLETION_RATE,
  PLATFORM_FEE_CENTS,
  REQUIRED_QUESTION_CODES,
  H2H_REQUIRED_QUESTION_CODES,
  MAX_BRAND_QUESTIONS_PER_SESSION,
  TEMPLATE_DEFAULT_COMPLETIONS,
  minTemplateCompletions,
  ENFORCE_TEMPLATE_COMPLETIONS_FLOOR,
  TEMPLATE_COMPLETIONS_SOFT_FLOOR,
  TEMPLATE_COMPLETIONS_ABSOLUTE_MIN,
} from '@/lib/ihut/constants'
import {
  getEligiblePoolAction,
  getQuestionTypesAction,
  getFocalProductTaxonomyNodeAction,
  getAllBrandProductsAction,
  searchChallengerProductsAction,
  createCampaignDraftAction,
  upsertProtocolQuestionsAction,
  previewMissionFeasibilityAction,
  publishMissionFromTemplateAction,
} from './actions'
import { commissionCampaignDraftAction } from '../admin/studies/actions'
import type { PreviewMissionFeasibility, PreviewPanelMember } from '@/lib/ihut/missionPublish'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StepId =
  | 'study_type'
  | 'product'
  | 'challengers'
  | 'targeting'
  | 'questions'
  | 'preview'
  | 'completions'
  | 'review'

type Step = { id: StepId; label: string }

type BrandProductRow = {
  product_id: number
  product_name_display: string
  taxonomy_node_id: number | null
  total_battles: number
  l2_name: string | null
}

type ChallengerRow = {
  product_id: number
  product_name_display: string
  brand_name: string
  total_battles: number
}

type Action =
  | {
      type: 'SET_MISSION'
      missionType: NonNullable<CampaignDraft['missionType']>
      doughFeeCents: number
      missionTemplateId?: string | null
      menuProductKey?: string | null
    }
  | { type: 'PATCH'; patch: Partial<CampaignDraft> }
  | { type: 'PATCH_TARGETING'; patch: Partial<CampaignDraft['targeting']> }
  | { type: 'ADD_QUESTION'; question: BrandQuestion }
  | { type: 'REMOVE_QUESTION'; _id: string }
  | { type: 'TOGGLE_CHALLENGER'; productId: string }

const emptyDraft: CampaignDraft = {
  campaignId: null,
  missionId: null,
  protocolId: null,
  missionType: null,
  missionTemplateId: null,
  menuProductKey: null,
  focalProductId: null,
  focalProductTaxonomyNodeId: null,
  focalProductName: null,
  challengerProductIds: [],
  challengerMethod: null,
  targeting: {
    states: [],
    minCategoryBattles: 0,
    newToBrandOnly: false,
    recentPurchaseOnly: false,
  },
  targetCompletions: MIN_COMPLETIONS_FLOOR,
  payoutPerUserCents: DEFAULT_PAYOUT_PER_USER_CENTS,
  doughFeeCents: 0,
  questions: [],
}

function buildInitialDraft(
  resumed: MissionWizardDraft | null,
  serverProduct?: ValidatedCommissionProduct | null
): CampaignDraft {
  if (resumed) {
    return {
      campaignId: resumed.campaignId,
      missionId: resumed.missionId,
      protocolId: resumed.protocolId,
      missionType: resumed.missionType,
      missionTemplateId: null,
      menuProductKey: null,
      focalProductId: resumed.focalProductId,
      focalProductTaxonomyNodeId: resumed.focalProductTaxonomyNodeId,
      focalProductName: resumed.focalProductName,
      challengerProductIds: [],
      challengerMethod: null,
      targeting: resumed.targeting,
      targetCompletions: resumed.targetCompletions,
      payoutPerUserCents: resumed.payoutPerUserCents,
      doughFeeCents: 0,
      questions: resumed.questions as BrandQuestion[],
    }
  }

  const draft = { ...emptyDraft }
  if (serverProduct) {
    draft.focalProductId = String(serverProduct.product_id)
    draft.focalProductTaxonomyNodeId = serverProduct.taxonomy_node_id
    draft.focalProductName = serverProduct.product_name_display
  }
  return draft
}

function computeResumeStepIndex(draft: CampaignDraft): number {
  const steps = buildSteps(draft.missionType, !!draft.missionTemplateId)
  if (draft.missionTemplateId) {
    if (draft.campaignId) {
      const previewIdx = steps.findIndex((s) => s.id === 'preview')
      return previewIdx >= 0 ? previewIdx : 0
    }
    if (draft.focalProductId) {
      const productIdx = steps.findIndex((s) => s.id === 'product')
      return productIdx >= 0 ? productIdx : 0
    }
    return 0
  }
  if (!draft.missionId) return 0
  const targetingIdx = steps.findIndex((s) => s.id === 'targeting')
  return targetingIdx >= 0 ? targetingIdx : 0
}

function draftReducer(state: CampaignDraft, action: Action): CampaignDraft {
  switch (action.type) {
    case 'SET_MISSION':
      return {
        ...state,
        missionType: action.missionType,
        doughFeeCents: action.doughFeeCents,
        missionTemplateId:
          action.missionTemplateId !== undefined
            ? action.missionTemplateId
            : state.missionTemplateId,
        menuProductKey:
          action.menuProductKey !== undefined
            ? action.menuProductKey
            : state.menuProductKey,
        // New study selection invalidates any prior campaign mint.
        campaignId: null,
        missionId: null,
        protocolId: null,
        challengerProductIds:
          action.missionType === 'head_to_head' ? state.challengerProductIds : [],
        challengerMethod:
          action.missionType === 'head_to_head' ? state.challengerMethod : null,
      }
    case 'PATCH':
      return { ...state, ...action.patch }
    case 'PATCH_TARGETING':
      return { ...state, targeting: { ...state.targeting, ...action.patch } }
    case 'ADD_QUESTION':
      return { ...state, questions: [...state.questions, action.question] }
    case 'REMOVE_QUESTION':
      return { ...state, questions: state.questions.filter((q) => q._id !== action._id) }
    case 'TOGGLE_CHALLENGER': {
      const ids = state.challengerProductIds
      if (ids.includes(action.productId)) {
        return { ...state, challengerProductIds: ids.filter((id) => id !== action.productId) }
      }
      if (ids.length >= 4) return state
      return { ...state, challengerProductIds: [...ids, action.productId], challengerMethod: 'specific' }
    }
    default:
      return state
  }
}

function buildSteps(
  missionType: CampaignDraft['missionType'],
  hasTemplate: boolean
): Step[] {
  // Template path: preview before naming/creating a campaign. No opponent picker,
  // no targeting/questions (protocol + panel come from the template at publish),
  // no funding step.
  if (hasTemplate) {
    return [
      { id: 'study_type', label: 'Study type' },
      { id: 'product', label: 'Product' },
      { id: 'preview', label: 'Preview' },
      { id: 'completions', label: 'Completions' },
    ]
  }

  const base: Step[] = [
    { id: 'study_type', label: 'Study type' },
    { id: 'product', label: 'Product' },
  ]
  if (missionType === 'head_to_head') {
    base.push({ id: 'challengers', label: 'Challengers' })
  }
  base.push(
    { id: 'targeting', label: 'Targeting & size' },
    { id: 'questions', label: 'Questions' },
    { id: 'review', label: 'Review' },
  )
  return base
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

function spineSession(code: string): 1 | 2 {
  if (code.endsWith('_s1')) return 1
  return 2
}

function estimateJudgments(codes: string[]): number {
  return codes.reduce((sum, code) => sum + (code === 'elo_battle' ? 3 : 1), 0)
}

function buildSpineRows(
  missionType: NonNullable<CampaignDraft['missionType']>,
  protocolId: string
): ProtocolQuestionRow[] {
  const codes =
    missionType === 'head_to_head' ? H2H_REQUIRED_QUESTION_CODES : REQUIRED_QUESTION_CODES
  return codes.map((code, idx) => ({
    protocol_id: protocolId,
    question_type_code: code,
    session_number: spineSession(code),
    position: idx,
    label: null,
    config: {},
    selection_strategy: null,
    selection_config: {},
    is_required: true,
  }))
}

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  note,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  note?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        padding: '12px 14px',
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-md)',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-30)', lineHeight: 1.5 }}>{description}</div>
        {note && (
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 3, fontFamily: 'monospace' }}>
            {note}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        style={{
          flexShrink: 0,
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? 'var(--sage)' : 'var(--ink-10)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.15s var(--ease)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 20 : 2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.15s var(--ease)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Study type
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Step 1 — Study type is MissionMenuClient (DB templates). StepStudyType removed.
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Step 2 — Product
// ---------------------------------------------------------------------------

function StepProduct({
  draft,
  dispatch,
  brandId,
  lockProduct,
}: {
  draft: CampaignDraft
  dispatch: React.Dispatch<Action>
  brandId: number
  lockProduct?: boolean
}) {
  const [products, setProducts] = useState<BrandProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectingId, setSelectingId] = useState<number | null>(null)

  useEffect(() => {
    getAllBrandProductsAction(brandId)
      .then((rows) => setProducts(rows as BrandProductRow[]))
      .catch((err) => console.error('getAllBrandProducts error:', err))
      .finally(() => setLoading(false))
  }, [brandId])

  async function selectProduct(p: BrandProductRow) {
    setSelectingId(p.product_id)
    try {
      const taxonomyNodeId =
        p.taxonomy_node_id ?? (await getFocalProductTaxonomyNodeAction(p.product_id))
      dispatch({
        type: 'PATCH',
        patch: {
          focalProductId: String(p.product_id),
          focalProductTaxonomyNodeId: taxonomyNodeId,
          focalProductName: p.product_name_display,
          // New focal invalidates any prior campaign / preview publish state.
          campaignId: null,
          missionId: null,
          protocolId: null,
        },
      })
    } catch (err) {
      console.error('selectProduct error:', err)
    } finally {
      setSelectingId(null)
    }
  }

  const filtered = products.filter((p) =>
    !search || p.product_name_display.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-30)', fontSize: 13 }}>
        Loading products…
      </div>
    )
  }

  const lockedProduct = lockProduct && draft.focalProductName

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>
          {lockProduct ? 'Focal product' : 'Choose your focal product'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          {lockProduct
            ? 'Locked from your search selection. This product will anchor the study.'
            : 'This is the product users will trial. Its category determines the eligible user pool.'}
        </p>
      </div>

      {lockedProduct ? (
        <div
          style={{
            padding: '18px 20px',
            background: 'var(--sage-pale)',
            border: '1.5px solid var(--sage)',
            borderRadius: 'var(--r-md)',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: 6 }}>
            Selected product
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{draft.focalProductName}</div>
        </div>
      ) : (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 13,
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md)',
              marginBottom: 16,
              fontFamily: 'var(--font-sans)',
              color: 'var(--ink)',
              background: 'var(--white)',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((p) => {
              const selected = draft.focalProductId === String(p.product_id)
              const busy = selectingId === p.product_id
              return (
                <button
                  key={p.product_id}
                  onClick={() => selectProduct(p)}
                  disabled={busy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                background: selected ? 'var(--sage-pale)' : 'var(--white)',
                border: selected ? '2px solid var(--sage)' : '1px solid var(--ink-10)',
                borderRadius: 'var(--r-md)',
                cursor: busy ? 'wait' : 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: selected ? 'var(--sage)' : 'var(--ink)' }}>
                  {p.product_name_display}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
                  {p.l2_name ?? 'Uncategorized'} · {p.total_battles.toLocaleString()} battles
                </div>
              </div>
              {selected && (
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--sage)', textTransform: 'uppercase' }}>
                  Selected
                </span>
              )}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--ink-30)', padding: '20px 0', textAlign: 'center' }}>
            No products match your search.
          </div>
        )}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Challengers
// ---------------------------------------------------------------------------

function StepChallengers({
  draft,
  dispatch,
  brandId,
}: {
  draft: CampaignDraft
  dispatch: React.Dispatch<Action>
  brandId: number
}) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ChallengerRow[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (search.length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const timer = setTimeout(() => {
      searchChallengerProductsAction(
        search,
        brandId,
        draft.focalProductId ? parseInt(draft.focalProductId, 10) : null
      )
        .then(setResults)
        .catch((err) => console.error('searchChallengerProducts error:', err))
        .finally(() => setSearching(false))
    }, 350)
    return () => clearTimeout(timer)
  }, [search, brandId, draft.focalProductId])

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>
          Select challengers
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          Pick up to 4 competitor products from other brands. Users will battle your focal product against these.
        </p>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search competitor products (min 2 chars)…"
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: 13,
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-md)',
          marginBottom: 16,
          fontFamily: 'var(--font-sans)',
          color: 'var(--ink)',
          background: 'var(--white)',
          outline: 'none',
        }}
      />
      {draft.challengerProductIds.length > 0 && (
        <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--sage)', fontWeight: 500 }}>
          {draft.challengerProductIds.length} of 4 selected
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {searching && (
          <div style={{ fontSize: 13, color: 'var(--ink-30)', padding: '12px 0' }}>Searching…</div>
        )}
        {!searching && results.map((p) => {
          const id = String(p.product_id)
          const selected = draft.challengerProductIds.includes(id)
          return (
            <button
              key={p.product_id}
              onClick={() => dispatch({ type: 'TOGGLE_CHALLENGER', productId: id })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: selected ? 'var(--sage-pale)' : 'var(--white)',
                border: selected ? '2px solid var(--sage)' : '1px solid var(--ink-10)',
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: selected ? 'var(--sage)' : 'var(--ink)' }}>
                  {p.product_name_display}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 2 }}>
                  {p.brand_name} · {p.total_battles.toLocaleString()} battles
                </div>
              </div>
              <span style={{ fontSize: 12, color: selected ? 'var(--sage)' : 'var(--ink-30)' }}>
                {selected ? '✓' : '+'}
              </span>
            </button>
          )
        })}
        {!searching && search.length >= 2 && results.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--ink-30)', padding: '12px 0' }}>No competitors found.</div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4 — Targeting & size
// ---------------------------------------------------------------------------

function StepTargeting({
  draft,
  dispatch,
  brandId,
  allowPoolOverride,
  onReadyChange,
}: {
  draft: CampaignDraft
  dispatch: React.Dispatch<Action>
  brandId: number
  /** dough_admin: proceed past pool gate; numbers stay truthful */
  allowPoolOverride: boolean
  onReadyChange: (ready: boolean) => void
}) {
  const [stateInput, setStateInput] = useState('')
  const [pool, setPool] = useState<number | null>(null)
  const [poolLoading, setPoolLoading] = useState(true)

  const statesKey = draft.targeting.states.join(',')
  useEffect(() => {
    setPoolLoading(true)
    const timer = setTimeout(() => {
      getEligiblePoolAction(
        draft.targeting.states.length > 0 ? draft.targeting.states : null,
        draft.targeting.newToBrandOnly ? brandId : null,
        draft.focalProductTaxonomyNodeId
      )
        .then(setPool)
        .catch((err) => console.error('getEligiblePool error:', err))
        .finally(() => setPoolLoading(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [statesKey, draft.targeting.newToBrandOnly, brandId, draft.focalProductTaxonomyNodeId])

  const spotsOpening = Math.round(draft.targetCompletions / EXPECTED_COMPLETION_RATE)
  const feasible = pool === null || spotsOpening <= pool
  const poolLoaded = pool !== null && !poolLoading
  const wouldBlockBrand = poolLoaded && !feasible
  const walletTotal =
    draft.targetCompletions * (draft.payoutPerUserCents + draft.doughFeeCents) + PLATFORM_FEE_CENTS

  useEffect(() => {
    if (allowPoolOverride) {
      onReadyChange(poolLoaded)
    } else {
      onReadyChange(poolLoaded && feasible)
    }
  }, [feasible, poolLoaded, onReadyChange, allowPoolOverride])

  function handleStateKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = stateInput.trim().toUpperCase()
      if (val && !draft.targeting.states.includes(val)) {
        dispatch({ type: 'PATCH_TARGETING', patch: { states: [...draft.targeting.states, val] } })
      }
      setStateInput('')
    } else if (e.key === 'Backspace' && !stateInput && draft.targeting.states.length > 0) {
      dispatch({ type: 'PATCH_TARGETING', patch: { states: draft.targeting.states.slice(0, -1) } })
    }
  }

  type PoolState = 'loading' | 'healthy' | 'thin' | 'tooSmall'
  const poolState: PoolState =
    poolLoading || pool === null ? 'loading' : pool >= 120 ? 'healthy' : pool >= 60 ? 'thin' : 'tooSmall'

  const poolColor: Record<PoolState, string> = {
    loading: 'var(--ink-30)',
    healthy: 'var(--sage)',
    thin: 'var(--amber)',
    tooSmall: 'var(--red)',
  }
  const poolBg: Record<PoolState, string> = {
    loading: 'var(--surface-1)',
    healthy: 'var(--sage-pale)',
    thin: 'var(--amber-pale)',
    tooSmall: 'var(--red-pale)',
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>
          Targeting & size
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          Narrow the eligible user pool, then set how many completions you need.
        </p>
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--ink-50)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          States {/* TODO: replace with state enum */}
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', background: 'var(--white)', border: '1px solid var(--ink-10)', borderRadius: 'var(--r-md)', minHeight: 44, alignItems: 'center' }}>
          {draft.targeting.states.map((s) => (
            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--sage-pale)', color: 'var(--sage)', fontSize: 12, fontWeight: 500, padding: '2px 8px 2px 10px', borderRadius: 20 }}>
              {s}
              <button onClick={() => dispatch({ type: 'PATCH_TARGETING', patch: { states: draft.targeting.states.filter((x) => x !== s) } })} style={{ lineHeight: 1, fontSize: 14, color: 'var(--sage)', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>×</button>
            </span>
          ))}
          <input value={stateInput} onChange={(e) => setStateInput(e.target.value)} onKeyDown={handleStateKeyDown} placeholder={draft.targeting.states.length === 0 ? 'Type state code + Enter (e.g. CA)' : ''} style={{ flex: 1, minWidth: 200, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--ink)', fontFamily: 'var(--font-sans)' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 4 }}>Leave empty to include all states.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        <ToggleRow label="New to brand only" description="Only invite users who haven't chosen your brand in Dough before." checked={draft.targeting.newToBrandOnly} onChange={(v) => dispatch({ type: 'PATCH_TARGETING', patch: { newToBrandOnly: v } })} />
        <ToggleRow label="Recent purchase only" description="Restrict to users who've purchased this category recently." checked={draft.targeting.recentPurchaseOnly} onChange={(v) => dispatch({ type: 'PATCH_TARGETING', patch: { recentPurchaseOnly: v } })} note="// TODO: no backend filter yet" />
      </div>

      <div style={{ marginBottom: 28, padding: '16px 18px', background: poolBg[poolState], borderRadius: 'var(--r-md)', border: `1px solid ${poolColor[poolState]}33` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
          <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-serif)', color: poolColor[poolState], lineHeight: 1 }}>
            {poolLoading || pool === null ? '…' : pool.toLocaleString()}
          </div>
          <div style={{ fontSize: 13, color: poolColor[poolState], fontWeight: 500 }}>
            {poolState === 'loading' ? 'checking pool' : 'eligible users'}
          </div>
        </div>
        {poolState === 'healthy' && <p style={{ fontSize: 12, color: 'var(--sage)', lineHeight: 1.5 }}>Pool is healthy for this study.</p>}
        {poolState === 'thin' && (
          <p style={{ fontSize: 12, color: 'var(--amber)', lineHeight: 1.5 }}>
            Max safely fillable ≈ <strong>{Math.round((pool ?? 0) * EXPECTED_COMPLETION_RATE)}</strong> completions. Consider widening your targeting.
          </p>
        )}
        {poolState === 'tooSmall' && (
          <p style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>
            This number grows as more users join Dough — honest and intentional, not broken. Grow this category before a paid study.
          </p>
        )}
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-50)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Target completions</label>
          <span style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>{draft.targetCompletions}</span>
        </div>
        <input type="range" min={MIN_COMPLETIONS_FLOOR} max={MAX_COMPLETIONS} step={5} value={draft.targetCompletions} onChange={(e) => dispatch({ type: 'PATCH', patch: { targetCompletions: Number(e.target.value) } })} style={{ width: '100%', accentColor: 'var(--sage)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-30)', marginTop: 4 }}>
          <span>{MIN_COMPLETIONS_FLOOR}</span><span>{MAX_COMPLETIONS}</span>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-50)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Payout per user</label>
          <span style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>{formatCents(draft.payoutPerUserCents)}</span>
        </div>
        <input type="range" min={600} max={2000} step={50} value={draft.payoutPerUserCents} onChange={(e) => dispatch({ type: 'PATCH', patch: { payoutPerUserCents: Number(e.target.value) } })} style={{ width: '100%', accentColor: 'var(--sage)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-30)', marginTop: 4 }}>
          <span>$6</span><span>$20</span>
        </div>
      </div>

      <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--r-md)', padding: '18px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Campaign estimate</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-50)' }}>Spots to open</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{spotsOpening.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-50)' }}>Per user ({formatCents(draft.payoutPerUserCents)} + {formatCents(draft.doughFeeCents)} fee)</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{formatCents(draft.payoutPerUserCents + draft.doughFeeCents)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-50)' }}>Platform fee</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{formatCents(PLATFORM_FEE_CENTS)}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--ink-10)', paddingTop: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>Wallet total</span>
            <span style={{ fontSize: 20, color: 'var(--ink)', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>{formatCents(walletTotal)}</span>
          </div>
        </div>
        {!feasible && pool !== null && (
          <div style={{ marginTop: 12, padding: '9px 12px', background: 'var(--red-pale)', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>
            Exceeds pool — reduce target completions or grow the category.
          </div>
        )}
        {allowPoolOverride && wouldBlockBrand && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              background: 'var(--amber-pale)',
              border: '1px solid rgba(192,120,24,0.25)',
              borderRadius: 'var(--r-sm)',
              fontSize: 12,
              color: 'var(--amber)',
              lineHeight: 1.55,
            }}
          >
            <strong>Admin override</strong> — you can proceed for setup and testing. This study is
            under-powered ({pool!.toLocaleString()} eligible vs {draft.targetCompletions.toLocaleString()}{' '}
            target) and cannot complete to target.
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 5 — Questions
// ---------------------------------------------------------------------------

function StepQuestions({ draft, dispatch }: { draft: CampaignDraft; dispatch: React.Dispatch<Action> }) {
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getQuestionTypesAction()
      .then(setQuestionTypes)
      .catch((err) => console.error('getQuestionTypes error:', err))
      .finally(() => setLoading(false))
  }, [])

  const requiredCodes = draft.missionType === 'head_to_head' ? H2H_REQUIRED_QUESTION_CODES : REQUIRED_QUESTION_CODES
  const configurableTypes = questionTypes.filter((qt) => qt.is_brand_configurable)
  const brandQCount = (session: 1 | 2) => draft.questions.filter((q) => q.session_number === session).length
  const judgmentCount = estimateJudgments([...requiredCodes, ...draft.questions.map((q) => q.question_type_code)])

  function addQuestion(qt: QuestionType, session: 1 | 2) {
    if (draft.questions.some((q) => q.question_type_code === qt.code && q.session_number === session)) return
    if (brandQCount(session) >= MAX_BRAND_QUESTIONS_PER_SESSION) return
    dispatch({
      type: 'ADD_QUESTION',
      question: {
        _id: `${qt.code}-s${session}-${Date.now()}`,
        question_type_code: qt.code,
        session_number: session,
        position: brandQCount(session),
        label: null,
        config: {},
        selection_strategy: null,
        selection_config: {},
        is_required: false,
      },
    })
  }

  if (loading) {
    return <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-30)', fontSize: 13 }}>Loading question types…</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>Questions</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          Your study includes a required spine. Add up to {MAX_BRAND_QUESTIONS_PER_SESSION} brand questions per session.
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-30)', marginBottom: 10 }}>Required spine</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {requiredCodes.map((code) => {
            const qt = questionTypes.find((t) => t.code === code)
            return (
              <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--ink-10)', borderRadius: 'var(--r-sm)' }}>
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="1" y="6" width="10" height="8" rx="1.5" stroke="var(--ink-30)" strokeWidth="1.4" />
                  <path d="M3.5 6V4.5a2.5 2.5 0 015 0V6" stroke="var(--ink-30)" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-30)' }}>{qt?.display_name ?? code}</div>
                  {qt?.requires_products && (
                    <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 2 }}>
                      Requires {qt.min_products}–{qt.max_products} product{(qt.max_products ?? 0) > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-30)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 10 }}>
                  S{spineSession(code)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {configurableTypes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-30)', marginBottom: 10 }}>Add brand questions</div>
          {([1, 2] as const).map((session) => {
            const full = brandQCount(session) >= MAX_BRAND_QUESTIONS_PER_SESSION
            return (
              <div key={session} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-50)' }}>Session {session}</span>
                  {full && (
                    <span style={{ fontSize: 11, color: 'var(--amber)', background: 'var(--amber-pale)', padding: '1px 9px', borderRadius: 10 }}>
                      Session {session} is full — remove one to add another
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {configurableTypes.map((qt) => {
                    const alreadyAdded = draft.questions.some((q) => q.question_type_code === qt.code && q.session_number === session)
                    const disabled = full || alreadyAdded
                    return (
                      <div key={qt.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--white)', border: '1px solid var(--ink-10)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: 'var(--ink)' }}>{qt.display_name}</div>
                          {qt.requires_products && (
                            <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 2 }}>
                              Requires {qt.min_products}–{qt.max_products} product{(qt.max_products ?? 0) > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        <button onClick={() => addQuestion(qt, session)} disabled={disabled} style={{ fontSize: 12, fontWeight: 500, padding: '4px 14px', borderRadius: 'var(--r-sm)', border: disabled ? '1px solid var(--ink-10)' : '1px solid var(--sage)', color: disabled ? 'var(--ink-30)' : 'var(--sage)', background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer' }}>
                          {alreadyAdded ? 'Added' : '+ Add'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {draft.questions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-30)', marginBottom: 10 }}>Your added questions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {draft.questions.map((q) => {
              const qt = questionTypes.find((t) => t.code === q.question_type_code)
              return (
                <div key={q._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'var(--sage-pale)', border: '1px solid rgba(62,107,74,0.15)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ flex: 1, fontSize: 13, color: 'var(--ink)' }}>
                    {qt?.display_name ?? q.question_type_code}
                    <span style={{ fontSize: 11, color: 'var(--ink-50)', marginLeft: 8 }}>Session {q.session_number}</span>
                  </div>
                  <button onClick={() => dispatch({ type: 'REMOVE_QUESTION', _id: q._id })} style={{ fontSize: 16, lineHeight: 1, color: 'var(--ink-30)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-1)', borderRadius: 'var(--r-md)' }}>
        <span style={{ fontSize: 13, color: 'var(--ink-50)' }}>~{judgmentCount} total judgments across 2 sessions</span>
        <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>quality indicator</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step — Preview panel (read-only) + one-click publish
// Preview is hypothetical. After publish, show the publish response panel only.
// ---------------------------------------------------------------------------

function formatDollarsFromCents(cents: number | null): string {
  if (cents == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/** Clean competitive set — name, brand, tier. No selection metadata dumps. */
function PanelList({
  panel,
  emptyLabel,
}: {
  panel: PreviewPanelMember[]
  emptyLabel: string
}) {
  if (panel.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--ink-50)' }}>{emptyLabel}</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {panel.map((member) => (
        <div
          key={`${member.position}-${member.product_id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-sm)',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--surface-1)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink-50)',
              flexShrink: 0,
            }}
          >
            {member.position}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
              {member.product}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 2 }}>
              {member.brand}
              {member.price_tier ? ` · ${member.price_tier}` : ''}
            </div>
          </div>
          {member.curated ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--sage)',
                background: 'var(--sage-pale)',
                padding: '4px 8px',
                borderRadius: 999,
                flexShrink: 0,
              }}
            >
              Curated
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function StepPreviewPublish({
  draft,
  dispatch,
  brandId,
  authUid,
  operatorMode,
  mode,
  onReadyChange,
  initialPreview = null,
  onPreviewCached,
}: {
  draft: CampaignDraft
  dispatch: React.Dispatch<Action>
  brandId: number
  authUid: string
  operatorMode: boolean
  mode: 'preview' | 'completions'
  onReadyChange?: (ready: boolean) => void
  /** Cached feasibility from the Preview step — skip re-fetch when present. */
  initialPreview?: PreviewMissionFeasibility | null
  onPreviewCached?: (preview: PreviewMissionFeasibility | null) => void
}) {
  const [preview, setPreview] = useState<PreviewMissionFeasibility | null>(initialPreview)
  const [previewLoading, setPreviewLoading] = useState(initialPreview == null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [publishedPanel, setPublishedPanel] = useState<PreviewPanelMember[] | null>(null)
  const [publishedMissionId, setPublishedMissionId] = useState<string | null>(null)
  const [publishedPanelSize, setPublishedPanelSize] = useState<number | null>(null)
  const [completionsInput, setCompletionsInput] = useState(
    String(draft.targetCompletions || TEMPLATE_DEFAULT_COMPLETIONS)
  )

  const templateId = draft.missionTemplateId
  const focalId = draft.focalProductId ? parseInt(draft.focalProductId, 10) : NaN
  const nodeId = draft.focalProductTaxonomyNodeId
  const minCompletions = minTemplateCompletions()

  useEffect(() => {
    if (initialPreview) {
      setPreview(initialPreview)
      setPreviewLoading(false)
      setPreviewError(null)
      onReadyChange?.(initialPreview.runnable === true)
      return
    }

    if (!templateId || !Number.isFinite(focalId)) {
      setPreviewLoading(false)
      setPreviewError('Pick a study type and focal product first.')
      onReadyChange?.(false)
      onPreviewCached?.(null)
      return
    }

    let cancelled = false
    setPreviewLoading(true)
    setPreviewError(null)
    previewMissionFeasibilityAction(focalId, templateId)
      .then((result) => {
        if (cancelled) return
        if (!result.ok) {
          setPreview(null)
          setPreviewError(result.error)
          onReadyChange?.(false)
          onPreviewCached?.(null)
          return
        }
        setPreview(result.preview)
        setPreviewError(null)
        onReadyChange?.(result.preview.runnable === true)
        onPreviewCached?.(result.preview)
      })
      .catch((err) => {
        if (cancelled) return
        setPreview(null)
        setPreviewError(err instanceof Error ? err.message : 'Preview failed')
        onReadyChange?.(false)
        onPreviewCached?.(null)
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [templateId, focalId, onReadyChange, initialPreview, onPreviewCached])

  useEffect(() => {
    setCompletionsInput(String(draft.targetCompletions || TEMPLATE_DEFAULT_COMPLETIONS))
  }, [draft.targetCompletions])

  const parsedCompletions = (() => {
    const n = parseInt(completionsInput, 10)
    return Number.isFinite(n) ? n : NaN
  })()
  const completionsValid =
    Number.isFinite(parsedCompletions) &&
    parsedCompletions >= minCompletions &&
    parsedCompletions <= MAX_COMPLETIONS

  function commitCompletions(raw: string) {
    setCompletionsInput(raw)
    const n = parseInt(raw, 10)
    if (!Number.isFinite(n)) return
    const clamped = Math.min(MAX_COMPLETIONS, Math.max(minCompletions, n))
    dispatch({ type: 'PATCH', patch: { targetCompletions: clamped } })
  }

  async function mintCampaignIfNeeded(): Promise<string | null> {
    if (draft.campaignId) return draft.campaignId
    if (!draft.missionType || !Number.isFinite(focalId) || !nodeId) return null

    if (operatorMode) {
      const result = await commissionCampaignDraftAction(
        brandId,
        draft.missionType,
        focalId,
        nodeId
      )
      if (!result.ok) {
        setActionError(result.error)
        return null
      }
      if (result.missionId) {
        console.warn(
          '[StepPreviewPublish] create returned mission_id; expected null (campaign-only mint)'
        )
      }
      dispatch({
        type: 'PATCH',
        patch: {
          campaignId: result.campaignId,
          missionId: result.missionId,
          protocolId: result.protocolId,
        },
      })
      return result.campaignId
    }

    const ids = await createCampaignDraftAction(
      brandId,
      authUid,
      draft.missionType,
      focalId,
      nodeId
    )
    if (ids.missionId) {
      console.warn(
        '[StepPreviewPublish] create returned mission_id; expected null (campaign-only mint)'
      )
    }
    dispatch({ type: 'PATCH', patch: ids })
    return ids.campaignId
  }

  /** One CTA: create campaign (if needed) then publish. Retry skips re-mint. */
  async function handlePublishStudy() {
    if (!templateId || !Number.isFinite(focalId) || !nodeId) return
    if (!completionsValid) {
      setActionError(
        ENFORCE_TEMPLATE_COMPLETIONS_FLOOR
          ? `Enter at least ${TEMPLATE_COMPLETIONS_SOFT_FLOOR} completions.`
          : 'Enter at least 1 completion.'
      )
      return
    }
    setPublishing(true)
    setActionError(null)
    try {
      const campaignId = await mintCampaignIfNeeded()
      if (!campaignId) return

      const targetCompletions = parsedCompletions
      dispatch({ type: 'PATCH', patch: { targetCompletions } })

      const result = await publishMissionFromTemplateAction({
        brandCampaignId: campaignId,
        createdBy: authUid,
        focalProductId: focalId,
        nodeId,
        templateId,
        titleOverride: draft.focalProductName
          ? `${draft.focalProductName} study`
          : undefined,
        targetCompletions,
      })
      if (!result.ok) {
        setActionError(result.error)
        return
      }
      setPreview(null)
      setPublishedPanel(result.result.panel)
      setPublishedPanelSize(result.result.panel_size)
      setPublishedMissionId(result.result.mission_id)
      dispatch({
        type: 'PATCH',
        patch: { missionId: result.result.mission_id },
      })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  if (previewLoading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-30)', fontSize: 13 }}>
        Checking whether this category can support a study…
      </div>
    )
  }

  if (publishedMissionId && mode === 'completions') {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>
            Study published
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
            The protocol is locked. This is your frozen competitive set — not the earlier example.
          </p>
        </div>
        <div
          style={{
            padding: '14px 16px',
            background: 'var(--sage-pale)',
            border: '1px solid rgba(62,107,74,0.2)',
            borderRadius: 'var(--r-md)',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--ink)',
          }}
        >
          Locked · {publishedPanelSize ?? publishedPanel?.length ?? 0} products
          {draft.targetCompletions
            ? ` · ${draft.targetCompletions} completions commissioned`
            : ''}
        </div>
        <div style={{ marginBottom: 10, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-30)' }}>
          Your locked panel
        </div>
        <PanelList panel={publishedPanel ?? []} emptyLabel="No panel members returned." />
        <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Link
            href={`/ihut/${publishedMissionId}/report`}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'white',
              background: 'var(--sage)',
              borderRadius: 'var(--r-sm)',
              padding: '10px 18px',
              textDecoration: 'none',
            }}
          >
            View report
          </Link>
          <button
            type="button"
            onClick={() => {
              setPublishedMissionId(null)
              setPublishedPanel(null)
              setPublishedPanelSize(null)
              setActionError(null)
              if (templateId && Number.isFinite(focalId)) {
                setPreviewLoading(true)
                previewMissionFeasibilityAction(focalId, templateId)
                  .then((result) => {
                    if (!result.ok) {
                      setPreview(null)
                      setPreviewError(result.error)
                      return
                    }
                    setPreview(result.preview)
                    setPreviewError(null)
                  })
                  .finally(() => setPreviewLoading(false))
              }
            }}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--ink)',
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-sm)',
              padding: '10px 18px',
              cursor: 'pointer',
            }}
          >
            Add another study to this campaign
          </button>
          <Link
            href={operatorMode ? '/studies' : '/ihut'}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--ink-50)',
              padding: '10px 18px',
              textDecoration: 'none',
            }}
          >
            Back to studies
          </Link>
        </div>
      </div>
    )
  }

  if (previewError && !preview) {
    return (
      <div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>
          Preview unavailable
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, marginBottom: 16 }}>{previewError}</p>
      </div>
    )
  }

  const runnable = preview?.runnable === true
  const infeasible = preview != null && !preview.runnable
  const addingToExisting = Boolean(draft.campaignId)

  if (mode === 'completions') {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>
            Completions
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
            How many verified completions are you ordering? Dough will close the study when this
            count is reached.
          </p>
        </div>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <span
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-30)',
              marginBottom: 8,
            }}
          >
            Ordered completions
          </span>
          <input
            type="number"
            min={minCompletions}
            max={MAX_COMPLETIONS}
            step={1}
            value={completionsInput}
            onChange={(e) => commitCompletions(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 200,
              fontSize: 22,
              fontFamily: 'var(--font-serif)',
              color: 'var(--ink)',
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-sm)',
              padding: '12px 14px',
            }}
          />
          <span style={{ display: 'block', marginTop: 8, fontSize: 12, color: 'var(--ink-30)' }}>
            Minimum {minCompletions}
            {ENFORCE_TEMPLATE_COMPLETIONS_FLOOR ? '' : ' · enter the number of verified completions you want'}.
          </span>
        </label>

        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: '20px 22px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--ink-50)' }}>Focal product</span>
              <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
                {draft.focalProductName ?? '—'}
              </span>
            </div>
            {preview?.protocol.panel_size_required != null ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ink-50)' }}>Panel size</span>
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
                  {preview.protocol.panel_size_required}
                </span>
              </div>
            ) : null}
            <div
              style={{
                borderTop: '1px solid var(--ink-10)',
                paddingTop: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
                Order quantity
              </span>
              <span
                style={{
                  fontSize: 22,
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 600,
                  color: 'var(--ink)',
                }}
              >
                {completionsValid ? parsedCompletions : '—'}
              </span>
            </div>
          </div>
        </div>

        {actionError ? (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              background: '#FCEDED',
              border: '1px solid rgba(180,60,60,0.25)',
              borderRadius: 'var(--r-sm)',
              fontSize: 13,
              color: '#8B2E2E',
            }}
          >
            {actionError}
          </div>
        ) : null}

        {addingToExisting ? (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              background: 'var(--surface-1)',
              borderRadius: 'var(--r-sm)',
              fontSize: 13,
              color: 'var(--ink-50)',
            }}
          >
            Adding to existing campaign · {draft.campaignId!.slice(0, 8)}…
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handlePublishStudy()}
          disabled={!runnable || !completionsValid || publishing}
          style={{
            width: '100%',
            fontSize: 15,
            fontWeight: 500,
            color: runnable && completionsValid && !publishing ? 'white' : 'var(--ink-30)',
            background:
              runnable && completionsValid && !publishing ? 'var(--sage)' : 'var(--surface-1)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-sm)',
            padding: '14px 20px',
            cursor:
              runnable && completionsValid && !publishing ? 'pointer' : 'not-allowed',
          }}
        >
          {publishing
            ? 'Publishing…'
            : addingToExisting
              ? 'Publish study to this campaign'
              : 'Publish study'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>
          Preview
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          This is exactly what participants will experience. No setup required.
        </p>
      </div>

      {infeasible && preview ? (
        <div
          style={{
            padding: '16px 18px',
            background: 'var(--amber-pale, #FBF3E8)',
            border: '1px solid rgba(192,120,24,0.25)',
            borderRadius: 'var(--r-md)',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--amber, #C07818)', marginBottom: 6 }}>
            Category too thin
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
            {preview.reason === 'PANEL_INFEASIBLE'
              ? 'This category does not have enough competitors for a study yet.'
              : preview.reason}
            {preview.pool.shortfall > 0 ? (
              <span> Shortfall: {preview.pool.shortfall}.</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {runnable && preview ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ padding: '14px 16px', background: 'var(--surface-1)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-30)', marginBottom: 6 }}>
              Price
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--ink)' }}>
              {formatDollarsFromCents(preview.price_cents)}
            </div>
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--surface-1)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-30)', marginBottom: 6 }}>
              Rounds
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--ink)' }}>
              {preview.protocol.scoring_rounds}+{preview.protocol.reliability_repeats}
            </div>
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--surface-1)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-30)', marginBottom: 6 }}>
              Panel
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--ink)' }}>
              {preview.protocol.panel_size_required}
            </div>
          </div>
        </div>
      ) : null}

      {preview?.panel_composition.disclosure ? (
        <p style={{ fontSize: 12, color: 'var(--ink-30)', lineHeight: 1.45, marginBottom: 12 }}>
          {preview.panel_composition.disclosure}
        </p>
      ) : null}

      <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-30)' }}>
        Example competitive set
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.45, marginBottom: 12 }}>
        Finalized when you publish — Dough curates a fair set; publish may differ slightly.
      </p>
      <PanelList
        panel={preview?.panel ?? []}
        emptyLabel={infeasible ? 'Not enough rivals to curate a panel.' : 'No panel members returned.'}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 6 — Review (legacy non-template path; no funding)
// ---------------------------------------------------------------------------

function StepReview({ draft }: { draft: CampaignDraft }) {
  const studyLabel = draft.menuProductKey ?? draft.missionType ?? '—'
  const walletTotal = draft.targetCompletions * (draft.payoutPerUserCents + draft.doughFeeCents) + PLATFORM_FEE_CENTS

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>Review</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          Confirm your study configuration. Publishing from a template is available on the commissioned path.
        </p>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--ink-10)', borderRadius: 'var(--r-md)', padding: '20px 22px', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-50)' }}>Study type</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{studyLabel}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-50)' }}>Focal product</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{draft.focalProductName ?? '—'}</span>
          </div>
          {draft.missionType === 'head_to_head' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--ink-50)' }}>Challengers</span>
              <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{draft.challengerProductIds.length} selected</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-50)' }}>Target completions</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{draft.targetCompletions}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-50)' }}>Payout per user</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{formatCents(draft.payoutPerUserCents)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-50)' }}>Brand questions added</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{draft.questions.length}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--ink-10)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>Estimated total</span>
            <span style={{ fontSize: 22, fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)' }}>{formatCents(walletTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------

interface Props {
  portalUser: PortalUser
  brand: Brand
  isImpersonating?: boolean
  operatorMode?: boolean
  /** Server-validated focal product for operator commission (not from client/URL trust). */
  serverValidatedProduct?: ValidatedCommissionProduct | null
  resumedDraft?: MissionWizardDraft | null
  /** Published mission_templates for the operator mission menu (step 1). */
  missionTemplates?: MissionTemplate[]
}

type WizardInit = {
  resumed: MissionWizardDraft | null
  serverProduct: ValidatedCommissionProduct | null
}

export default function IhutWizardClient({
  portalUser,
  brand,
  isImpersonating = false,
  operatorMode = false,
  serverValidatedProduct = null,
  resumedDraft = null,
  missionTemplates = [],
}: Props) {
  const [draft, dispatch] = useReducer(
    draftReducer,
    { resumed: resumedDraft, serverProduct: serverValidatedProduct },
    (init: WizardInit) => buildInitialDraft(init.resumed, init.serverProduct)
  )
  const [stepIdx, setStepIdx] = useState(() =>
    resumedDraft ? computeResumeStepIndex(buildInitialDraft(resumedDraft, serverValidatedProduct)) : 0
  )
  const [step4Ready, setStep4Ready] = useState(false)
  const [previewReady, setPreviewReady] = useState(false)
  const [savingQuestions, setSavingQuestions] = useState(false)
  const [creatingDraft, setCreatingDraft] = useState(false)

  const steps = buildSteps(draft.missionType, !!draft.missionTemplateId)
  const currentStep = steps[stepIdx]
  const useMissionMenu = currentStep.id === 'study_type'
  const isTemplatePath = !!draft.missionTemplateId

  const handleStep4Ready = useCallback((ready: boolean) => setStep4Ready(ready), [])
  const handlePreviewReady = useCallback((ready: boolean) => setPreviewReady(ready), [])
  const templatePreviewCacheRef = useRef<PreviewMissionFeasibility | null>(null)
  const handlePreviewCached = useCallback((preview: PreviewMissionFeasibility | null) => {
    templatePreviewCacheRef.current = preview
  }, [])
  // Invalidate cached feasibility when template or focal product changes.
  useEffect(() => {
    templatePreviewCacheRef.current = null
    setPreviewReady(false)
  }, [draft.missionTemplateId, draft.focalProductId])
  const allowPoolOverride = portalUser.role === 'dough_admin'

  const onMissionMenuSelect = useCallback((selection: MissionMenuSelection) => {
    dispatch({
      type: 'SET_MISSION',
      missionType: selection.missionType,
      doughFeeCents: selection.doughFeeCents,
      missionTemplateId: selection.missionTemplateId,
      menuProductKey: selection.templateCode,
    })
    if (selection.missionTemplateId) {
      dispatch({
        type: 'PATCH',
        patch: { targetCompletions: TEMPLATE_DEFAULT_COMPLETIONS },
      })
    }
    setStepIdx(1)
  }, [])

  const canContinue = (() => {
    switch (currentStep.id) {
      case 'study_type':
        // Menu advances via card click; footer Continue stays disabled.
        return false
      case 'product':
        return !!draft.focalProductId && !!draft.focalProductTaxonomyNodeId && !creatingDraft
      case 'challengers':
        return draft.challengerProductIds.length >= 1
      case 'targeting':
        return step4Ready
      case 'preview':
        return previewReady
      case 'completions':
        return false
      default:
        return true
    }
  })()

  async function goNext() {
    if (currentStep.id === 'product') {
      if (!draft.focalProductId || !draft.focalProductTaxonomyNodeId || !draft.missionType) return

      // Template path: preview before any campaign mint. Do not create here.
      if (isTemplatePath) {
        setStepIdx((i) => i + 1)
        return
      }

      if (!draft.missionId && !draft.campaignId) {
        setCreatingDraft(true)
        try {
          if (operatorMode) {
            const result = await commissionCampaignDraftAction(
              brand.brand_id,
              draft.missionType,
              parseInt(draft.focalProductId, 10),
              draft.focalProductTaxonomyNodeId
            )
            if (!result.ok) {
              console.error('commissionCampaignDraft error:', result.error)
              return
            }
            dispatch({
              type: 'PATCH',
              patch: {
                campaignId: result.campaignId,
                missionId: result.missionId,
                protocolId: result.protocolId,
              },
            })
          } else {
            const ids = await createCampaignDraftAction(
              brand.brand_id,
              portalUser.auth_uid,
              draft.missionType,
              parseInt(draft.focalProductId, 10),
              draft.focalProductTaxonomyNodeId
            )
            dispatch({ type: 'PATCH', patch: ids })
          }
          setStepIdx((i) => i + 1)
        } catch (err) {
          console.error('createCampaignDraft error:', err)
        } finally {
          setCreatingDraft(false)
        }
        return
      }
    }

    if (currentStep.id === 'questions') {
      if (!draft.protocolId || !draft.missionType) return
      setSavingQuestions(true)
      try {
        const spineRows = buildSpineRows(draft.missionType, draft.protocolId)
        const brandRows: ProtocolQuestionRow[] = draft.questions.map(
          ({ _id: _local, ...rest }) => ({ ...rest, protocol_id: draft.protocolId! })
        )
        await upsertProtocolQuestionsAction(draft.protocolId, [...spineRows, ...brandRows])
        setStepIdx((i) => i + 1)
      } catch (err) {
        console.error('Failed to save questions:', err)
      } finally {
        setSavingQuestions(false)
      }
      return
    }

    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1)
  }

  function goBack() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {operatorMode && (
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--ink-10)', padding: '10px 32px', fontSize: 12, color: 'var(--ink-50)' }}>
          <span style={{ fontWeight: 500, color: 'var(--ink)' }}>Operator mode</span>
          {' · '}Commissioning for {brand.brand_name}. You are not impersonating this brand.
        </div>
      )}
      {isImpersonating && !operatorMode && (
        <div style={{ background: 'var(--amber-pale)', borderBottom: '1px solid rgba(192,120,24,0.2)', padding: '10px 32px', fontSize: 12, color: 'var(--amber)' }}>
          Viewing as {brand.brand_name} — changes here are on behalf of this brand.
        </div>
      )}

      <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--ink-10)', background: 'var(--white)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Link
              href={operatorMode ? '/studies' : '/ihut'}
              style={{ fontSize: 12, color: 'var(--ink-30)', textDecoration: 'none', marginBottom: 6, display: 'inline-block' }}
            >
              {operatorMode ? '← Operator console' : '← All studies'}
            </Link>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-30)', marginBottom: 6 }}>{brand.brand_name}</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)' }}>
              {resumedDraft ? 'Continue setup' : operatorMode ? 'Commission a study' : 'Launch an IHUT'}
            </h1>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{ width: 200, minWidth: 200, borderRight: '1px solid var(--ink-10)', background: 'var(--white)', padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {steps.map((step, idx) => {
            const isActive = idx === stepIdx
            const isDone = idx < stepIdx
            return (
              <div key={step.id} onClick={() => { if (isDone) setStepIdx(idx) }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-sm)', background: isActive ? 'var(--sage-pale)' : 'transparent', cursor: isDone ? 'pointer' : 'default' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: isActive ? 'var(--sage)' : isDone ? 'var(--sage-pale)' : 'var(--surface-1)', border: isDone ? '1.5px solid var(--sage)' : 'none' }}>
                  {isDone ? (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5L8 1" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? 'white' : 'var(--ink-30)', lineHeight: 1 }}>{idx + 1}</span>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--sage)' : isDone ? 'var(--ink-50)' : 'var(--ink-30)' }}>{step.label}</span>
              </div>
            )
          })}
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, padding: '32px 36px', maxWidth: useMissionMenu ? 880 : 720 }}>
            {currentStep.id === 'study_type' && (
              <MissionMenuClient templates={missionTemplates} onSelect={onMissionMenuSelect} />
            )}
            {currentStep.id === 'product' && (
              <StepProduct
                draft={draft}
                dispatch={dispatch}
                brandId={brand.brand_id}
                lockProduct={!!serverValidatedProduct}
              />
            )}
            {currentStep.id === 'preview' && (
              <StepPreviewPublish
                draft={draft}
                dispatch={dispatch}
                brandId={brand.brand_id}
                authUid={portalUser.auth_uid}
                operatorMode={operatorMode}
                mode="preview"
                onReadyChange={handlePreviewReady}
                initialPreview={templatePreviewCacheRef.current}
                onPreviewCached={handlePreviewCached}
              />
            )}
            {currentStep.id === 'completions' && (
              <StepPreviewPublish
                draft={draft}
                dispatch={dispatch}
                brandId={brand.brand_id}
                authUid={portalUser.auth_uid}
                operatorMode={operatorMode}
                mode="completions"
                initialPreview={templatePreviewCacheRef.current}
                onPreviewCached={handlePreviewCached}
              />
            )}
            {currentStep.id === 'challengers' && <StepChallengers draft={draft} dispatch={dispatch} brandId={brand.brand_id} />}
            {currentStep.id === 'targeting' && (
              <StepTargeting
                draft={draft}
                dispatch={dispatch}
                brandId={brand.brand_id}
                allowPoolOverride={allowPoolOverride}
                onReadyChange={handleStep4Ready}
              />
            )}
            {currentStep.id === 'questions' && <StepQuestions draft={draft} dispatch={dispatch} />}
            {currentStep.id === 'review' && <StepReview draft={draft} />}
          </div>

          <div style={{ borderTop: '1px solid var(--ink-10)', padding: '16px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--white)' }}>
            <button onClick={goBack} disabled={stepIdx === 0} style={{ fontSize: 13, color: stepIdx === 0 ? 'var(--ink-10)' : 'var(--ink-50)', background: 'transparent', border: 'none', cursor: stepIdx === 0 ? 'default' : 'pointer', padding: '8px 0' }}>
              ← Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>Step {stepIdx + 1} of {steps.length}</span>
              {currentStep.id !== 'completions' ? (
                <button
                  onClick={goNext}
                  disabled={!canContinue || savingQuestions || creatingDraft}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'white',
                    background: canContinue && !savingQuestions && !creatingDraft ? 'var(--sage)' : 'var(--ink-10)',
                    border: 'none',
                    borderRadius: 'var(--r-sm)',
                    padding: '9px 20px',
                    cursor: canContinue && !savingQuestions && !creatingDraft ? 'pointer' : 'not-allowed',
                  }}
                >
                  {creatingDraft ? 'Creating draft…' : savingQuestions ? 'Saving…' : stepIdx === steps.length - 1 ? 'Done' : 'Continue →'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
