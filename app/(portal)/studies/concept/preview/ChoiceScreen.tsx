import { useMemo, useState } from 'react'
import type {
  ConceptAttributeFollowupScreen,
  ConceptDiagnosticScreen,
  ConceptFloorScreen,
  ConceptPlanSubject,
  ConceptProbeScreen,
  ConceptScreenerScreen,
} from '@/lib/concept/preview/planTypes'
import { normalizeOptions } from '@/lib/concept/preview/options'

type ChoiceScreen =
  | ConceptScreenerScreen
  | ConceptDiagnosticScreen
  | ConceptFloorScreen
  | ConceptProbeScreen
  | ConceptAttributeFollowupScreen

type Props = {
  screen: ChoiceScreen
  subject: ConceptPlanSubject | null
  onAnswer: (values: string[], labels: string[]) => void
}

export default function ChoiceScreen({ screen, subject, onAnswer }: Props) {
  const config = screen.config ?? {}
  const options = useMemo(() => normalizeOptions(config), [config])
  const maxSelect = Math.max(1, config.max_select ?? 1)
  const minSelect = Math.max(0, config.min_select ?? 1)
  const isMulti = maxSelect > 1
  const isText =
    (config.response ?? '').toLowerCase() === 'text' ||
    (typeof config.max_length === 'number' && options.length === 0)
  const [selected, setSelected] = useState<string[]>([])
  const [text, setText] = useState('')

  const prompt =
    (config.prompt ?? '').trim() ||
    (screen.kind === 'screener' ? 'Quick check before we start' : 'One quick question')

  const focal = 'focal_arm' in screen ? screen.focal_arm : undefined
  const resolveSubject =
    'resolve_subject' in screen ? screen.resolve_subject : undefined
  const needsSubject =
    (resolveSubject ?? '').trim() === 'client_session_winner' ||
    focal === 'assigned' ||
    focal === 'respondent_winner' ||
    focal === 'each_arm'

  const blocked =
    needsSubject &&
    screen.kind !== 'screener' &&
    !subject &&
    (resolveSubject ?? '') === 'client_session_winner'

  function toggle(key: string) {
    if (!isMulti) {
      setSelected([key])
      return
    }
    setSelected((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key].slice(0, maxSelect)
    )
  }

  function submit() {
    if (isText) {
      onAnswer([text], [text])
      return
    }
    const labels = selected.map(
      (k) => options.find((o) => o.key === k)?.label ?? k
    )
    onAnswer(selected, labels)
  }

  const canSubmit = isText
    ? text.trim().length > 0 || minSelect === 0
    : selected.length >= minSelect && selected.length <= maxSelect

  return (
    <div>
      {subject ? (
        <div className="cpw-subject">
          {subject.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={subject.image_url} alt="" />
          ) : (
            <div className="cpw-subject-ph">No image</div>
          )}
          <div>
            <div className="cpw-tile-name">{subject.name ?? `Option ${subject.ref}`}</div>
            {subject.price != null ? (
              <div className="cpw-tile-price">${subject.price.toFixed(2)}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      <h2 className="cpw-prompt">{prompt}</h2>

      {blocked ? (
        <p className="cpw-help">Could not determine which pack this question is about.</p>
      ) : isText ? (
        <textarea
          className="cpw-text"
          value={text}
          maxLength={config.max_length ?? 280}
          onChange={(e) => setText(e.target.value)}
        />
      ) : (
        <div className="cpw-options">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className="cpw-option"
              data-picked={selected.includes(opt.key)}
              onClick={() => toggle(opt.key)}
            >
              {opt.label}
              {opt.low != null && opt.high != null
                ? ` · $${opt.low}–$${opt.high}`
                : ''}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="cpw-next"
        disabled={blocked || !canSubmit}
        onClick={submit}
      >
        Continue
      </button>
    </div>
  )
}
