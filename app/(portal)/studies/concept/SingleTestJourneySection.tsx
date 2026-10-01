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
  customBattlePromptNote,
  firstUnfinishedJourneyStep,
  journeyAsked,
  journeyClosedLine,
  journeyStepCountLabel,
  journeyStepDone,
  journeyStepOwned,
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

function AskedList({ blocks }: { blocks: AskedBlock[] }) {
  if (blocks.length === 0) return null
  return (
    <div className="cb-acc-asked-list">
      {blocks.map((block, index) => (
        <div className="cb-acc-asked" key={`${block.prompt}-${index}`}>
          <p className="cb-acc-question">{block.prompt}</p>
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

function AccordionRow({
  id,
  index,
  title,
  line,
  countLabel,
  done,
  open,
  measures,
  reportSection,
  onToggle,
  rowRef,
  children,
}: {
  id: JourneyStepId
  index: string | null
  title: string
  line: JourneyClosedLine
  countLabel: string | null
  done: boolean
  open: boolean
  measures?: string
  reportSection: string
  onToggle: () => void
  rowRef: (node: HTMLElement | null) => void
  children?: React.ReactNode
}) {
  const owned = journeyStepOwned(id)
  return (
    <section
      id={`journey-step-${id}`}
      ref={rowRef}
      className={`cb-acc${open ? ' is-open' : ''}${owned ? '' : ' is-locked'}`}
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
            <ClosedLine line={line} />
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
          <p className="cb-acc-report">Report → {reportSection}</p>
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
  const [openId, setOpenId] = useState<JourneyStepId | null>(() =>
    firstUnfinishedJourneyStep(draft)
  )
  const [methodOpen, setMethodOpen] = useState(false)
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

  function toggleStep(id: JourneyStepId) {
    setOpenId((current) => (current === id ? null : id))
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
      <p style={sectionHelp}>
        You write the screeners, the battle prompt, the price, and your own questions.
        Dough&apos;s method is locked.
      </p>

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
            id="screeners"
            index="1"
            title="Screeners"
            line={lineFor('screeners')}
            countLabel={journeyStepCountLabel('screeners', counts)}
            done={journeyStepDone('screeners', draft)}
            open={openId === 'screeners'}
            reportSection="qualification (not scored in the verdict)"
            onToggle={() => toggleStep('screeners')}
            rowRef={bindRow('screeners')}
          >
            <AskedList blocks={askedFor('screeners')} />
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
            id="battles"
            index="2"
            title="Battles"
            line={lineFor('battles')}
            countLabel={journeyStepCountLabel('battles', counts)}
            done={journeyStepDone('battles', draft)}
            open={openId === 'battles'}
            reportSection="head_to_head / stated_vs_chosen"
            onToggle={() => toggleStep('battles')}
            rowRef={bindRow('battles')}
          >
            <AskedList blocks={askedFor('battles')} />
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

          <DoughMethodRow
            open={methodOpen}
            countLabel={doughMethodCountLabel(counts)}
            onToggle={() => setMethodOpen((open) => !open)}
            blocks={[
              { title: 'First look', when: 'Before the battles', asked: askedFor('first_look') },
              { title: 'What matters', when: 'After the battles', asked: askedFor('what_matters') },
              { title: 'Rank the field', when: 'After the battles', asked: askedFor('rank') },
            ]}
          />

          <AccordionRow
            id="price"
            index="3"
            title="Price"
            line={lineFor('price')}
            countLabel={journeyStepCountLabel('price', counts)}
            done={journeyStepDone('price', draft)}
            open={openId === 'price'}
            reportSection="price / verdict.price"
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

          <AccordionRow
            id="brand_questions"
            index="4"
            title="Your questions"
            line={lineFor('brand_questions')}
            countLabel={journeyStepCountLabel('brand_questions', counts)}
            done={journeyStepDone('brand_questions', draft)}
            open={openId === 'brand_questions'}
            reportSection="brand_questions"
            onToggle={() => toggleStep('brand_questions')}
            rowRef={bindRow('brand_questions')}
          >
            <AskedList blocks={askedFor('brand_questions')} />
            {brandQuestions.map((q, qi) => (
              <BrandQuestionEditor
                key={q.localId}
                question={q}
                onChange={(next) => {
                  const list = [...brandQuestions]
                  list[qi] = next
                  onChange({ ...draft, brandQuestions: list })
                }}
                onRemove={() =>
                  onChange({
                    ...draft,
                    brandQuestions: brandQuestions.filter((x) => x.localId !== q.localId),
                  })
                }
              />
            ))}
            {brandQuestions.length < 2 ? (
              <button
                type="button"
                className="cb-quiet-action"
                onClick={() =>
                  onChange({
                    ...draft,
                    brandQuestions: [...brandQuestions, emptyBrandQuestion()],
                  })
                }
              >
                Add a question
              </button>
            ) : null}
          </AccordionRow>

          <AccordionRow
            id="open_text"
            index="5"
            title="Open text"
            line={lineFor('open_text')}
            countLabel={journeyStepCountLabel('open_text', counts)}
            done={journeyStepDone('open_text', draft)}
            open={openId === 'open_text'}
            reportSection="open_text"
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
          <p className="cb-report-kicker">Report</p>
          <AccordionRow
            id="success"
            index={null}
            title="What does success look like?"
            line={lineFor('success')}
            countLabel={null}
            done={journeyStepDone('success', draft)}
            open={openId === 'success'}
            measures="Clearing bars for head-to-head, liking, and price. Respondents never see this."
            reportSection="verdict"
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


function doughMethodCountLabel(
  counts: PhonePreviewJourney['counts'] | null
): string | null {
  if (!counts) return null
  const parts = [counts.first_look, counts.maxdiff_sets, counts.rank]
  if (parts.some((n) => typeof n !== 'number' || !Number.isFinite(n))) return null
  const n =
    (counts.first_look ?? 0) + (counts.maxdiff_sets ?? 0) + (counts.rank ?? 0)
  if (n <= 0) return null
  return n === 1 ? '1 screen' : `${n} screens`
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

function DoughMethodRow({
  open,
  countLabel,
  onToggle,
  blocks,
}: {
  open: boolean
  countLabel: string | null
  onToggle: () => void
  blocks: { title: string; when: string; asked: AskedBlock[] }[]
}) {
  return (
    <section
      className={`cb-acc is-locked${open ? ' is-open' : ''}`}
      id="journey-step-dough-method"
    >
      <h3 className="cb-acc-heading">
        <button type="button" className="cb-acc-head" aria-expanded={open} onClick={onToggle}>
          <span className="cb-acc-index" />
          <span className="cb-acc-main">
            <span className="cb-acc-title">Dough&apos;s method</span>
            <span className="cb-acc-summary">Locked</span>
          </span>
          <span className="cb-acc-count">{countLabel ?? ''}</span>
          <span className="cb-acc-check is-blank" aria-hidden="true" />
          <span className="cb-acc-chevron" aria-hidden="true" />
        </button>
      </h3>
      {open ? (
        <div className="cb-acc-body">
          {blocks.map((block) => (
            <div className="cb-method-block" key={block.title}>
              <p className="cb-method-kicker">
                {block.title}
                <span>{block.when}</span>
              </p>
              <AskedList blocks={block.asked} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
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
      return 'Every design and competitor needs an https image'
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
    <div
      style={{
        marginBottom: 12,
        padding: 12,
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-sm)',
      }}
    >
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
