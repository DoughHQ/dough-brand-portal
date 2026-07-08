'use client'

import { useReducer, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { PortalUser, Brand, QuestionType, ProtocolQuestionRow, MissionWizardDraft, ValidatedCommissionProduct } from '@/lib/queries'
import type { CampaignDraft, BrandQuestion } from '@/lib/ihut/types'
import {
  STUDY_TYPES,
  MIN_COMPLETIONS_FLOOR,
  MAX_COMPLETIONS,
  DEFAULT_PAYOUT_PER_USER_CENTS,
  EXPECTED_COMPLETION_RATE,
  PLATFORM_FEE_CENTS,
  REQUIRED_QUESTION_CODES,
  H2H_REQUIRED_QUESTION_CODES,
  MAX_BRAND_QUESTIONS_PER_SESSION,
} from '@/lib/ihut/constants'
import {
  getEligiblePoolAction,
  getQuestionTypesAction,
  getFocalProductTaxonomyNodeAction,
  getAllBrandProductsAction,
  searchChallengerProductsAction,
  createCampaignDraftAction,
  upsertProtocolQuestionsAction,
} from './actions'
import { commissionCampaignDraftAction } from '../admin/studies/actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StepId =
  | 'study_type'
  | 'product'
  | 'challengers'
  | 'targeting'
  | 'questions'
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
  | { type: 'SET_MISSION'; missionType: NonNullable<CampaignDraft['missionType']>; doughFeeCents: number }
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
    const fee = STUDY_TYPES.find((s) => s.key === resumed.missionType)?.feeCents ?? 0
    return {
      campaignId: resumed.campaignId,
      missionId: resumed.missionId,
      protocolId: resumed.protocolId,
      missionType: resumed.missionType,
      focalProductId: resumed.focalProductId,
      focalProductTaxonomyNodeId: resumed.focalProductTaxonomyNodeId,
      focalProductName: resumed.focalProductName,
      challengerProductIds: [],
      challengerMethod: null,
      targeting: resumed.targeting,
      targetCompletions: resumed.targetCompletions,
      payoutPerUserCents: resumed.payoutPerUserCents,
      doughFeeCents: fee,
      questions: resumed.questions,
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
  const steps = buildSteps(draft.missionType)
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

function buildSteps(missionType: CampaignDraft['missionType']): Step[] {
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
    { id: 'review', label: 'Review & fund' },
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

function StepStudyType({ draft, dispatch }: { draft: CampaignDraft; dispatch: React.Dispatch<Action> }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>
          What kind of study do you need?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
          Each study type unlocks a different set of battle mechanics and delivers a different output.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STUDY_TYPES.map((st) => {
          const selected = draft.missionType === st.key
          return (
            <button
              key={st.key}
              onClick={() => dispatch({ type: 'SET_MISSION', missionType: st.key, doughFeeCents: st.feeCents })}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: selected ? 'var(--sage-pale)' : 'var(--white)',
                border: selected ? '2px solid var(--sage)' : '2px solid var(--ink-10)',
                borderRadius: 'var(--r-md)',
                padding: '20px 22px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: selected ? 'var(--sage)' : 'var(--ink)' }}>{st.label}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: selected ? 'var(--sage)' : 'var(--ink-50)' }}>
                  {formatCents(st.feeCents)} / completion
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-50)', marginBottom: 8, fontStyle: 'italic' }}>
                &ldquo;{st.question}&rdquo;
              </div>
              <div style={{ fontSize: 12, color: selected ? 'var(--sage)' : 'var(--ink-30)' }}>{st.deliverable}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

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
// Step 6 — Review & fund (placeholder)
// ---------------------------------------------------------------------------

function StepReview({ draft }: { draft: CampaignDraft }) {
  const studyLabel = STUDY_TYPES.find((s) => s.key === draft.missionType)?.label ?? '—'
  const walletTotal = draft.targetCompletions * (draft.payoutPerUserCents + draft.doughFeeCents) + PLATFORM_FEE_CENTS

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>Review & fund</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>Confirm your study configuration before funding.</p>
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
            <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>Wallet total</span>
            <span style={{ fontSize: 22, fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)' }}>{formatCents(walletTotal)}</span>
          </div>
        </div>
      </div>

      <button
        disabled
        style={{
          width: '100%',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--ink-30)',
          background: 'var(--surface-1)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-sm)',
          padding: '12px 20px',
          cursor: 'not-allowed',
        }}
      >
        Fund campaign — Stripe integration coming soon
      </button>
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
  const [savingQuestions, setSavingQuestions] = useState(false)
  const [creatingDraft, setCreatingDraft] = useState(false)

  const steps = buildSteps(draft.missionType)
  const currentStep = steps[stepIdx]

  const handleStep4Ready = useCallback((ready: boolean) => setStep4Ready(ready), [])
  const allowPoolOverride = portalUser.role === 'dough_admin'

  const canContinue = (() => {
    switch (currentStep.id) {
      case 'study_type':
        return draft.missionType !== null
      case 'product':
        return !!draft.focalProductId && !!draft.focalProductTaxonomyNodeId && !creatingDraft
      case 'challengers':
        return draft.challengerProductIds.length >= 1
      case 'targeting':
        return step4Ready
      default:
        return true
    }
  })()

  async function goNext() {
    if (currentStep.id === 'product') {
      if (!draft.focalProductId || !draft.focalProductTaxonomyNodeId || !draft.missionType) return
      if (!draft.missionId) {
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
          <div style={{ flex: 1, padding: '32px 36px', maxWidth: 720 }}>
            {currentStep.id === 'study_type' && <StepStudyType draft={draft} dispatch={dispatch} />}
            {currentStep.id === 'product' && (
              <StepProduct
                draft={draft}
                dispatch={dispatch}
                brandId={brand.brand_id}
                lockProduct={!!serverValidatedProduct}
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
                {creatingDraft ? 'Creating draft…' : savingQuestions ? 'Saving…' : stepIdx === steps.length - 1 ? 'Submit' : 'Continue →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
