import type { PhonePreviewJourney } from '@/lib/concept/journey'
import { sectionHelp } from '../conceptStyles'
import { fieldIssueLabel } from './journeyLabels'

export default function JourneySectionHead({
  lengthLabel,
  journey,
  journeyError,
  canPreview,
  onPreview,
}: {
  lengthLabel: string | null
  journey: PhonePreviewJourney | null
  journeyError: string | null
  canPreview: boolean
  onPreview?: () => void
}) {
  return (
    <>
      <p style={{ ...sectionHelp, marginBottom: 8 }}>
        They qualify, react to each design, choose, and say why. Then they rank the field and
        name a price. Your questions come after that.
      </p>
      {!lengthLabel ? (
        <p className="cb-questions-length">
          {journeyError ? 'Length unavailable' : 'Building length…'}
        </p>
      ) : null}
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
    </>
  )
}
