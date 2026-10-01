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
  groupPhonePreviewScreens,
  phonePreviewOwnership,
  phonePreviewScreenLabel,
  type PhonePreviewJourney,
} from '@/lib/concept/journey'
import { respondentDesignLabel } from '@/lib/concept/designLetters'
import { previewPriceBands } from '@/lib/concept/templateConfig'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'
import {
  customBattlePromptNote,
  firstUnfinishedJourneyStep,
  isJourneyStepId,
  journeyStepCountLabel,
  journeyStepDone,
  journeyStepOwned,
  journeyStepSummary,
  type JourneyStepId,
} from '@/lib/concept/journeyAccordion'
import { ExpectedPriceCard, VerificationCard } from './conceptCards'
import {
  inputBase,
  labelSm,
  sectionCard,
  sectionEyebrow,
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
}

function AccordionRow({
  id,
  index,
  title,
  summary,
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
  summary: string
  countLabel: string | null
  done: boolean
  open: boolean
  measures: string
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
            <span className="cb-acc-summary">{summary}</span>
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
          <p className="cb-acc-measures">{measures}</p>
          {owned ? children : null}
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
}: Props) {
  const config = draft.templateConfig
  const bars = draft.successBars ?? defaultSuccessBarsDraft()
  const [journey, setJourney] = useState<PhonePreviewJourney | null>(null)
  const [journeyError, setJourneyError] = useState<string | null>(null)
  const [decoyHint, setDecoyHint] = useState<string | null>(null)
  const [openId, setOpenId] = useState<JourneyStepId | null>(() =>
    firstUnfinishedJourneyStep(draft)
  )
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

  const bands = previewPriceBands(config)
  const customPrompt = (draft.customBattlePrompt ?? '').trim()
  const usingCustom = customPrompt.length > 0
  const customNote = customBattlePromptNote(draft.customBattlePrompt ?? '')
  const brandQuestions = draft.brandQuestions ?? []
  const counts = journey?.counts ?? null

  function toggleStep(id: JourneyStepId) {
    setOpenId((current) => (current === id ? null : id))
  }

  function openStep(id: JourneyStepId) {
    setOpenId(id)
    requestAnimationFrame(() => {
      rowRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function bindRow(id: JourneyStepId) {
    return (node: HTMLElement | null) => {
      rowRefs.current[id] = node
    }
  }

  return (
    <section style={sectionCard} id={CONCEPT_ANCHORS.questions}>
      <div style={sectionEyebrow}>Section 3 · Questionnaire</div>
      <h2 className="cb-section-title" style={sectionTitle}>
        Respondent journey
      </h2>
      <p style={sectionHelp}>
        Dough&apos;s steps are locked. Yours need your input.
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
          className="cb-acc-list"
          style={{ opacity: disabled ? 0.55 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
        >
          <AccordionRow
            id="screeners"
            index="1"
            title="Screeners"
            summary={journeyStepSummary('screeners', draft)}
            countLabel={journeyStepCountLabel('screeners', counts)}
            done={journeyStepDone('screeners', draft)}
            open={openId === 'screeners'}
            measures="How often they buy is locked. You name at least two real brands, plus a decoy and none of these."
            reportSection="qualification (not scored in the verdict)"
            onToggle={() => toggleStep('screeners')}
            rowRef={bindRow('screeners')}
          >
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
            index="2"
            title="First look"
            summary={journeyStepSummary('first_look', draft)}
            countLabel={journeyStepCountLabel('first_look', counts)}
            done={journeyStepDone('first_look', draft)}
            open={openId === 'first_look'}
            measures="Love it to really don’t like it, once per design. Locked 5-point scale. The order rotates for each respondent."
            reportSection="first_look"
            onToggle={() => toggleStep('first_look')}
            rowRef={bindRow('first_look')}
          />

          <AccordionRow
            id="battles"
            index="3"
            title="Battles"
            summary={journeyStepSummary('battles', draft)}
            countLabel={journeyStepCountLabel('battles', counts)}
            done={journeyStepDone('battles', draft)}
            open={openId === 'battles'}
            measures="A forced choice with your prompt. After some rounds they say why."
            reportSection="head_to_head / stated_vs_chosen"
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
            id="what_matters"
            index="4"
            title="What matters"
            summary={journeyStepSummary('what_matters', draft)}
            countLabel={journeyStepCountLabel('what_matters', counts)}
            done={journeyStepDone('what_matters', draft)}
            open={openId === 'what_matters'}
            measures="Seven packaging items. Each set asks which matters most and which matters least."
            reportSection="what_matters"
            onToggle={() => toggleStep('what_matters')}
            rowRef={bindRow('what_matters')}
          />

          <AccordionRow
            id="rank"
            index="5"
            title="Rank the field"
            summary={journeyStepSummary('rank', draft)}
            countLabel={journeyStepCountLabel('rank', counts)}
            done={journeyStepDone('rank', draft)}
            open={openId === 'rank'}
            measures="They put every item in order, favorite on top."
            reportSection="stated_vs_chosen"
            onToggle={() => toggleStep('rank')}
            rowRef={bindRow('rank')}
          />

          <AccordionRow
            id="price"
            index="6"
            title="Price"
            summary={journeyStepSummary('price', draft)}
            countLabel={journeyStepCountLabel('price', counts)}
            done={journeyStepDone('price', draft)}
            open={openId === 'price'}
            measures="Your expected retail price anchors the bands. Respondents never see that number as a shelf price."
            reportSection="price / verdict.price"
            onToggle={() => toggleStep('price')}
            rowRef={bindRow('price')}
          >
            <ExpectedPriceCard
              config={config}
              patchConfig={patchConfig}
              errorByField={fieldErrors}
              labelOverride="Expected retail price"
              helpOverride="Bands generate from this anchor. Respondents never see your number as a tag."
            />
            {bands.length > 0 ? (
              <p className="cb-acc-note">Bands: {bands.join(' · ')}</p>
            ) : null}
          </AccordionRow>

          <AccordionRow
            id="brand_questions"
            index="7"
            title="Your questions"
            summary={journeyStepSummary('brand_questions', draft)}
            countLabel={journeyStepCountLabel('brand_questions', counts)}
            done={journeyStepDone('brand_questions', draft)}
            open={openId === 'brand_questions'}
            measures="Up to two questions in your words. None is fine. A question needs a prompt and at least two options."
            reportSection="brand_questions"
            onToggle={() => toggleStep('brand_questions')}
            rowRef={bindRow('brand_questions')}
          >
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
            index="8"
            title="Open text"
            summary={journeyStepSummary('open_text', draft)}
            countLabel={journeyStepCountLabel('open_text', counts)}
            done={journeyStepDone('open_text', draft)}
            open={openId === 'open_text'}
            measures="An optional note at the end, in their own words."
            reportSection="open_text"
            onToggle={() => toggleStep('open_text')}
            rowRef={bindRow('open_text')}
          />

          <AccordionRow
            id="success"
            index={null}
            title="What does success look like?"
            summary={journeyStepSummary('success', draft)}
            countLabel={journeyStepCountLabel('success', counts)}
            done={journeyStepDone('success', draft)}
            open={openId === 'success'}
            measures="Clearing bars for head-to-head, liking, and price. Respondents never see this step."
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

          {error ? (
            <p role="alert" className="cb-acc-alert">
              {error}
            </p>
          ) : null}
        </div>

        <aside style={{ position: 'sticky', top: 16 }}>
          <JourneyOutlinePanel
            journey={journey}
            journeyError={journeyError}
            conceptArms={draft.conceptArms}
            openId={openId}
            onOpen={openStep}
          />
        </aside>
      </div>
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

/** Length + order outline — not a device mock of the app. */
function JourneyOutlinePanel({
  journey,
  journeyError,
  conceptArms,
  openId,
  onOpen,
}: {
  journey: PhonePreviewJourney | null
  journeyError: string | null
  conceptArms: ConceptStudyDraft['conceptArms']
  openId: JourneyStepId | null
  onOpen: (id: JourneyStepId) => void
}) {
  const stages = journey ? groupPhonePreviewScreens(journey.screens) : []
  const minutes = journey?.estimated_minutes
  const minuteLabel =
    minutes == null
      ? null
      : minutes.min === minutes.max
        ? `~${minutes.min} min`
        : `~${minutes.min}–${minutes.max} min`

  return (
    <div
      style={{
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-md)',
        padding: 16,
        background: 'var(--surface-1)',
      }}
    >
      <div style={{ ...labelSm, marginBottom: 4 }}>Respondent journey</div>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.4 }}>
        Order and length respondents will see. Preview opens the phone walkthrough.
      </p>

      {journey ? (
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 14,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink-80)',
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderRadius: 999,
              padding: '5px 11px',
            }}
          >
            {minuteLabel ?? 'Length TBD'}
          </span>
          <span
            style={{
              fontSize: 12,
              color: 'var(--ink-50)',
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderRadius: 999,
              padding: '5px 11px',
            }}
          >
            {journey.counts.total_min}–{journey.counts.total_max} screens
          </span>
        </div>
      ) : null}

      {journey?.field_issues.length ? (
        <ul
          style={{
            margin: '0 0 14px',
            padding: '10px 12px',
            listStyle: 'none',
            fontSize: 12,
            color: 'var(--red)',
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-sm)',
          }}
        >
          {journey.field_issues.map((c) => (
            <li key={c} style={{ marginBottom: 4 }}>
              {fieldIssueLabel(c)}
            </li>
          ))}
        </ul>
      ) : null}

      {!journey ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-50)' }}>
          {journeyError ?? 'Building outline…'}
        </p>
      ) : (
        <div style={{ maxHeight: 480, overflowY: 'auto', paddingRight: 2 }}>
          {stages.map((stage) => {
            const ownership = phonePreviewOwnership(stage.screens[0]!.kind)
            const stepId = isJourneyStepId(stage.id) ? stage.id : null
            const current = stepId != null && stepId === openId
            return (
              <div key={stage.id} style={{ marginBottom: 16 }}>
                <div className="cb-outline-stage">
                  {stepId ? (
                    <button
                      type="button"
                      className={`cb-outline-jump${current ? ' is-current' : ''}`}
                      aria-current={current ? 'true' : undefined}
                      onClick={() => onOpen(stepId)}
                    >
                      {stage.title}
                    </button>
                  ) : (
                    <div className="cb-outline-jump">{stage.title}</div>
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: ownership === 'Dough method' ? 'var(--ink-50)' : 'var(--sage)',
                    }}
                  >
                    {ownership}
                  </span>
                </div>
                <ol
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    borderTop: '1px solid var(--ink-10)',
                  }}
                >
                  {stage.screens.map((screen) => {
                    const label = phonePreviewScreenLabel(screen.kind)
                    const subject = screen.subject?.respondent_label
                    const detail =
                      screen.prompt?.trim() ||
                      (typeof screen.count === 'number'
                        ? `${screen.count} battles`
                        : null) ||
                      (typeof screen.sets === 'number' ? `${screen.sets} sets` : null) ||
                      (typeof screen.up_to === 'number'
                        ? `Up to ${screen.up_to}`
                        : null)
                    return (
                      <li
                        key={`${screen.kind}-${screen.index}`}
                        style={{
                          padding: '8px 0',
                          borderBottom: '1px solid var(--ink-10)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--ink-80)',
                          }}
                        >
                          <span style={{ color: 'var(--ink-50)', fontWeight: 500 }}>
                            {screen.index}.
                          </span>{' '}
                          {label}
                          {subject ? (
                            <span style={{ color: 'var(--ink-50)', fontWeight: 500 }}>
                              {' '}
                              · {subject}
                            </span>
                          ) : null}
                        </div>
                        {detail ? (
                          <div
                            style={{
                              marginTop: 2,
                              fontSize: 12,
                              color: 'var(--ink-50)',
                              lineHeight: 1.4,
                            }}
                          >
                            {detail}
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ol>
              </div>
            )
          })}
        </div>
      )}

      <button
        type="button"
        className={`cb-outline-success${openId === 'success' ? ' is-current' : ''}`}
        aria-current={openId === 'success' ? 'true' : undefined}
        onClick={() => onOpen('success')}
      >
        <span>Success bars</span>
        <span>Not shown to respondents</span>
      </button>

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
