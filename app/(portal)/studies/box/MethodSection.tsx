'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import type { BoxStudyDraft } from '@/lib/box/types'
import {
  IHUT_BRAND_QUESTION_STARTERS,
  IHUT_DAY1_JOURNEY,
  IHUT_DAY2_JOURNEY,
  IHUT_DEFAULT_ATTRIBUTES,
  IHUT_GENERIC_ATTRIBUTES,
  attributeLabels,
  boxFieldAnswerSeats,
  emptyIhutBrandQuestion,
  ihutBattlePairCount,
  type IhutAttributeCode,
  type IhutBrandQuestionDraft,
  type IhutSuccessBarsDraft,
} from '@/lib/box/method'
import BrandQuestionEditor from '@/components/studies/BrandQuestionEditor'
import {
  brandQuestionTypeLabel,
  syncBrandQuestionFieldOptions,
} from '@/lib/concept/singleTest'
import {
  ihutJourneyLengthLabel,
  type IhutPreviewJourney,
} from '@/lib/box/preview/screensFromIhutJourney'
import { previewIhutJourneyAction } from '@/app/(portal)/studies/box/actions'
import { BOX_ANCHORS } from '@/lib/box/validity'
import { isResolvedBoxSeat } from '@/lib/box/fieldSize'
import { MODULE_LOYALTY, hasLoyaltyModule, resolveBoxSelectedModules } from '@/lib/study/modules'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  sectionDone?: boolean
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

function isBattleStep(id: string): boolean {
  return id === 'shelf_battles' || id === 'taste_battles'
}

export default function MethodSection({
  draft,
  onChange,
  sectionDone = false,
}: Props) {
  const tasteOnly = draft.fieldProducts.some(
    (r) => isResolvedBoxSeat(r) && r.packaging === 'plain_sample'
  )
  const [openId, setOpenId] = useState<string | null>(() =>
    tasteOnly ? 'taste_battles' : 'shelf_battles'
  )
  const [day2OpenId, setDay2OpenId] = useState<string | null>(null)
  const [journey, setJourney] = useState<IhutPreviewJourney | null>(null)
  const [journeyError, setJourneyError] = useState<string | null>(null)

  const seatCount = draft.fieldProducts.filter(isResolvedBoxSeat).length
  const day2On = draft.day2LiveWithIt ?? hasLoyaltyModule(resolveBoxSelectedModules(draft))

  const attrs = draft.ihutAttributes?.length
    ? draft.ihutAttributes
    : IHUT_DEFAULT_ATTRIBUTES
  const bars = draft.ihutSuccessBars ?? {
    tasteWinShare: 0.5,
    likingShare: 0.5,
    buyAtPriceShare: 0.5,
  }
  const brandQs = draft.ihutBrandQuestions ?? []
  const fieldSeats = useMemo(
    () => boxFieldAnswerSeats(draft.fieldProducts),
    [draft.fieldProducts]
  )
  const fieldOptions = useMemo(
    () => fieldSeats.map((s) => s.label),
    [fieldSeats]
  )
  const battlePairs = ihutBattlePairCount(seatCount)

  const day1Steps = useMemo(() => {
    if (!tasteOnly) return IHUT_DAY1_JOURNEY
    return IHUT_DAY1_JOURNEY.filter(
      (s) => !['shelf_battles', 'expectation'].includes(s.id)
    )
  }, [tasteOnly])

  const loadJourney = useCallback(async () => {
    if (seatCount < 2) {
      setJourney(null)
      setJourneyError(null)
      return
    }
    const result = await previewIhutJourneyAction(draft)
    if (result.preview) {
      setJourney(result.preview)
      setJourneyError(result.ok ? null : result.error)
      return
    }
    setJourney(null)
    setJourneyError(result.ok ? null : result.error)
  }, [draft, seatCount])

  useEffect(() => {
    void loadJourney()
  }, [
    seatCount,
    draft.ihutAttributes,
    draft.ihutBrandQuestions,
    draft.ihutSuccessBars,
    draft.day2LiveWithIt,
    draft.fieldProducts,
    loadJourney,
  ])

  // Keep Choose-from-field brand questions aligned with live seats.
  useEffect(() => {
    let changed = false
    const next = brandQs.map((question) => {
      const synced = syncBrandQuestionFieldOptions(question, fieldOptions)
      if (synced !== question) changed = true
      return synced
    })
    if (changed) patchBrandQs(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when field seats change
  }, [fieldOptions])

  const lengthLabel = ihutJourneyLengthLabel(journey)

  function patch(partial: Partial<BoxStudyDraft>) {
    onChange({ ...draft, ...partial })
  }

  function patchBrandQs(next: IhutBrandQuestionDraft[]) {
    patch({ ihutBrandQuestions: next.slice(0, 2) })
  }

  function toggleAttr(code: IhutAttributeCode) {
    const cur = [...attrs]
    const i = cur.indexOf(code)
    if (i >= 0) {
      if (cur.length <= 1) return
      cur.splice(i, 1)
    } else {
      if (cur.length >= 3) return
      cur.push(code)
    }
    patch({ ihutAttributes: cur })
  }

  function setBrandQs(next: IhutBrandQuestionDraft[]) {
    patchBrandQs(next)
  }

  function setBars(next: IhutSuccessBarsDraft) {
    patch({ ihutSuccessBars: next })
  }

  function countLabelFor(stepId: string, editable?: string): string {
    if (editable) return 'Edit'
    if (isBattleStep(stepId) && battlePairs > 0) {
      const fromJourney =
        stepId === 'shelf_battles'
          ? Number(journey?.counts && (journey.counts as { shelf_battles?: number }).shelf_battles)
          : Number(journey?.counts && (journey.counts as { taste_battles?: number }).taste_battles)
      const n = Number.isFinite(fromJourney) && fromJourney > 0 ? fromJourney : battlePairs
      return `${n} matchup${n === 1 ? '' : 's'}`
    }
    return 'Locked'
  }

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.method}
      title="Questions"
      summary={lengthLabel ?? ''}
      done={sectionDone}
    >
      <p style={helpStyle}>
        The Dough in-home method. Two battle tracks on the same scale — shelf
        before opening, taste after — so the report can separate pack from
        recipe. Prompts and order are locked; you pick attributes, optional
        questions, and success bars.
      </p>

      {!lengthLabel ? (
        <p className="cb-questions-length">
          {seatCount < 2
            ? 'Add at least 2 products to see length'
            : journeyError
              ? 'Length unavailable'
              : 'Building length…'}
        </p>
      ) : null}

      {tasteOnly ? (
        <p style={warnStyle} role="status">
          This box will run taste-only — at least one seat is a plain sample, so
          Battles, expectation, and ease of opening are skipped.
        </p>
      ) : null}

      <div className="cb-acc-stack" style={{ marginTop: 8 }}>
        {day1Steps.map((step, index) => {
          const open = openId === step.id
          let line = step.prompt ?? ''
          if (step.id === 'try_each') line = attributeLabels(attrs)
          if (step.id === 'brand_questions') {
            line =
              brandQs.length === 0
                ? 'None yet'
                : brandQs.map((q) => brandQuestionTypeLabel(q)).join(' · ')
          }
          if (step.id === 'success_bars') {
            line = `Taste ${pct(bars.tasteWinShare)} · Liking ${pct(bars.likingShare)} · Buy ${pct(bars.buyAtPriceShare)}`
          }
          if (isBattleStep(step.id) && seatCount >= 2) {
            line = `${step.prompt} · ${battlePairs} matchup${battlePairs === 1 ? '' : 's'}`
          }

          const showFieldAsOptions = isBattleStep(step.id)

          return (
            <section
              key={step.id}
              id={`ihut-step-${step.id}`}
              className={`cb-acc${open ? ' is-open' : ''}`}
            >
              <h3 className="cb-acc-heading">
                <button
                  type="button"
                  className={`cb-acc-head${step.editable ? ' has-mark' : ''}`}
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : step.id)}
                >
                  <span className="cb-acc-index">{index + 1}</span>
                  <span className="cb-acc-main">
                    <span className="cb-acc-title">{step.title}</span>
                    {!open ? <span className="cb-acc-summary">{line}</span> : null}
                  </span>
                  <span className="cb-acc-count">
                    {countLabelFor(step.id, step.editable)}
                  </span>
                  <span className="cb-acc-chevron" aria-hidden="true" />
                </button>
              </h3>
              {open ? (
                <div className="cb-acc-body" role="region">
                  <p className="cb-acc-measures">{step.measures}</p>
                  {step.prompt ? (
                    <div className="cb-acc-asked">
                      <p className="cb-acc-question">{step.prompt}</p>
                      {showFieldAsOptions ? (
                        fieldOptions.length >= 2 ? (
                          <ol className="cb-acc-options">
                            {fieldOptions.map((o) => (
                              <li key={o}>{o}</li>
                            ))}
                          </ol>
                        ) : (
                          <p className="cb-acc-note">
                            Add products to the field to see who battles.
                          </p>
                        )
                      ) : step.options?.length ? (
                        <ol className="cb-acc-options">
                          {step.options.map((o) => (
                            <li key={o}>{o}</li>
                          ))}
                        </ol>
                      ) : null}
                    </div>
                  ) : null}
                  {step.note ? <p className="cb-acc-note">{step.note}</p> : null}

                  {step.editable === 'attributes' ? (
                    <AttributeEditor selected={attrs} onToggle={toggleAttr} />
                  ) : null}
                  {step.editable === 'brand_questions' ? (
                    <IhutBrandQuestionsEditor
                      questions={brandQs}
                      fieldSeats={fieldSeats}
                      fieldOptions={fieldOptions}
                      onChange={setBrandQs}
                    />
                  ) : null}
                  {step.editable === 'success_bars' ? (
                    <SuccessBarsEditor bars={bars} onChange={setBars} />
                  ) : null}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>

      <div
        id={BOX_ANCHORS.sessions}
        style={{
          marginTop: 28,
          padding: '16px 18px',
          border: day2On ? '1px solid var(--sage)' : '1px solid var(--ink-10)',
          background: day2On ? 'var(--sage-soft)' : 'var(--white)',
          borderRadius: 'var(--r-md)',
          maxWidth: 640,
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            margin: 0,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={day2On}
            onChange={(e) => {
              const on = e.target.checked
              patch({
                day2LiveWithIt: on,
                loyaltyFollowUp: on,
                selectedModules: on
                  ? Array.from(
                      new Set([
                        ...draft.selectedModules.filter((m) => m !== MODULE_LOYALTY),
                        MODULE_LOYALTY,
                      ])
                    )
                  : draft.selectedModules.filter((m) => m !== MODULE_LOYALTY),
              })
            }}
            style={{ marginTop: 3, accentColor: 'var(--sage)' }}
          />
          <span>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 600,
                color: day2On ? 'var(--sage-dark)' : 'var(--ink-80)',
              }}
            >
              Day 2: Live with it
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--ink-50)',
                marginTop: 3,
                lineHeight: 1.4,
              }}
            >
              See what they finished, and whether their favorite held. +40% of
              the Day 1 household fee (shipping unchanged).
            </span>
          </span>
        </label>

        {day2On ? (
          <div style={{ marginTop: 14 }}>
            <div style={labelSm}>Hours between sessions</div>
            <input
              className="cb-input"
              inputMode="numeric"
              value={draft.session2IntervalHours}
              onChange={(e) => {
                const n = Number(e.target.value)
                patch({
                  session2IntervalHours: Number.isFinite(n) && n > 0 ? n : 48,
                })
              }}
              style={{ ...inputBase, width: 140 }}
            />
            {draft.session2IntervalHours > 0 && draft.session2IntervalHours < 24 ? (
              <p style={{ ...subHelp, marginTop: 6, color: 'var(--amber-warning)' }}>
                Must be at least 24 hours.
              </p>
            ) : (
              <p style={{ ...subHelp, marginTop: 6 }}>Default 48 hours.</p>
            )}
            <p style={{ ...subHelp, marginTop: 14, marginBottom: 8 }}>
              Locked Day 2 screens — same two-scale story, after they&rsquo;ve lived
              with the products.
            </p>
            <div className="cb-acc-stack">
              {IHUT_DAY2_JOURNEY.filter(
                (s) => !(tasteOnly && s.id === 'pack_after_use')
              ).map((step, index) => {
                const open = day2OpenId === step.id
                return (
                  <section
                    key={step.id}
                    className={`cb-acc${open ? ' is-open' : ''}`}
                  >
                    <h3 className="cb-acc-heading">
                      <button
                        type="button"
                        className="cb-acc-head"
                        aria-expanded={open}
                        onClick={() => setDay2OpenId(open ? null : step.id)}
                      >
                        <span className="cb-acc-index">{index + 1}</span>
                        <span className="cb-acc-main">
                          <span className="cb-acc-title">{step.title}</span>
                          {!open ? (
                            <span className="cb-acc-summary">
                              {step.prompt ?? step.measures}
                            </span>
                          ) : null}
                        </span>
                        <span className="cb-acc-count">Locked</span>
                        <span className="cb-acc-chevron" aria-hidden="true" />
                      </button>
                    </h3>
                    {open ? (
                      <div className="cb-acc-body" role="region">
                        <p className="cb-acc-measures">{step.measures}</p>
                        {step.prompt ? (
                          <div className="cb-acc-asked">
                            <p className="cb-acc-question">{step.prompt}</p>
                            {step.options?.length ? (
                              <ol className="cb-acc-options">
                                {step.options.map((o) => (
                                  <li key={o}>{o}</li>
                                ))}
                              </ol>
                            ) : null}
                          </div>
                        ) : null}
                        {step.note ? (
                          <p className="cb-acc-note">{step.note}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </BuilderSectionChrome>
  )
}

function AttributeEditor({
  selected,
  onToggle,
}: {
  selected: readonly IhutAttributeCode[]
  onToggle: (code: IhutAttributeCode) => void
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <p className="cb-acc-note" style={{ marginBottom: 10 }}>
        Pick 1–3 just-right checks. Dough defaults are preselected.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {IHUT_GENERIC_ATTRIBUTES.map((a) => {
          const on = selected.includes(a.value)
          return (
            <button
              key={a.value}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(a.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--r-sm)',
                border: `1px solid ${on ? 'var(--sage)' : 'var(--ink-10)'}`,
                background: on ? 'var(--sage-soft)' : 'var(--white)',
                fontSize: 13,
                fontWeight: on ? 600 : 500,
                color: on ? 'var(--sage-dark)' : 'var(--ink-80)',
                cursor: 'pointer',
              }}
            >
              {a.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function IhutBrandQuestionsEditor({
  questions,
  fieldSeats,
  fieldOptions,
  onChange,
}: {
  questions: IhutBrandQuestionDraft[]
  fieldSeats: ReturnType<typeof boxFieldAnswerSeats>
  fieldOptions: string[]
  onChange: (next: IhutBrandQuestionDraft[]) => void
}) {
  function patchAt(i: number, next: IhutBrandQuestionDraft) {
    const list = [...questions]
    list[i] = syncBrandQuestionFieldOptions(next, fieldOptions)
    onChange(list)
  }

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {questions.map((q, i) => (
        <BrandQuestionEditor
          key={q.localId}
          question={q}
          index={i}
          fieldSeats={fieldSeats}
          fieldOptions={fieldOptions}
          starters={IHUT_BRAND_QUESTION_STARTERS}
          promptPlaceholder="Ask a closed question about the products in the box"
          onChange={(next) => patchAt(i, next)}
          onRemove={() => onChange(questions.filter((_, j) => j !== i))}
        />
      ))}
      {questions.length < 2 ? (
        <button
          type="button"
          className="cb-quiet-action cb-add-question"
          onClick={() => onChange([...questions, emptyIhutBrandQuestion()])}
        >
          Add a question
        </button>
      ) : null}
    </div>
  )
}

function SuccessBarsEditor({
  bars,
  onChange,
}: {
  bars: IhutSuccessBarsDraft
  onChange: (next: IhutSuccessBarsDraft) => void
}) {
  const rows: {
    key: keyof IhutSuccessBarsDraft
    label: string
    help: string
  }[] = [
    {
      key: 'tasteWinShare',
      label: 'Taste win share',
      help: 'Your product’s win rate in taste battles',
    },
    {
      key: 'likingShare',
      label: 'Top-box liking',
      help: 'Share who rate your product in the top liking boxes',
    },
    {
      key: 'buyAtPriceShare',
      label: 'Buy at shelf price',
      help: 'Share who’d buy your product at the listed price',
    },
  ]

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.map((row) => (
        <label key={row.key} style={{ display: 'block', margin: 0 }}>
          <span style={{ ...labelSm, display: 'block' }}>
            {row.label} · {pct(bars[row.key])}
          </span>
          <input
            type="range"
            min={10}
            max={95}
            step={1}
            value={Math.round(bars[row.key] * 100)}
            onChange={(e) =>
              onChange({
                ...bars,
                [row.key]: Number(e.target.value) / 100,
              })
            }
            style={{ width: '100%', maxWidth: 360, accentColor: 'var(--sage)' }}
          />
          <span style={{ ...subHelp, display: 'block', marginTop: 2 }}>{row.help}</span>
        </label>
      ))}
    </div>
  )
}

const helpStyle: CSSProperties = {
  margin: '0 0 12px',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  lineHeight: 1.45,
  color: 'var(--ink-50)',
  maxWidth: 640,
}

const warnStyle: CSSProperties = {
  margin: '0 0 12px',
  padding: '10px 12px',
  borderRadius: 'var(--r-sm)',
  background: 'var(--amber-soft, #fbf3e3)',
  border: '1px solid rgba(180, 120, 40, 0.25)',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  lineHeight: 1.4,
  color: 'var(--ink-80)',
  maxWidth: 640,
}

const labelSm: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink-50)',
  marginBottom: 6,
}

const subHelp: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: 'var(--ink-50)',
  lineHeight: 1.4,
}

const inputBase: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
}
