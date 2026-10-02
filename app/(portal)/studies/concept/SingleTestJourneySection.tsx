/**
 * Section 2 — single-test journey cards.
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import {
  BATTLE_PROMPT_OPTIONS,
  type BattlePromptCode,
  BRAND_QUESTION_STARTERS,
  type BrandQuestionDraft,
  brandQuestionKind,
  DEFAULT_DECOY_OPTION,
  defaultSuccessBarsDraft,
  emptyBrandQuestion,
  headToHeadWinSentence,
  priceWinSentence,
  type SuccessBarsDraft,
  withBrandQuestionKind,
  withBrandQuestionOptions,
} from '@/lib/concept/singleTest'
import { formatPriceDisplay, normalizeExpectedPrice } from '@/lib/concept/priceBands'
import {
  type PhonePreviewJourney,
} from '@/lib/concept/journey'
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
  open,
  mark = false,
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
  open: boolean
  /** A setting the brand completes. Question rows leave this off. */
  mark?: boolean
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
          className={`cb-acc-head${mark ? ' has-mark' : ''}`}
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
          {mark ? (
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
          ) : null}
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
  const lengthLabel = journeyLengthLabel(journey)

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
      <p style={{ ...sectionHelp, marginBottom: 8 }}>
        They qualify, react to each design, choose, and say why. Then they rank the field and
        name a price. Your questions come after that.
      </p>
      <p className="cb-questions-length">
        {lengthLabel ?? (journeyError ? 'Length unavailable' : 'Building length…')}
      </p>
      {journey?.field_issues.length ? (
        <ul className="cb-length-issues">
          {journey.field_issues.map((c) => (
            <li key={c}>{fieldIssueLabel(c)}</li>
          ))}
        </ul>
      ) : null}
      <div className="cb-questions-tools">
        <button
          type="button"
          className="cb-quiet-action"
          disabled={!canPreview}
          onClick={onPreview}
        >
          Preview
        </button>
        {!canPreview ? (
          <span className="cb-questions-tools-note">Opens when the study is ready to publish.</span>
        ) : null}
        {journeyError && journey ? (
          <span className="cb-questions-tools-note">
            Outline from fixture until live preview is ready.
          </span>
        ) : null}
      </div>

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
                title={
                  brandQuestions.length > 1 ? `Your question ${qi + 1}` : 'Your question'
                }
                line={line}
                countLabel={brandQuestionScreenLabel(brandQuestions.length, counts)}
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
            title="When do you win?"
            line={lineFor('success')}
            countLabel={null}
            mark={journeyStepDone('success', draft)}
            open={openKey === 'success'}
            measures="Set the bar for the report. Shoppers never see these."
            onToggle={() => toggleStep('success')}
            rowRef={bindRow('success')}
          >
            <SuccessBarsEditor
              bars={bars}
              priceLabel={
                formatPriceDisplay(
                  normalizeExpectedPrice(config.expected_price) || config.price_display
                ) || null
              }
              onChange={patchBars}
            />
          </AccordionRow>
        </div>
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
  // Conservative shopper estimate — the live preview minutes run low.
  return `${screens} · ~6 min`
}

function fieldIssueLabel(code: string): string {
  switch (code) {
    case 'FIELD_TOO_SMALL':
      return 'Add more items to the field'
    case 'FIELD_TOO_LARGE':
      return 'Field is too large'
    case 'BENCHMARK_REQUIRED':
    case 'TOO_MANY_BENCHMARKS':
    case 'BENCHMARK_RETIRED':
      return 'This study type no longer uses a benchmark'
    case 'NOTHING_TO_TEST':
    case 'DESIGN_REQUIRED':
      return 'Add at least one design'
    case 'IMAGE_REQUIRED':
      return 'Every design and competitor needs an image.'
    default:
      return code
        .split('_')
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ')
  }
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
  const several = brandQuestionKind(question) === 'pick_several'
  const filled = question.options.map((o) => o.trim()).filter(Boolean)
  const duplicate =
    filled.length >= 2 && new Set(filled.map((o) => o.toLowerCase())).size < filled.length
  const promptLen = question.prompt.trim().length
  const promptHint =
    promptLen > 0 && promptLen < 8
      ? 'Use at least 8 characters.'
      : promptLen > 140
        ? 'Keep it under 140 characters.'
        : null

  function setOptions(options: string[]) {
    onChange(withBrandQuestionOptions(question, options))
  }

  return (
    <div className="cb-bq">
      <div className="cb-bq-block">
        <label style={labelSm} htmlFor={`bq-prompt-${question.localId}`}>
          Question
        </label>
        <input
          id={`bq-prompt-${question.localId}`}
          className="cb-input"
          value={question.prompt}
          placeholder="Ask something shoppers can answer about the designs"
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          style={{ ...inputBase, marginTop: 8 }}
        />
        <div className="cb-bq-starters" aria-label="Question starters">
          {BRAND_QUESTION_STARTERS.map((starter) => {
            const active = question.prompt.trim() === starter
            return (
              <button
                key={starter}
                type="button"
                className={`cb-bq-starter${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => onChange({ ...question, prompt: starter })}
              >
                {starter}
              </button>
            )
          })}
        </div>
        {promptHint ? (
          <p role="alert" className="cb-bq-hint is-error">
            {promptHint}
          </p>
        ) : null}
      </div>

      <div className="cb-bq-block">
        <div style={{ ...labelSm, marginBottom: 8 }}>Answers</div>
        <div className="cb-bq-options">
          {question.options.map((opt, i) => (
            <div className="cb-bq-option" key={i}>
              <span className="cb-bq-option-index" aria-hidden="true">
                {i + 1}
              </span>
              <input
                className="cb-input"
                value={opt}
                placeholder={`Answer ${i + 1}`}
                aria-label={`Answer ${i + 1}`}
                onChange={(e) => {
                  const options = [...question.options]
                  options[i] = e.target.value
                  setOptions(options)
                }}
                style={inputBase}
              />
              {question.options.length > 2 ? (
                <button
                  type="button"
                  className="cb-quiet-action"
                  aria-label={`Remove answer ${i + 1}`}
                  onClick={() => setOptions(question.options.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {duplicate ? (
          <p role="alert" className="cb-bq-hint is-error">
            Each answer needs to be different.
          </p>
        ) : null}
        {question.options.length < 8 ? (
          <button
            type="button"
            className="cb-quiet-action cb-bq-add-answer"
            onClick={() => setOptions([...question.options, ''])}
          >
            Add answer
          </button>
        ) : null}
        <p className="cb-bq-select">
          {several ? 'Shoppers can pick more than one.' : 'Shoppers pick one.'}{' '}
          <button
            type="button"
            className="cb-quiet-action"
            onClick={() =>
              onChange(withBrandQuestionKind(question, several ? 'pick_one' : 'pick_several'))
            }
          >
            {several ? 'Pick one instead' : 'Allow more than one'}
          </button>
        </p>
        <div className="cb-bq-actions">
          <button type="button" className="cb-quiet-action" onClick={onRemove}>
            Remove question
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessBarsEditor({
  bars,
  priceLabel,
  onChange,
}: {
  bars: SuccessBarsDraft
  priceLabel: string | null
  onChange: (b: SuccessBarsDraft) => void
}) {
  return (
    <div className="cb-win">
      <BarRow
        sentence={headToHeadWinSentence(bars.h2h)}
        doughDefault="50%"
        state={bars.h2h}
        onDefault={() => onChange({ ...bars, h2h: { kind: 'default' } })}
        onOff={() => onChange({ ...bars, h2h: { kind: 'off' } })}
        onCustom={(v) => onChange({ ...bars, h2h: { kind: 'custom', value: v } })}
      />
      <BarRow
        sentence={priceWinSentence(bars.price, priceLabel)}
        doughDefault="50%"
        state={bars.price}
        onDefault={() => onChange({ ...bars, price: { kind: 'default' } })}
        onOff={() => onChange({ ...bars, price: { kind: 'off' } })}
        onCustom={(v) => onChange({ ...bars, price: { kind: 'custom', value: v } })}
      />
    </div>
  )
}

function BarRow({
  sentence,
  doughDefault,
  state,
  onDefault,
  onOff,
  onCustom,
}: {
  sentence: string
  doughDefault: string
  state: SuccessBarsDraft['h2h']
  onDefault: () => void
  onOff: () => void
  onCustom: (v: number) => void
}) {
  const value = state.kind === 'custom' ? state.value : 0.5
  const shown =
    state.kind === 'off'
      ? 'Off'
      : state.kind === 'default'
        ? doughDefault
        : `${Math.round(state.value * 100)}%`

  return (
    <div className="cb-win-bar">
      <p className="cb-win-sentence">{sentence}</p>
      <div className="cb-win-bar-controls">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          aria-label={sentence}
          disabled={state.kind === 'off'}
          onChange={(e) => onCustom(Number(e.target.value))}
        />
        <strong className="cb-win-bar-value">{shown}</strong>
        <button type="button" className="cb-quiet-action" onClick={onDefault}>
          Use {doughDefault}
        </button>
        <button type="button" className="cb-quiet-action" onClick={onOff}>
          Off
        </button>
      </div>
    </div>
  )
}
