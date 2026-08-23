import type { RecapLine } from '@/lib/concept/preview/recap'

type Props = {
  lines: RecapLine[]
}

export default function SummaryScreen({ lines }: Props) {
  return (
    <div>
      <p className="cpw-banner">
        This is a preview of the respondent experience. Your answers are not recorded
        and do not affect any study.
      </p>
      <h2 className="cpw-prompt">Your walkthrough</h2>
      <p className="cpw-help">
        A recap of what you clicked — not a score, not a prediction.
      </p>
      <ul className="cpw-summary-list">
        {lines.length === 0 ? (
          <li>You moved through the walkthrough without leaving answers.</li>
        ) : (
          lines.map((line, i) => <li key={i}>{line.text}</li>)
        )}
      </ul>
    </div>
  )
}
