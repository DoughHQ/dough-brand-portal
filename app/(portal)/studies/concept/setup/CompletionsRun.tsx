import type { ConceptStudyDraft } from '@/lib/concept/types'
import { inputBase, labelSm } from '../conceptStyles'

export default function CompletionsRun({
  draft,
  onChange,
  completionPresets,
  completionFloor,
  showCustomCompletions,
  completionsText,
  setCompletionsText,
  setCustomCompletions,
  setCompletions,
  completionsFocused: completionsFocusedRef,
  runMeta,
}: {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  completionPresets: readonly number[]
  completionFloor: number
  showCustomCompletions: boolean
  completionsText: string
  setCompletionsText: (value: string) => void
  setCustomCompletions: (value: boolean) => void
  setCompletions: (n: number) => void
  completionsFocused: { current: boolean }
  runMeta: string
}) {
  return (
    <div className="cb-setup-run">
      <div className="cb-setup-run-head">
        <div className="cb-setup-run-title">How it runs</div>
        <p className="cb-setup-run-meta" role="status">
          {runMeta}
        </p>
      </div>

      <div className="cb-setup-run-body">
        <div className="cb-setup-completions">
          <div style={labelSm} id="field_target_completions_label">
            Completions
          </div>
          <div
            className="cb-setup-presets"
            role="group"
            aria-labelledby="field_target_completions_label"
          >
            {completionPresets.filter((n) => n >= completionFloor).map((n) => {
              const on = !showCustomCompletions && draft.targetCompletions === n
              return (
                <button
                  key={n}
                  type="button"
                  className={on ? 'cb-setup-preset is-on' : 'cb-setup-preset'}
                  aria-pressed={on}
                  onClick={() => {
                    setCustomCompletions(false)
                    setCompletions(n)
                  }}
                >
                  {n}
                </button>
              )
            })}
            <button
              type="button"
              className={showCustomCompletions ? 'cb-setup-preset is-on' : 'cb-setup-preset'}
              aria-pressed={showCustomCompletions}
              onClick={() => setCustomCompletions(true)}
            >
              Custom
            </button>
          </div>
          {showCustomCompletions ? (
            <>
              <input
                id="field_target_completions"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                className="cb-input cb-setup-completions-input"
                aria-labelledby="field_target_completions_label"
                value={completionsText}
                onFocus={() => {
                  completionsFocusedRef.current = true
                }}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setCompletionsText(raw)
                  // Commit only once the typed count clears the floor, so
                  // typing "100" is not yanked back to 30 mid-keystroke.
                  if (raw !== '' && Number(raw) >= completionFloor) {
                    onChange({ ...draft, targetCompletions: Number(raw), fieldingDays: null })
                  }
                }}
                onBlur={() => {
                  completionsFocusedRef.current = false
                  if (!/^\d+$/.test(completionsText) || Number(completionsText) < completionFloor) {
                    setCompletions(Math.max(completionFloor, draft.targetCompletions || completionFloor))
                  } else {
                    setCompletions(Number(completionsText))
                  }
                }}
                style={{ ...inputBase, marginTop: 10, maxWidth: 160 }}
              />
              <p className="cb-field-note">Minimum {completionFloor}. Type any count.</p>
            </>
          ) : (
            <input
              id="field_target_completions"
              type="hidden"
              value={draft.targetCompletions}
              readOnly
            />
          )}
          <p className="cb-setup-run-note">
            Runs until it&apos;s full, for up to 90 days. You can end it sooner. You get a
            report if at least 10 people finished, and a refund for the responses you
            didn&apos;t get.
          </p>
        </div>
      </div>
    </div>
  )
}
