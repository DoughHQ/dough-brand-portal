/**
 * Section 2 — single-test journey cards + respondent outline (flag on only).
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import {
  BATTLE_PROMPT_OPTIONS,
  type BattlePromptCode,
  type BrandQuestionDraft,
  DEFAULT_DECOY_OPTION,
  defaultSuccessBarsDraft,
  emptyBrandQuestion,
  type SuccessBarsDraft,
} from '@/lib/concept/singleTest'
import {
  type PhonePreviewJourney,
} from '@/lib/concept/journey'
import { respondentDesignLabel } from '@/lib/concept/designLetters'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'
import {
  brandQuestionClosedLine,
  brandQuestionScreenLabel,
  customBattlePromptNote,
  firstUnfinishedJourneyStep,
  journeyAsked,
  journeyClosedLine,
  journeyStepCountLabel,
  journeyStepDone,
  journeyStepOwned,
  pairedScreenerCountLabel,
  whyFollowupAsked,
  whyFollowupCountLabel,
  type AskedBlock,
  type JourneyClosedLine,
  type JourneyStepId,
} from '@/lib/concept/journeyAccordion'
import { ExpectedPriceCard, VerificationCard } from './conceptCards'
import PackSizeField from './PackSizeField'
import {
  inputBase,
  labelSm,
  sectionCard,
  sectionHelp,
  sectionTitle,
} from './conceptStyles'
import {
  checkConceptDecoyAction,
  previewConceptJourneyAction,
  searchVerificationBrandsAction,
} from './actions'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  disabled?: boolean
  error?: string | null
  canPreview?: boolean
  onPreview?: () => void
}

function ClosedLine({ line }: { line: JourneyClosedLine }) {
  if (line.kind === 'required') {
    return (
      <span className="cb-acc-summary is-required">
        <span className="cb-required-dot" aria-hidden="true" />
        <span className="cb-sr">Required</span>
      </span>
    )
  }
  if (line.kind === 'empty') return <span className="cb-acc-summary" />
  return <span className="cb-acc-summary">{line.text}</span>
}

function AskedList({
  blocks,
  prompt = true,
}: {
  blocks: AskedBlock[]
  /** The header already says the question. The panel then shows only the choices. */
  prompt?: boolean
}) {
  if (blocks.length === 0) return null
  return (
    <div className="cb-acc-asked-list">
      {blocks.map((block, index) => (
        <div className="cb-acc-asked" key={`${block.prompt}-${index}`}>
          {prompt ? <p className="cb-acc-question">{block.prompt}</p> : null}
          {block.items.length > 0 ? (
            <ol className="cb-acc-options">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{item}</li>
              ))}
            </ol>
          ) : null}
          {block.blank ? <div className="cb-acc-blank" /> : null}
          {block.note ? <p className="cb-acc-note">{block.note}</p> : null}
        </div>
      ))}
    </div>
  )
}

const BRAND_QUESTION_CAP = 2

function AccordionRow({
  id,
  index,
  title,
  line,
  countLabel,
  done,
  open,
  owned,
  measures,
  onToggle,
  rowRef,
  children,
}: {
  id: string
  index: string | null
  title: string
  line: JourneyClosedLine
  countLabel: string | null
  done: boolean
  open: boolean
  owned: boolean
  measures?: string
  onToggle: () => void
  rowRef: (node: HTMLElement | null) => void
  children?: React.ReactNode
}) {
  return (
    <section
      id={`journey-step-${id}`}
      ref={rowRef}
      className={`cb-acc${open ? ' is-open' : ''}`}
    >
      <h3 className="cb-acc-heading">
        <button
          type="button"
          className="cb-acc-head"
          aria-expanded={open}
          aria-controls={open ? `journey-step-panel-${id}` : undefined}
          onClick={onToggle}
        >
          <span className="cb-acc-index">{index ?? ''}</span>
          <span className="cb-acc-main">
            <span className="cb-acc-title">{title}</span>
            {open && line.kind === 'question' ? null : <ClosedLine line={line} />}
          </span>
          <span className="cb-acc-count">{countLabel ?? ''}</span>
          {owned && done ? (
            <span className="cb-acc-check" aria-label="Done">
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                <path
                  d="M3.5 8.2 6.4 11 12.5 4.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : (
            <span className="cb-acc-check is-blank" aria-hidden="true" />
          )}
          <span className="cb-acc-chevron" aria-hidden="true" />
        </button>
      </h3>
      {open ? (
        <div className="cb-acc-body" id={`journey-step-panel-${id}`} role="region">
          {measures ? <p className="cb-acc-measures">{measures}</p> : null}
          {children}
        </div>
      ) : null}
    </section>
  )
}

export default function SingleTestJourneySection({
  draft,
  onChange,
  disabled,
  error,
  canPreview = false,
  onPreview,
}: Props) {
  const config = draft.templateConfig
  const bars = draft.successBars ?? defaultSuccessBarsDraft()
  const [journey, setJourney] = useState<PhonePreviewJourney | null>(null)
  const [journeyError, setJourneyError] = useState<string | null>(null)
  const [decoyHint, setDecoyHint] = useState<string | null>(null)
  const [openKey, setOpenKey] = useState<string | null>(() => initialJourneyOpen(draft))
  const rowRefs = useRef<Partial<Record<JourneyStepId, HTMLElement | null>>>({})

  const fieldErrors = useMemo(() => {
    const m = new Map<string, string>()
    return m
  }, [])

  function patchConfig(partial: Partial<typeof config>) {
    onChange({ ...draft, templateConfig: { ...config, ...partial } })
  }

  function patchBars(next: SuccessBarsDraft) {
    onChange({ ...draft, successBars: next })
  }

  const loadJourney = useCallback(async () => {
    const result = await previewConceptJourneyAction(draft)
    if (result.preview) {
      setJourney(result.preview)
      setJourneyError(result.ok ? null : result.error)
      return
    }
    setJourney(null)
    setJourneyError(result.ok ? null : result.error)
  }, [draft])

  useEffect(() => {
    void loadJourney()
  }, [
    draft.taxonomyNodeId,
    draft.templateConfig,
    draft.conceptArms.length,
    draft.products.length,
    draft.battlePromptCode,
    draft.customBattlePrompt,
    draft.brandQuestions,
    loadJourney,
  ])

  useEffect(() => {
    const decoy = config.decoy_option.trim()
    if (decoy.length < 2) {
      setDecoyHint(null)
      return
    }
    const t = setTimeout(() => {
      void checkConceptDecoyAction(decoy).then((r) => {
        if (!r.ok) setDecoyHint(r.reason)
        else setDecoyHint(null)
      })
    }, 400)
    return () => clearTimeout(t)
  }, [config.decoy_option])

  const customPrompt = (draft.customBattlePrompt ?? '').trim()
  const usingCustom = customPrompt.length > 0
  const customNote = customBattlePromptNote(draft.customBattlePrompt ?? '')
  const brandQuestions = draft.brandQuestions ?? []
  const counts = journey?.counts ?? null
  const screens = journey?.screens
  const lineFor = (id: JourneyStepId) => journeyClosedLine(id, draft, screens)
  const askedFor = (id: JourneyStepId) => journeyAsked(id, draft, screens)
  const screenerAsked = askedFor('screeners')
  const howOften = screenerAsked[0]
  const boughtLately = screenerAsked[1]
  const why = whyFollowupAsked(screens)
  const screenerCount = pairedScreenerCountLabel(counts)
  const brandStart = 9

  function toggleStep(id: string) {
    setOpenKey((current) => (current === id ? null : id))
  }

  function addBrandQuestion() {
    if (brandQuestions.length >= BRAND_QUESTION_CAP) return
    const next = emptyBrandQuestion()
    onChange({ ...draft, brandQuestions: [...brandQuestions, next] })
    setOpenKey(`brand-${next.localId}`)
  }

  function bindRow(id: JourneyStepId) {
    return (node: HTMLElement | null) => {
      rowRefs.current[id] = node
    }
  }

  return (
    <section style={sectionCard} id={CONCEPT_ANCHORS.questions}>
      <h2 className="cb-section-title" style={sectionTitle}>
        Questions
      </h2>
      <p style={sectionHelp}>Shoppers answer these, in this order.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div
          style={{ opacity: disabled ? 0.55 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
        >
        <div className="cb-acc-list">
          <AccordionRow
            id="how_often"
            index="1"
            title="How often"
            line={
              howOften
                ? { kind: 'question', text: howOften.prompt }
                : { kind: 'empty' }
            }
            countLabel={screenerCount}
            done={false}
            owned={false}
            open={openKey === 'how_often'}
            onToggle={() => toggleStep('how_often')}
            rowRef={() => {}}
          >
            <AskedList blocks={howOften ? [howOften] : []} />
          </AccordionRow>

          <AccordionRow
            id="screeners"
            index="2"
            title="Bought recently"
            line={lineFor('screeners')}
            countLabel={screenerCount}
            done={journeyStepDone('screeners', draft)}
            owned={journeyStepOwned('screeners')}
            open={openKey === 'screeners'}
            onToggle={() => toggleStep('screeners')}
            rowRef={bindRow('screeners')}
          >
            <AskedList blocks={boughtLately ? [boughtLately] : []} />
            <VerificationCard
              config={config}
              patchConfig={patchConfig}
              errorByField={fieldErrors}
            />
            {!config.decoy_option.trim() ? (
              <button
                type="button"
                className="cb-quiet-action"
                onClick={() => patchConfig({ decoy_option: DEFAULT_DECOY_OPTION })}
              >
                Prefill decoy ({DEFAULT_DECOY_OPTION})
              </button>
            ) : null}
            {decoyHint ? (
              <p role="alert" className="cb-acc-alert">
                Decoy: {decoyHint}
              </p>
            ) : null}
          </AccordionRow>

          <AccordionRow
            id="first_look"
            index="3"
            title="First look"
            line={lineFor('first_look')}
            countLabel={journeyStepCountLabel('first_look', counts)}
            done={false}
            owned={false}
            open={openKey === 'first_look'}
            onToggle={() => toggleStep('first_look')}
            rowRef={bindRow('first_look')}
          >
            <AskedList blocks={askedFor('first_look')} />
          </AccordionRow>

          <AccordionRow
            id="battles"
            index="4"
            title="Battles"
            line={lineFor('battles')}
            countLabel={journeyStepCountLabel('battles', counts)}
            done={journeyStepDone('battles', draft)}
            owned={journeyStepOwned('battles')}
            open={openKey === 'battles'}
            onToggle={() => toggleStep('battles')}
            rowRef={bindRow('battles')}
          >
            <div style={{ ...labelSm, marginBottom: 8 }}>Battle prompt</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BATTLE_PROMPT_OPTIONS.map((opt) => {
                const active =
                  !usingCustom && (draft.battlePromptCode ?? 'CONCEPT_BATTLE_BUY') === opt.code
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...draft,
                        battlePromptCode: opt.code,
                        customBattlePrompt: null,
                      })
                    }
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 'var(--r-sm)',
                      border: `1px solid ${active ? 'var(--sage)' : 'var(--ink-10)'}`,
                      background: active ? 'var(--sage-soft)' : 'var(--white)',
                      cursor: 'pointer',
                      opacity: usingCustom ? 0.45 : 1,
                    }}
                    aria-pressed={active}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-50)' }}>{opt.prompt}</div>
                  </button>
                )
              })}
              <label style={{ ...labelSm, marginTop: 8 }} htmlFor="custom_battle_prompt">
                Write your own
              </label>
              <input
                id="custom_battle_prompt"
                className="cb-input"
                value={draft.customBattlePrompt ?? ''}
                placeholder="Which pack would you reach for?"
                onChange={(e) => {
                  const v = e.target.value
                  onChange({
                    ...draft,
                    customBattlePrompt: v,
                    battlePromptCode: v.trim() ? null : 'CONCEPT_BATTLE_BUY',
                  })
                }}
                style={{
                  ...inputBase,
                  borderColor: usingCustom ? 'var(--sage)' : undefined,
                }}
              />
              {customNote ? (
                <p
                  className="cb-acc-note"
                  style={{ color: customNote.ok ? 'var(--sage)' : 'var(--red)' }}
                >
                  {customNote.message}
                </p>
              ) : null}
            </div>
          </AccordionRow>

          <AccordionRow
            id="why"
            index="5"
            title={why.prompt}
            line={{ kind: 'empty' }}
            countLabel={whyFollowupCountLabel(counts)}
            done={false}
            owned={false}
            open={openKey === 'why'}
            onToggle={() => toggleStep('why')}
            rowRef={() => {}}
          >
            <AskedList blocks={[why]} prompt={false} />
          </AccordionRow>

          <AccordionRow
            id="what_matters"
            index="6"
            title="What matters"
            line={lineFor('what_matters')}
            countLabel={journeyStepCountLabel('what_matters', counts)}
            done={false}
            owned={false}
            open={openKey === 'what_matters'}
            onToggle={() => toggleStep('what_matters')}
            rowRef={bindRow('what_matters')}
          >
            <AskedList blocks={askedFor('what_matters')} />
          </AccordionRow>

          <AccordionRow
            id="rank"
            index="7"
            title="Rank the field"
            line={lineFor('rank')}
            countLabel={journeyStepCountLabel('rank', counts)}
            done={false}
            owned={false}
            open={openKey === 'rank'}
            onToggle={() => toggleStep('rank')}
            rowRef={bindRow('rank')}
          >
            <AskedList blocks={askedFor('rank')} />
          </AccordionRow>

          <AccordionRow
            id="price"
            index="8"
            title="Price"
            line={lineFor('price')}
            countLabel={journeyStepCountLabel('price', counts)}
            done={journeyStepDone('price', draft)}
            owned={journeyStepOwned('price')}
            open={openKey === 'price'}
            onToggle={() => toggleStep('price')}
            rowRef={bindRow('price')}
          >
            <AskedList blocks={askedFor('price')} />
            <PackSizeField draft={draft} onChange={onChange} />
            <ExpectedPriceCard
              config={config}
              patchConfig={patchConfig}
              errorByField={fieldErrors}
              labelOverride="Expected retail price"
              helpOverride="Bands generate from this anchor. Respondents never see your number as a tag."
            />
          </AccordionRow>

          {brandQuestions.map((question, qi) => {
            const rowId = `brand-${question.localId}`
            const line = brandQuestionClosedLine(question)
            return (
              <AccordionRow
                key={question.localId}
                id={rowId}
                index={String(brandStart + qi)}
                title="Your question"
                line={line}
                countLabel={brandQuestionScreenLabel(brandQuestions.length, counts)}
                done={line.kind === 'question'}
                owned
                open={openKey === rowId}
                onToggle={() => toggleStep(rowId)}
                rowRef={() => {}}
              >
                <BrandQuestionEditor
                  question={question}
                  onChange={(next) => {
                    const list = [...brandQuestions]
                    list[qi] = next
                    onChange({ ...draft, brandQuestions: list })
                  }}
                  onRemove={() => {
                    onChange({
                      ...draft,
                      brandQuestions: brandQuestions.filter((item) => item.localId !== question.localId),
                    })
                    setOpenKey((current) => (current === rowId ? null : current))
                  }}
                />
              </AccordionRow>
            )
          })}

          <AddQuestionControl
            count={brandQuestions.length}
            cap={BRAND_QUESTION_CAP}
            onAdd={addBrandQuestion}
          />

          <AccordionRow
            id="open_text"
            index={String(brandStart + brandQuestions.length)}
            title="Open text"
            line={lineFor('open_text')}
            countLabel={journeyStepCountLabel('open_text', counts)}
            done={journeyStepDone('open_text', draft)}
            owned={journeyStepOwned('open_text')}
            open={openKey === 'open_text'}
            onToggle={() => toggleStep('open_text')}
            rowRef={bindRow('open_text')}
          >
            <AskedList blocks={askedFor('open_text')} />
          </AccordionRow>

          {error ? (
            <p role="alert" className="cb-acc-alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="cb-report-block">
          <p className="cb-acc-note">Respondents never see this.</p>
          <AccordionRow
            id="success"
            index={null}
            title="What does success look like?"
            line={lineFor('success')}
            countLabel={null}
            done={journeyStepDone('success', draft)}
            owned={journeyStepOwned('success')}
            open={openKey === 'success'}
            measures="Clearing bars for head-to-head, liking, and price."
            onToggle={() => toggleStep('success')}
            rowRef={bindRow('success')}
          >
            <SuccessBarsEditor
              bars={bars}
              hasCurrentPack={draft.conceptArms.some(
                (a) => a.benchmark_role === 'current_pack'
              )}
              onChange={patchBars}
            />
          </AccordionRow>
        </div>
        </div>

        <aside style={{ position: 'sticky', top: 88 }}>
          <JourneyOutlinePanel
            journey={journey}
            journeyError={journeyError}
            conceptArms={draft.conceptArms}
            canPreview={canPreview}
            onPreview={onPreview}
          />
        </aside>
      </div>
    </section>
  )
}


function initialJourneyOpen(draft: ConceptStudyDraft): string | null {
  const step = firstUnfinishedJourneyStep(draft)
  if (step !== 'brand_questions') return step
  const pending = (draft.brandQuestions ?? []).find(
    (question) => brandQuestionClosedLine(question).kind !== 'question'
  )
  return pending ? `brand-${pending.localId}` : step
}

function AddQuestionControl({
  count,
  cap,
  onAdd,
}: {
  count: number
  cap: number
  onAdd: () => void
}) {
  if (count >= cap) {
    return <p className="cb-question-cap">Two questions.</p>
  }
  return (
    <button type="button" className="cb-quiet-action cb-add-question" onClick={onAdd}>
      Add a question
    </button>
  )
}

function journeyLengthLabel(journey: PhonePreviewJourney | null): string | null {
  if (!journey) return null
  const { total_min, total_max } = journey.counts
  const screens =
    total_min === total_max
      ? `${total_min} ${total_min === 1 ? 'screen' : 'screens'}`
      : `${total_min}–${total_max} screens`
  const minutes = journey.estimated_minutes
  if (!minutes) return screens
  const minuteLabel =
    minutes.min === minutes.max ? `~${minutes.min} min` : `~${minutes.min}–${minutes.max} min`
  return `${screens} · ${minuteLabel}`
}

function fieldIssueLabel(code: string): string {
  switch (code) {
    case 'FIELD_TOO_SMALL':
      return 'Add more items to the field'
    case 'FIELD_TOO_LARGE':
      return 'Field is too large'
    case 'BENCHMARK_REQUIRED':
      return 'Mark a benchmark'
    case 'TOO_MANY_BENCHMARKS':
      return 'Only one benchmark allowed'
    case 'NOTHING_TO_TEST':
      return 'Add a design that isn’t the benchmark'
    case 'IMAGE_REQUIRED':
      return 'Every design and competitor needs an image.'
    default:
      return code
        .split('_')
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ')
  }
}

/** Length and preview. The accordion is the order. */
function JourneyOutlinePanel({
  journey,
  journeyError,
  conceptArms,
  canPreview,
  onPreview,
}: {
  journey: PhonePreviewJourney | null
  journeyError: string | null
  conceptArms: ConceptStudyDraft['conceptArms']
  canPreview: boolean
  onPreview?: () => void
}) {
  const lengthLabel = journeyLengthLabel(journey)

  return (
    <div
      style={{
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-md)',
        padding: 16,
        background: 'var(--surface-1)',
      }}
    >
      <div style={{ ...labelSm, marginBottom: 8 }}>Length</div>
      <p className="cb-length-line">
        {lengthLabel ?? (journeyError ? 'Length unavailable' : 'Building length…')}
      </p>

      {journey?.field_issues.length ? (
        <ul className="cb-length-issues">
          {journey.field_issues.map((c) => (
            <li key={c}>{fieldIssueLabel(c)}</li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className="cb-btn cb-btn-secondary"
        style={{ width: '100%', marginTop: 14 }}
        disabled={!canPreview}
        onClick={onPreview}
      >
        Preview
      </button>
      {!canPreview ? (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.4 }}>
          Opens when the study is ready to publish.
        </p>
      ) : null}

      {journeyError && journey ? (
        <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--ink-30)', lineHeight: 1.4 }}>
          Outline from fixture until live preview is ready.
        </p>
      ) : null}

      {conceptArms.length > 0 ? (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--ink-10)' }}>
          <div style={{ ...labelSm, marginBottom: 6 }}>Respondents see</div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              fontSize: 12,
              color: 'var(--ink-50)',
            }}
          >
            {conceptArms.map((arm, i) => (
              <li
                key={arm.localId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '5px 0',
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {arm.display_name.trim() || 'Untitled'}
                </span>
                <strong style={{ color: 'var(--ink-80)', flexShrink: 0 }}>
                  {respondentDesignLabel(i)}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}


function BrandQuestionEditor({
  question,
  onChange,
  onRemove,
}: {
  question: BrandQuestionDraft
  onChange: (q: BrandQuestionDraft) => void
  onRemove: () => void
}) {
  return (
    <div>
      <input
        className="cb-input"
        value={question.prompt}
        placeholder="Question prompt (8–140 characters)"
        onChange={(e) => onChange({ ...question, prompt: e.target.value })}
        style={{ ...inputBase, marginBottom: 8 }}
      />
      {question.options.map((opt, i) => (
        <input
          key={i}
          className="cb-input"
          value={opt}
          placeholder={`Option ${i + 1}`}
          onChange={(e) => {
            const options = [...question.options]
            options[i] = e.target.value
            onChange({ ...question, options })
          }}
          style={{ ...inputBase, marginBottom: 6 }}
        />
      ))}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {question.options.length < 8 ? (
          <button
            type="button"
            className="cb-quiet-action"
            onClick={() => onChange({ ...question, options: [...question.options, ''] })}
          >
            Add option
          </button>
        ) : null}
        <button type="button" className="cb-quiet-action" onClick={onRemove}>
          Remove question
        </button>
      </div>
    </div>
  )
}

function SuccessBarsEditor({
  bars,
  hasCurrentPack,
  onChange,
}: {
  bars: SuccessBarsDraft
  hasCurrentPack: boolean
  onChange: (b: SuccessBarsDraft) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <BarRow
        label="Head-to-head win share"
        doughDefault="50%"
        state={bars.h2h}
        onDefault={() => onChange({ ...bars, h2h: { kind: 'default' } })}
        onOff={() => onChange({ ...bars, h2h: { kind: 'off' } })}
        onCustom={(v) => onChange({ ...bars, h2h: { kind: 'custom', value: v } })}
        min={0}
        max={1}
        step={0.01}
      />
      <BarRow
        label="Would pay at your price"
        doughDefault="50%"
        state={bars.price}
        onDefault={() => onChange({ ...bars, price: { kind: 'default' } })}
        onOff={() => onChange({ ...bars, price: { kind: 'off' } })}
        onCustom={(v) => onChange({ ...bars, price: { kind: 'custom', value: v } })}
        min={0}
        max={1}
        step={0.01}
      />
      <div>
        <div style={labelSm}>Liking</div>
        <select
          className="cb-input"
          value={
            bars.likingMode.kind === 'custom'
              ? bars.likingMode.value
              : bars.likingMode.kind === 'off'
                ? 'off'
                : 'default'
          }
          onChange={(e) => {
            const v = e.target.value
            if (v === 'default') {
              onChange({ ...bars, likingMode: { kind: 'default' } })
            } else if (v === 'off') {
              onChange({ ...bars, likingMode: { kind: 'off' } })
            } else if (v === 'vs_current_pack' && !hasCurrentPack) {
              onChange({
                ...bars,
                likingMode: { kind: 'custom', value: 'absolute' },
              })
            } else {
              onChange({
                ...bars,
                likingMode: {
                  kind: 'custom',
                  value: v as 'vs_current_pack' | 'absolute' | 'off',
                },
              })
            }
          }}
          style={inputBase}
        >
          <option value="default">Dough default (vs current pack)</option>
          <option value="vs_current_pack" disabled={!hasCurrentPack}>
            vs current pack{!hasCurrentPack ? ' (needs current-pack benchmark)' : ''}
          </option>
          <option value="absolute">Absolute top-two</option>
          <option value="off">Off</option>
        </select>
      </div>
    </div>
  )
}

function BarRow({
  label,
  doughDefault,
  state,
  onDefault,
  onOff,
  onCustom,
  min,
  max,
  step,
}: {
  label: string
  doughDefault: string
  state: SuccessBarsDraft['h2h']
  onDefault: () => void
  onOff: () => void
  onCustom: (v: number) => void
  min: number
  max: number
  step: number
}) {
  const value = state.kind === 'custom' ? state.value : (min + max) / 2
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={labelSm}>{label}</span>
        {state.kind === 'custom' ? (
          <span style={{ fontSize: 11, color: 'var(--ink-50)' }}>
            Dough default: {doughDefault}
          </span>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="cb-quiet-action" onClick={onDefault}>
          Default
        </button>
        <button type="button" className="cb-quiet-action" onClick={onOff}>
          Off
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onCustom(Number(e.target.value))}
        />
        <span style={{ fontSize: 12 }}>
          {state.kind === 'off'
            ? 'Off'
            : state.kind === 'default'
              ? doughDefault
              : `${Math.round(state.value * 100)}%`}
        </span>
      </div>
    </div>
  )
}
