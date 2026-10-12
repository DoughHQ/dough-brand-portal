import type { StimulusMode } from '@/lib/concept/types'
import { STIMULUS_MODE_OPTIONS } from '@/lib/concept/constants'
import { labelSm } from '../conceptStyles'

const COMING_SOON_MODES = STIMULUS_MODE_OPTIONS.filter((o) => !o.publishable)

type ModeOption = (typeof STIMULUS_MODE_OPTIONS)[number]

export default function StudyTypeModes({
  packagingOnly,
  studyTypeLabelId,
  liveModes,
  stimulusMode,
  onSelectMode,
}: {
  packagingOnly: boolean
  studyTypeLabelId: string
  liveModes: ModeOption[]
  stimulusMode: StimulusMode | null
  onSelectMode: (mode: StimulusMode, publishable: boolean) => void
}) {
  if (packagingOnly) {
    return (
      <p className="cb-setup-identity" role="status">
        Packaging concept · Blind · Design letters only
      </p>
    )
  }

  return (
    <>
      <div id={studyTypeLabelId} style={{ ...labelSm, marginBottom: 12 }}>
        Study type
      </div>
      <div className="cb-mode-grid" role="radiogroup" aria-labelledby={studyTypeLabelId}>
        {liveModes.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={stimulusMode === opt.value}
            className="cb-mode-card"
            onClick={() => onSelectMode(opt.value, opt.publishable)}
          >
            <span className="cb-mode-card-label">{opt.label}</span>
            <span className="cb-mode-card-help">{opt.help}</span>
          </button>
        ))}
      </div>

      <p className="cb-mode-roadmap">
        <span className="cb-mode-roadmap-lead">More study types coming soon</span>
        <span className="cb-mode-roadmap-list">
          {COMING_SOON_MODES.map((o) => o.label).join(' · ')}
        </span>
      </p>
    </>
  )
}
