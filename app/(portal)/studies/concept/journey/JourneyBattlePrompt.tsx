import type { ConceptStudyDraft } from '@/lib/concept/types'
import { BATTLE_PROMPT_OPTIONS } from '@/lib/concept/singleTest'
import { inputBase, labelSm } from '../conceptStyles'

export default function JourneyBattlePrompt({
  draft,
  onChange,
  usingCustom,
  customNote,
}: {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  usingCustom: boolean
  customNote: { ok: boolean; message: string } | null
}) {
  return (
    <>
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
                background: active ? 'var(--sage-soft)' : 'var(--paper)',
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
    </>
  )
}
