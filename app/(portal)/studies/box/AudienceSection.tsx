'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  audienceSummaryChips,
  hasNarrowAudienceFilters,
} from '@/lib/box/audienceSummary'
import { categoryLevelLoopCopy } from '@/lib/box/categoryLevels'
import {
  boxDraftToQualifierArgs,
  rpcCountBoxQualifiers,
  type CountBoxQualifiersArgs,
  type CountBoxQualifiersResult,
} from '@/lib/box/countQualifiers'
import type { BoxEligibilityDraft, BoxEligibilityTier, BoxStudyDraft } from '@/lib/box/types'
import {
  BOX_BATTLE_INFO_BODY,
  BOX_BATTLE_INFO_TITLE,
  BOX_TRIED_LOOP_BODY,
  BOX_TRIED_LOOP_TITLE,
} from '@/lib/box/constants'
import {
  groupDietaryFlags,
  type DietaryFlagDef,
} from '@/lib/box/dietaryFlags'
import { BOX_ANCHORS, eligibilityTierLabel, isOpenAudience } from '@/lib/box/validity'
import { createClient } from '@/lib/supabase'
import { getTaxonomyNodeAction, type TaxonomyNodeInfo } from '../concept/actions'
import CategoryCombobox from '../concept/CategoryCombobox'
import StateMultiSelect from './StateMultiSelect'

const QUALIFIER_DEBOUNCE_MS = 350

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  error?: string | null
}

const V1_TIERS: BoxEligibilityTier[] = ['any', 'tried', 'not_tried']

/** Integer-only. Decimals would 500 on the RPC's smallint/integer casts. */
function intFromInput(v: string): number | null {
  const t = v.trim()
  if (!t) return null
  if (!/^-?\d+$/.test(t)) return null
  const n = Number(t)
  return Number.isSafeInteger(n) ? n : null
}

export default function AudienceSection({ draft, onChange, error }: Props) {
  const e = draft.eligibility
  const [qualNode, setQualNode] = useState<TaxonomyNodeInfo | null>(null)
  const [barsOpen, setBarsOpen] = useState(e.qualifyingTaxonomyNodeId != null)
  const [narrowOpen, setNarrowOpen] = useState(hasNarrowAudienceFilters(draft))
  const [dietaryOpen, setDietaryOpen] = useState(e.requiredDietaryFlags.length > 0)
  const [dietaryFlags, setDietaryFlags] = useState<DietaryFlagDef[]>([])
  const [dietaryStatus, setDietaryStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  )
  const [qualifierCount, setQualifierCount] =
    useState<CountBoxQualifiersResult | null>(null)
  const [qualifierLoading, setQualifierLoading] = useState(false)

  const dietaryGroups = useMemo(() => groupDietaryFlags(dietaryFlags), [dietaryFlags])
  const dietaryLabels = useMemo(() => {
    const map: Record<string, string> = {}
    for (const d of dietaryFlags) map[d.flag_code] = d.label
    return map
  }, [dietaryFlags])
  const qualifierArgsKey = JSON.stringify(boxDraftToQualifierArgs(draft))
  const summaryChips = useMemo(
    () =>
      audienceSummaryChips(draft, {
        dietaryLabels,
        categoryLabel: qualNode?.node_name_display ?? e.qualifyingNodeLabel,
      }),
    [draft, dietaryLabels, qualNode, e.qualifyingNodeLabel]
  )
  const narrowSet = hasNarrowAudienceFilters(draft)

  useEffect(() => {
    if (narrowSet) setNarrowOpen(true)
  }, [narrowSet])

  useEffect(() => {
    if (e.requiredDietaryFlags.length > 0) setDietaryOpen(true)
  }, [e.requiredDietaryFlags.length])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    void supabase
      .from('dietary_flag_definitions')
      .select('flag_code, label, category, display_order')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('flag_code')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('[box] dietary_flag_definitions', error)
          setDietaryStatus('error')
          return
        }
        setDietaryFlags((data ?? []) as DietaryFlagDef[])
        setDietaryStatus('ready')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const qualifierArgs = JSON.parse(qualifierArgsKey) as CountBoxQualifiersArgs | null
    if (!qualifierArgs) {
      setQualifierCount(null)
      setQualifierLoading(false)
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      setQualifierLoading(true)
      const supabase = createClient()
      void rpcCountBoxQualifiers(supabase, qualifierArgs)
        .then((row) => {
          if (!cancelled) setQualifierCount(row)
        })
        .catch((err) => {
          console.error('[box] count_box_qualifiers', err)
        })
        .finally(() => {
          if (!cancelled) setQualifierLoading(false)
        })
    }, QUALIFIER_DEBOUNCE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [qualifierArgsKey])

  useEffect(() => {
    if (e.qualifyingTaxonomyNodeId == null) {
      setQualNode(null)
      return
    }
    let cancelled = false
    void getTaxonomyNodeAction(e.qualifyingTaxonomyNodeId).then((n) => {
      if (!cancelled) setQualNode(n)
    })
    return () => {
      cancelled = true
    }
  }, [e.qualifyingTaxonomyNodeId])

  function patch(next: Partial<BoxEligibilityDraft>) {
    onChange({ ...draft, eligibility: { ...e, ...next } })
  }

  function toggleDietary(code: string) {
    const on = e.requiredDietaryFlags.includes(code)
    patch({
      requiredDietaryFlags: on
        ? e.requiredDietaryFlags.filter((c) => c !== code)
        : [...e.requiredDietaryFlags, code],
    })
  }

  function closeBarsPanel() {
    setQualNode(null)
    patch({
      qualifyingTaxonomyNodeId: null,
      qualifyingNodeLabel: null,
      minCategoryBattles: null,
      minCategoryTries: null,
      minCategoryLevel: null,
    })
    setBarsOpen(false)
  }

  function openBarsPanel() {
    setBarsOpen(true)
    if (e.qualifyingTaxonomyNodeId == null && draft.taxonomyNodeId != null) {
      patch({ qualifyingTaxonomyNodeId: draft.taxonomyNodeId })
    }
  }

  const caution = qualifierCount?.below_viable_floor === true
  const n = qualifierCount?.qualifying_users
  const countHeadline =
    draft.focalProductId == null
      ? 'Choose a hero product to see who qualifies'
      : n == null
        ? qualifierLoading
          ? 'Estimating…'
          : '—'
        : `~${n.toLocaleString()} people qualify`

  return (
    <section id={BOX_ANCHORS.audience} style={card}>
      <div style={eyebrow}>Section 3 · Audience</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        <h2 className="cb-section-title" style={{ ...titleStyle, margin: 0 }}>
          Who qualifies
        </h2>
        <div
          aria-live="polite"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: caution ? 'var(--amber)' : 'var(--ink-80)',
            opacity: qualifierLoading && n != null ? 0.55 : 1,
            lineHeight: 1.2,
          }}
        >
          {countHeadline}
        </div>
      </div>
      <p style={optionalAffordance}>
        All filters are optional. Leave them blank to let anyone qualify.
      </p>
      {isOpenAudience(draft) ? (
        <div style={openPill}>Open to everyone — no restrictions</div>
      ) : summaryChips.length > 0 ? (
        <div style={chipRow}>
          {summaryChips.map((chip) => (
            <span key={chip} style={summaryChip}>
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      <p style={{ ...subHelp, margin: '0 0 24px', maxWidth: 560 }}>
        Live estimate against current users — grows as more people join
      </p>
      {qualifierCount?.warning ? (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--amber)',
            margin: '-12px 0 24px',
            lineHeight: 1.4,
            maxWidth: 560,
          }}
        >
          {qualifierCount.warning}
        </p>
      ) : null}

      {/* experience tier */}
      <div style={{ marginBottom: 28 }}>
        <div id="box-aud-tier-label" style={labelSm}>
          Experience with the hero product
        </div>
        <div
          role="radiogroup"
          aria-labelledby="box-aud-tier-label"
          style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560 }}
        >
          {V1_TIERS.map((t) => {
            const active = draft.eligibilityTier === t
            return (
              <div
                key={t}
                style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange({ ...draft, eligibilityTier: t })}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    border: active ? '1px solid var(--sage)' : '1px solid var(--ink-10)',
                    background: active ? 'var(--sage-soft)' : 'var(--white)',
                    borderRadius: 'var(--r-sm)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--sage-dark)' : 'var(--ink)',
                  }}
                >
                  {eligibilityTierLabel(t)}
                </button>
                {t === 'tried' ? (
                  <InfoButton
                    title={BOX_TRIED_LOOP_TITLE}
                    body={BOX_TRIED_LOOP_BODY}
                    ariaLabel="What counts as tried?"
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {/* optional demographic / dietary / location */}
      <div id={BOX_ANCHORS.audienceStates} style={{ marginBottom: 28 }}>
        {!narrowOpen ? (
          <button
            type="button"
            className="cb-btn cb-btn-secondary"
            onClick={() => setNarrowOpen(true)}
          >
            + Narrow further
          </button>
        ) : (
          <div
            style={{
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md)',
              padding: 20,
              background: 'var(--cream)',
              maxWidth: 640,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ ...labelSm, marginBottom: 0 }}>Narrow further</div>
              {!narrowSet ? (
                <button
                  type="button"
                  className="cb-quiet-action"
                  onClick={() => {
                    setNarrowOpen(false)
                    setDietaryOpen(false)
                  }}
                >
                  Hide
                </button>
              ) : null}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={labelSm}>Ship-to states</div>
              <p style={{ ...subHelp, marginBottom: 8 }}>
                Leave empty to ship anywhere.
              </p>
              <StateMultiSelect
                selected={e.targetStates}
                onChange={(codes) => patch({ targetStates: codes })}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={labelSm}>Dietary match</div>
              {!dietaryOpen && e.requiredDietaryFlags.length === 0 ? (
                <>
                  <p style={{ ...subHelp, marginBottom: 8 }}>
                    Leave empty for no dietary requirement.
                  </p>
                  <button
                    type="button"
                    className="cb-btn cb-btn-secondary"
                    onClick={() => setDietaryOpen(true)}
                  >
                    + Add dietary match
                  </button>
                </>
              ) : (
                <>
                  <p style={{ ...subHelp, marginBottom: 8 }}>
                    Claimant must match every selected flag. Leave empty for no
                    dietary requirement.
                  </p>
                  {dietaryStatus === 'loading' ? (
                    <p style={subHelp}>Loading dietary flags…</p>
                  ) : null}
                  {dietaryStatus === 'error' ? (
                    <p role="alert" style={{ ...subHelp, color: 'var(--red)' }}>
                      Dietary flags couldn&rsquo;t load. Refresh and try again.
                    </p>
                  ) : null}
                  {dietaryStatus === 'ready'
                    ? dietaryGroups.map((group) => {
                        const allergy = group.category === 'allergy'
                        return (
                          <div
                            key={group.category}
                            style={allergy ? allergyGroup : { marginBottom: 14 }}
                          >
                            <div style={allergy ? allergyHeading : groupHeading}>
                              {group.heading}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {group.flags.map((d) => {
                                const on = e.requiredDietaryFlags.includes(d.flag_code)
                                return (
                                  <button
                                    key={d.flag_code}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => toggleDietary(d.flag_code)}
                                    style={{
                                      border: on
                                        ? '1px solid var(--sage)'
                                        : allergy
                                          ? '1px solid rgba(184, 121, 27, 0.45)'
                                          : '1px solid var(--ink-10)',
                                      background: on ? 'var(--sage-soft)' : 'var(--white)',
                                      color: on ? 'var(--sage-dark)' : 'var(--ink)',
                                      borderRadius: 'var(--cb-radius-pill)',
                                      padding: '8px 14px',
                                      cursor: 'pointer',
                                      fontFamily: 'var(--font-sans)',
                                      fontSize: 13,
                                      fontWeight: on ? 600 : 500,
                                    }}
                                  >
                                    {on ? '✓ ' : ''}
                                    {d.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    : null}
                  {e.requiredDietaryFlags.length === 0 ? (
                    <button
                      type="button"
                      className="cb-quiet-action"
                      onClick={() => setDietaryOpen(false)}
                    >
                      Remove dietary match
                    </button>
                  ) : null}
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={labelSm}>Age range</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    className="cb-input"
                    inputMode="numeric"
                    value={e.minAge ?? ''}
                    onChange={(ev) => patch({ minAge: intFromInput(ev.target.value) })}
                    placeholder="Min"
                    style={{ ...inputBase, width: 90 }}
                  />
                  <span style={{ color: 'var(--ink-30)' }}>–</span>
                  <input
                    className="cb-input"
                    inputMode="numeric"
                    value={e.maxAge ?? ''}
                    onChange={(ev) => patch({ maxAge: intFromInput(ev.target.value) })}
                    placeholder="Max"
                    style={{ ...inputBase, width: 90 }}
                  />
                </div>
                <p style={{ ...subHelp, marginTop: 6 }}>Leave blank for any age.</p>
              </div>
              <div>
                <div style={labelSm}>Minimum account age (days)</div>
                <input
                  className="cb-input"
                  inputMode="numeric"
                  value={e.minAccountAgeDays ?? ''}
                  onChange={(ev) =>
                    patch({ minAccountAgeDays: intFromInput(ev.target.value) })
                  }
                  placeholder="e.g. 14"
                  style={{ ...inputBase, width: 140 }}
                />
                <p style={{ ...subHelp, marginTop: 6, maxWidth: 220 }}>
                  Guards against fresh accounts made just to claim.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* category mastery */}
      <div id={BOX_ANCHORS.audienceCategoryBars}>
        <div style={labelSm}>Category expertise</div>
        <p style={{ ...subHelp, marginBottom: 12, maxWidth: 620 }}>
          Require real experience in a category before someone can claim. Level
          comes from completed product loops — it can&rsquo;t be farmed by
          spamming battles.
        </p>

        {!barsOpen && e.qualifyingTaxonomyNodeId == null ? (
          <button type="button" className="cb-btn cb-btn-secondary" onClick={openBarsPanel}>
            + Add a category requirement
          </button>
        ) : (
          <div
            style={{
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md)',
              padding: 20,
              background: 'var(--cream)',
              maxWidth: 640,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <CategoryCombobox
                selected={qualNode}
                pendingNodeId={qualNode ? null : e.qualifyingTaxonomyNodeId}
                required={false}
                onSelect={(n) => {
                  setQualNode(n)
                  patch({
                    qualifyingTaxonomyNodeId: n.taxonomy_node_id,
                    qualifyingNodeLabel: n.node_name_display,
                  })
                }}
                onClear={closeBarsPanel}
                error={null}
              />
              <p style={{ ...subHelp, marginTop: 6 }}>
                Can be any level — a broad L1/L2 sums breadth across its subcategories,
                an L3 measures depth in one. The category does nothing until you set
                a level or battle bar below.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <BarInput
                label="Min level"
                hint={categoryLevelLoopCopy(
                  e.minCategoryLevel,
                  qualNode?.node_name_display ?? e.qualifyingNodeLabel
                )}
                value={e.minCategoryLevel}
                onChange={(v) => patch({ minCategoryLevel: v, minCategoryTries: null })}
                disabled={e.qualifyingTaxonomyNodeId == null}
              />
              <BarInput
                label="Min battles"
                hint="Leave blank for no engagement bar."
                value={e.minCategoryBattles}
                onChange={(v) => patch({ minCategoryBattles: v })}
                disabled={e.qualifyingTaxonomyNodeId == null}
                info={{
                  title: BOX_BATTLE_INFO_TITLE,
                  body: BOX_BATTLE_INFO_BODY,
                  ariaLabel: 'What is a battle?',
                }}
              />
            </div>

            {e.qualifyingTaxonomyNodeId == null ? (
              <button
                type="button"
                className="cb-quiet-action"
                onClick={() => setBarsOpen(false)}
                style={{ marginTop: 16 }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        )}
      </div>

      {error ? (
        <p role="alert" style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </section>
  )
}

function InfoButton({
  title,
  body,
  ariaLabel,
}: {
  title: string
  body: string
  ariaLabel: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const titleId = `${ariaLabel.replace(/\W+/g, '-').toLowerCase()}-title`

  useEffect(() => {
    if (!open) return
    function onDoc(ev: MouseEvent) {
      if (!rootRef.current?.contains(ev.target as Node)) setOpen(false)
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} style={{ position: 'relative', flexShrink: 0, alignSelf: 'center' }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid var(--ink-10)',
          background: open ? 'var(--sage-soft)' : 'var(--white)',
          color: 'var(--ink-50)',
          cursor: 'pointer',
          fontFamily: 'var(--font-serif)',
          fontSize: 13,
          fontStyle: 'italic',
          fontWeight: 600,
          lineHeight: 1,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        i
      </button>
      {open ? (
        <div
          role="dialog"
          aria-labelledby={titleId}
          style={{
            position: 'absolute',
            zIndex: 20,
            right: 0,
            top: '100%',
            marginTop: 8,
            width: 320,
            maxWidth: 'min(320px, 70vw)',
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--cb-shadow-popover)',
            padding: '12px 14px',
          }}
        >
          <div
            id={titleId}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink-80)',
              marginBottom: 6,
            }}
          >
            {title}
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--ink-80)',
            }}
          >
            {body}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function BarInput({
  label,
  hint,
  value,
  onChange,
  disabled,
  info,
}: {
  label: string
  hint: string
  value: number | null
  onChange: (v: number | null) => void
  disabled?: boolean
  info?: { title: string; body: string; ariaLabel: string }
}) {
  return (
    <div style={{ opacity: disabled ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ ...labelSm, marginBottom: 0 }}>{label}</div>
        {info ? (
          <InfoButton title={info.title} body={info.body} ariaLabel={info.ariaLabel} />
        ) : null}
      </div>
      <input
        className="cb-input"
        inputMode="numeric"
        disabled={disabled}
        value={value ?? ''}
        onChange={(ev) => onChange(intFromInput(ev.target.value))}
        placeholder="—"
        style={{ ...inputBase, width: 110 }}
      />
      <p style={{ ...subHelp, marginTop: 4, maxWidth: 220 }}>{hint}</p>
    </div>
  )
}

const card = {
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-lg)',
  padding: 32,
  marginBottom: 24,
  boxShadow: 'var(--cb-shadow-card)',
}
const eyebrow = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: 'var(--ink-50)',
  marginBottom: 8,
}
const titleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: 26,
  fontWeight: 400,
  letterSpacing: '-0.02em',
  margin: '0 0 8px',
  color: 'var(--ink-80)',
}
const optionalAffordance = {
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--sage-dark)',
  background: 'var(--sage-soft)',
  borderLeft: '3px solid var(--sage)',
  borderRadius: 'var(--r-sm)',
  padding: '8px 12px',
  margin: '0 0 12px',
  lineHeight: 1.4,
  maxWidth: 560,
}
const openPill = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--sage-dark)',
  background: 'var(--sage-soft)',
  border: '1px solid var(--sage)',
  borderRadius: 'var(--cb-radius-pill)',
  padding: '5px 12px',
  margin: '0 0 12px',
}
const chipRow = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 8,
  margin: '0 0 12px',
  maxWidth: 640,
}
const summaryChip = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink-80)',
  background: 'var(--surface-1)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--cb-radius-pill)',
  padding: '5px 12px',
}
const subHelp = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: 'var(--ink-50)',
  margin: 0,
  lineHeight: 1.4,
}
const labelSm = {
  display: 'block' as const,
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 8,
}
const inputBase = {
  boxSizing: 'border-box' as const,
  height: 48,
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-sm)',
  padding: '0 16px',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink)',
  background: 'var(--white)',
  outline: 'none',
}
const groupHeading = {
  fontFamily: 'var(--font-sans)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: 'var(--ink-50)',
  marginBottom: 8,
}
const allergyGroup = {
  marginBottom: 16,
  padding: '12px 14px 14px',
  background: 'var(--white)',
  border: '1px solid rgba(184, 121, 27, 0.35)',
  borderRadius: 'var(--r-md)',
}
const allergyHeading = {
  ...groupHeading,
  color: '#8A5A12',
}
