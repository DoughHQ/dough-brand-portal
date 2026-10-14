import type { CorrectionCaseMode } from '@/lib/correctionsCase'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'

export function CaseEvidence({
  row,
  hasEvidence,
  mode,
  editorOpen,
  busy,
  onExpandEvidence,
  onExtract,
}: {
  row: CorrectionReviewRow
  hasEvidence: boolean
  mode: CorrectionCaseMode
  editorOpen: boolean
  busy: boolean
  onExpandEvidence: () => void
  onExtract: () => void
}) {
  return (
    <>
      {hasEvidence ? (
        <button
          type="button"
          className="corr-evidence"
          onClick={onExpandEvidence}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={row.evidence_preview_url!} alt="Submitted evidence" />
        </button>
      ) : row.evidence_capture_path ? (
        <p className="corr-sentence">Photo unavailable</p>
      ) : null}

      {mode === 'extract' && hasEvidence && !editorOpen ? (
        <div className="corr-extract-row">
          <button
            type="button"
            className="corr-btn corr-btn-primary"
            disabled={busy}
            onClick={onExtract}
          >
            {busy ? 'Extracting…' : 'Extract from photo'}
          </button>
          <span className="corr-extract-hint">
            Check the draft against the photo, then apply.
          </span>
        </div>
      ) : null}
    </>
  )
}
