'use client'

import { useState } from 'react'
import type { ConceptQuestionSlot, ConceptStudyDraft } from '@/lib/concept/types'
import { defaultFloor, newScreener } from '@/lib/concept/defaults'
import { formatPriceLabel } from '@/lib/concept/price'
import {
  ghostLink,
  inputBase,
  labelSm,
  sectionCard,
  sectionEyebrow,
  sectionHelp,
  sectionTitle,
  stageCard,
  stageLocked,
  trashBtn,
} from './conceptStyles'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  error?: string | null
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M4 4l.5 7a1 1 0 001 1h3a1 1 0 001-1L10 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StageHeader({
  title,
  meta,
  action,
}: {
  title: string
  meta?: string
  action?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16 }}>{title}</div>
        {meta ? (
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 2 }}>{meta}</div>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function QuestionEditor({
  slot,
  onChange,
  onDelete,
  showQualify,
}: {
  slot: ConceptQuestionSlot
  onChange: (slot: ConceptQuestionSlot) => void
  onDelete?: () => void
  showQualify?: boolean
}) {
  const optionsText = slot.config.options.join('\n')

  return (
    <div
      style={{
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-sm)',
        padding: '12px 12px 10px',
        background: 'var(--white)',
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelSm}>Prompt</label>
          <input
            value={slot.config.prompt}
            onChange={(e) =>
              onChange({
                ...slot,
                config: { ...slot.config, prompt: e.target.value },
              })
            }
            style={inputBase}
          />
        </div>
        {onDelete ? (
          <button
            type="button"
            aria-label="Delete question"
            onClick={onDelete}
            style={{ ...trashBtn, alignSelf: 'flex-end', marginBottom: 2 }}
          >
            <TrashIcon />
          </button>
        ) : null}
      </div>
      <label style={labelSm}>Options · one per line</label>
      <textarea
        value={optionsText}
        onChange={(e) =>
          onChange({
            ...slot,
            config: {
              ...slot.config,
              options: e.target.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            },
          })
        }
        rows={Math.max(3, slot.config.options.length)}
        style={{
          ...inputBase,
          resize: 'vertical',
          lineHeight: 1.4,
          marginBottom: showQualify ? 10 : 0,
        }}
      />
      {showQualify ? (
        <>
          <label style={labelSm}>Qualify if answer is one of (comma-separated)</label>
          <input
            value={
              Array.isArray(slot.config.qualify_rule?.value)
                ? (slot.config.qualify_rule!.value as string[]).join(', ')
                : typeof slot.config.qualify_rule?.value === 'string'
                  ? slot.config.qualify_rule.value
                  : ''
            }
            onChange={(e) => {
              const parts = e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
              onChange({
                ...slot,
                config: {
                  ...slot.config,
                  qualify_rule: parts.length
                    ? { op: 'in', value: parts }
                    : null,
                },
              })
            }}
            placeholder="Weekly or more, Most nights"
            style={inputBase}
          />
        </>
      ) : null}
    </div>
  )
}

export default function QuestionsSection({ draft, onChange, error }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  function addScreener() {
    onChange({ ...draft, screeners: [...draft.screeners, newScreener()] })
  }

  function addDiagnostic() {
    const n = draft.diagnostics.length + 1
    const slot: ConceptQuestionSlot = {
      localId:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `diag_${Date.now()}`,
      question_type_code: 'concept_diagnostic',
      session_number: 1,
      position: n,
      label: `diagnostic_${n}`,
      config: {
        prompt: '',
        options: ['Option A', 'Option B', 'Not sure'],
        min_select: 1,
        max_select: 1,
      },
      is_required: true,
      drives_rounds: false,
    }
    onChange({ ...draft, diagnostics: [...draft.diagnostics, slot] })
  }

  const leader = draft.conceptArms[0]
  const floor =
    draft.floor ??
    defaultFloor(
      leader?.display_name || 'this',
      formatPriceLabel(leader?.frozen_price)
    )

  return (
    <section style={sectionCard} id="concept-questions">
      <div style={sectionEyebrow}>Section 2</div>
      <h2 style={sectionTitle}>Questions</h2>
      <p style={sectionHelp}>
        Respondent order is fixed: Screener → Battles → Diagnostics → Floor → Drift.
        Options live in each question&apos;s config — never in answer_sets.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={labelSm}>Sessions</div>
          <div
            role="group"
            style={{
              display: 'inline-flex',
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-sm)',
              overflow: 'hidden',
            }}
          >
            {([1, 2] as const).map((n) => {
              const active = draft.sessionCount === n
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ ...draft, sessionCount: n })}
                  style={{
                    border: 'none',
                    borderRight: n === 1 ? '1px solid var(--ink-10)' : 'none',
                    background: active ? 'var(--sage)' : 'var(--white)',
                    color: active ? 'var(--white)' : 'var(--ink-50)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </div>
        {draft.sessionCount === 2 ? (
          <div>
            <label style={labelSm} htmlFor="s2-interval">
              Session-2 wait (hours, min 12)
            </label>
            <input
              id="s2-interval"
              type="number"
              min={12}
              value={draft.session2IntervalHours}
              onChange={(e) =>
                onChange({
                  ...draft,
                  session2IntervalHours: Math.max(12, Number(e.target.value) || 12),
                })
              }
              style={{ ...inputBase, width: 120 }}
            />
          </div>
        ) : null}
      </div>

      {/* Screener */}
      <div style={stageCard}>
        <StageHeader
          title="Screener"
          meta="Optional · 0…N"
          action={
            <button type="button" onClick={addScreener} style={ghostLink}>
              + Add screener
            </button>
          }
        />
        {draft.screeners.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-30)' }}>
            No screener — everyone who claims can enter battles.
          </p>
        ) : (
          draft.screeners.map((s) => (
            <QuestionEditor
              key={s.localId}
              slot={s}
              showQualify
              onChange={(next) =>
                onChange({
                  ...draft,
                  screeners: draft.screeners.map((x) =>
                    x.localId === s.localId ? next : x
                  ),
                })
              }
              onDelete={() =>
                onChange({
                  ...draft,
                  screeners: draft.screeners.filter((x) => x.localId !== s.localId),
                })
              }
            />
          ))
        )}
      </div>

      {/* Battles — locked */}
      <div style={stageLocked}>
        <StageHeader
          title="Battles"
          meta="Locked · drives rounds"
          action={
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--amber)',
              }}
            >
              Fixed
            </span>
          }
        />
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-50)' }}>
          {draft.scoringRounds} rounds · A wins / B wins / neither / skip
        </p>
        <label style={labelSm} htmlFor="scoring-rounds">
          Scoring rounds (1–10)
        </label>
        <input
          id="scoring-rounds"
          type="number"
          min={1}
          max={10}
          value={draft.scoringRounds}
          onChange={(e) => {
            const n = Math.min(10, Math.max(1, Number(e.target.value) || 1))
            onChange({ ...draft, scoringRounds: n })
          }}
          style={{ ...inputBase, width: 100 }}
        />
      </div>

      {/* Diagnostics */}
      <div style={stageCard}>
        <StageHeader
          title="Diagnostics"
          meta="After battles · keep options neutral"
          action={
            <button type="button" onClick={addDiagnostic} style={ghostLink}>
              + Add diagnostic
            </button>
          }
        />
        {draft.diagnostics.map((d) => (
          <QuestionEditor
            key={d.localId}
            slot={d}
            onChange={(next) =>
              onChange({
                ...draft,
                diagnostics: draft.diagnostics.map((x) =>
                  x.localId === d.localId ? next : x
                ),
              })
            }
            onDelete={() =>
              onChange({
                ...draft,
                diagnostics: draft.diagnostics.filter((x) => x.localId !== d.localId),
              })
            }
          />
        ))}
      </div>

      {/* Floor */}
      <div style={stageCard}>
        <StageHeader title="Floor" meta="Purchase intent · 0…1" />
        {draft.floor === null ? (
          <button
            type="button"
            onClick={() =>
              onChange({
                ...draft,
                floor: defaultFloor(
                  leader?.display_name || 'this',
                  formatPriceLabel(leader?.frozen_price)
                ),
              })
            }
            style={ghostLink}
          >
            + Add floor question
          </button>
        ) : (
          <QuestionEditor
            slot={floor}
            onChange={(next) => onChange({ ...draft, floor: next })}
            onDelete={() => onChange({ ...draft, floor: null })}
          />
        )}
      </div>

      {/* Drift */}
      <div
        style={{
          ...stageCard,
          opacity: draft.sessionCount === 2 ? 1 : 0.55,
          pointerEvents: draft.sessionCount === 2 ? 'auto' : 'none',
        }}
      >
        <StageHeader
          title="Drift"
          meta={
            draft.sessionCount === 2
              ? `Session 2 · after ${draft.session2IntervalHours}h`
              : 'Requires 2 sessions'
          }
        />
        {draft.sessionCount === 2 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-50)' }}>
            Session-2 battles replay preference after the wait — same A / B / neither / skip
            outcomes. Published automatically when sessions = 2.
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-30)' }}>
            Switch sessions to 2 to enable drift measurement.
          </p>
        )}
      </div>

      {/* Advanced */}
      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          style={{ ...ghostLink, color: 'var(--ink-50)' }}
        >
          {advancedOpen ? '▾' : '▸'} Advanced
        </button>
        {advancedOpen ? (
          <div
            style={{
              marginTop: 12,
              padding: 16,
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-1)',
            }}
          >
            <label style={labelSm} htmlFor="audience">
              Audience definition
            </label>
            <textarea
              id="audience"
              value={draft.audienceDefinition}
              onChange={(e) => onChange({ ...draft, audienceDefinition: e.target.value })}
              rows={2}
              placeholder="Who should take this study?"
              style={{ ...inputBase, marginBottom: 14, resize: 'vertical' }}
            />

            <label style={labelSm} htmlFor="taxonomy">
              Taxonomy node id
            </label>
            <input
              id="taxonomy"
              type="number"
              value={draft.taxonomyNodeId}
              onChange={(e) =>
                onChange({
                  ...draft,
                  taxonomyNodeId: Number(e.target.value) || draft.taxonomyNodeId,
                })
              }
              style={{ ...inputBase, width: 160, marginBottom: 14 }}
            />

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                marginBottom: 10,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={draft.predictiveValidityOptIn}
                onChange={(e) =>
                  onChange({ ...draft, predictiveValidityOptIn: e.target.checked })
                }
              />
              Predictive validity opt-in
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={draft.categoryIntelligenceOptIn}
                onChange={(e) =>
                  onChange({ ...draft, categoryIntelligenceOptIn: e.target.checked })
                }
              />
              Category intelligence opt-in
            </label>
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </section>
  )
}
