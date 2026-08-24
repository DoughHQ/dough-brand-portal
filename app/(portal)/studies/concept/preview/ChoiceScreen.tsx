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
import StimulusImage from './StimulusImage'

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

function subjectKindLabel(kind: string | undefined): string | null {
  if (kind === 'concept') return 'Your concept'
  if (kind === 'product') return 'In the field'
  return null
}

function operatorNote(
  screen: ChoiceScreen,
  subject: ConceptPlanSubject | null,
  blocked: boolean
): string | null {
  if (screen.kind === 'screener' || screen.kind === 'attribute_followup') {
    return null
  }
  const focal = 'focal_arm' in screen ? screen.focal_arm : undefined
  const resolve =
    'resolve_subject' in screen ? screen.resolve_subject : undefined
  if (focal === 'assigned') {
    return 'Assigned concept arm — not whoever won the battles.'
  }
  if (resolve === 'client_session_winner' || focal === 'respondent_winner') {
    if (blocked || !subject) {
      return 'No pack won a battle, so this question has no subject — same as a respondent who skipped every round.'
    }
    if (subject.kind === 'product') {
      return 'You chose this product most. Respondents answer this about whoever they picked most — including products in the field.'
    }
    return 'Respondents answer this about the pack they chose most in the battles.'
  }
  return null
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

  const kindLabel = subjectKindLabel(subject?.kind)
  const note = operatorNote(screen, subject, blocked)

  return (
    <div>
      {subject ? (
        <div className="cpw-subject">
          <StimulusImage
            src={subject.image_url}
            alt={subject.name ?? ''}
            unavailable={subject.image_unavailable}
            placeholderClassName="cpw-subject-ph"
          />
          <div>
            {kindLabel ? (
              <div
                className="cpw-subject-kind"
                data-kind={subject?.kind ?? ''}
              >
                {kindLabel}
              </div>
            ) : null}
            <div className="cpw-tile-name">
              {subject.name ?? `Option ${subject.ref}`}
            </div>
            {subject.price != null ? (
              <div className="cpw-tile-price">${subject.price.toFixed(2)}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      <h2 className="cpw-prompt">{prompt}</h2>
      {note ? <p className="cpw-help">{note}</p> : null}

      {blocked ? null : isText ? (
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
