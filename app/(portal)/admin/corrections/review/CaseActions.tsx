import { isCaptureProductImage, type CorrectionReviewRow } from '@/lib/corrections.shared'
import type { CorrectionCaseMode } from '@/lib/correctionsCase'
import CaseEditor from '../CaseEditor'

export function CaseActions({
  row,
  busy,
  editorOpen,
  mode,
  ct,
  applyLabel,
  onCloseEditor,
  onApplyValue,
  onApply,
  onOpenEditor,
}: {
  row: CorrectionReviewRow
  busy: boolean
  editorOpen: boolean
  mode: CorrectionCaseMode
  ct: string
  applyLabel: string
  onCloseEditor: () => void
  onApplyValue: (value: Record<string, unknown>, skuVariantId: number | null) => void
  onApply: () => void
  onOpenEditor: () => void
}) {
  return (
    <>
      {editorOpen && (
        <CaseEditor
          row={row}
          busy={busy}
          onCancel={onCloseEditor}
          onSubmit={(value, skuVariantId) => onApplyValue(value, skuVariantId)}
        />
      )}

      {!editorOpen && mode !== 'extract' && (
        <div className="corr-actions">
          {mode === 'confirm' ? (
            <>
              <button
                type="button"
                className="corr-btn corr-btn-primary"
                disabled={busy}
                onClick={onApply}
              >
                {busy ? 'Working…' : applyLabel}
              </button>
              {isCaptureProductImage(row) ? null : (
                <button
                  type="button"
                  className="corr-btn corr-btn-ghost"
                  disabled={busy}
                  onClick={onOpenEditor}
                >
                  {ct === 'category' ? 'Pick a different category' : 'Enter a different value'}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              className="corr-btn corr-btn-primary"
              disabled={busy}
              onClick={onOpenEditor}
            >
              {applyLabel}
            </button>
          )}
        </div>
      )}
    </>
  )
}
