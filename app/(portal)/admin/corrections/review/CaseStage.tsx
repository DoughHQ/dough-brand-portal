import Link from 'next/link'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import {
  brandMismatchWork,
  claimCopy,
  correctionCaseMode,
  formatCategoryPath,
  primaryVerb,
  productTitle,
  relatedBrandClaim,
  waitingAge,
} from '@/lib/correctionsCase'
import { formatUtcStamp } from '@/lib/portal-ui/format'
import { CaseActions } from './CaseActions'
import { CaseEvidence } from './CaseEvidence'
import { CaseMismatch } from './CaseMismatch'
import { CasePhoto } from './CasePhoto'
import { CaseReject } from './CaseReject'
import { CaseRelated } from './CaseRelated'
import { proposedApplyLabel } from './caseStageModel'

export function CaseStage({
  row,
  busy,
  nowMs,
  workspaceBrandId,
  workspaceBrandName,
  editorOpen,
  rejectChip,
  related,
  onOpenRelated,
  onExtract,
  onOpenEditor,
  onCloseEditor,
  onExpandEvidence,
  onPickReject,
  onApply,
  onApplyValue,
  onReject,
}: {
  row: CorrectionReviewRow
  busy: boolean
  nowMs: number
  workspaceBrandId: number | null
  workspaceBrandName: string | null
  editorOpen: boolean
  rejectChip: string | null
  related: CorrectionReviewRow[]
  onOpenRelated: (row: CorrectionReviewRow) => void
  onExtract: () => void
  onOpenEditor: () => void
  onCloseEditor: () => void
  onExpandEvidence: () => void
  onPickReject: (chip: string) => void
  onApply: () => void
  onApplyValue: (value: Record<string, unknown>, skuVariantId: number | null) => void
  onReject: () => void
}) {
  const title = productTitle(row)
  const copy = claimCopy(row)
  const age = waitingAge(row.created_at, nowMs)
  const ct = (row.correction_type ?? 'other').toLowerCase()
  const mode = correctionCaseMode(row)
  const path = formatCategoryPath(row.current_category_path)
  const mismatch = brandMismatchWork({
    brandId: row.brand_id,
    brandName: row.brand_name,
    workspaceBrandId,
    workspaceBrandName,
    correctionType: row.correction_type,
  })
  const brandSib = relatedBrandClaim(related)
  const hasEvidence = Boolean(row.evidence_preview_url)
  const applyLabel =
    mode === 'confirm'
      ? `Apply “${proposedApplyLabel(row)}”`
      : primaryVerb(mode, ct)

  return (
    <article className="corr-case" data-correction-id={row.id}>
      <div className="corr-case-grid">
        <CasePhoto row={row} title={title} />

        <div className="corr-body">
          <div className="corr-age" title={formatUtcStamp(row.created_at)}>
            {age || formatUtcStamp(row.created_at)}
          </div>
          <h2 className="corr-product">{title}</h2>
          <p className="corr-identity">
            {[row.brand_name, path ?? row.current_category].filter(Boolean).join(' · ')}
            {' · '}
            <Link href={`/products/${row.product_id}`} target="_blank" rel="noreferrer">
              Open product
            </Link>
          </p>
          <CaseMismatch
            row={row}
            busy={busy}
            mismatch={mismatch}
            brandSib={brandSib}
            onOpenRelated={onOpenRelated}
          />

          <h3 className="corr-headline">{copy.headline}</h3>
          <p className="corr-sentence">{copy.sentence}</p>
          {mode === 'confirm' && row.current_category && row.proposed_category_label ? (
            <p className="corr-diff">
              {row.current_category}
              {' → '}
              <span className="corr-diff-to">{row.proposed_category_label}</span>
            </p>
          ) : null}

          <CaseEvidence
            row={row}
            hasEvidence={hasEvidence}
            mode={mode}
            editorOpen={editorOpen}
            busy={busy}
            onExpandEvidence={onExpandEvidence}
            onExtract={onExtract}
          />
          <CaseActions
            row={row}
            busy={busy}
            editorOpen={editorOpen}
            mode={mode}
            ct={ct}
            applyLabel={applyLabel}
            onCloseEditor={onCloseEditor}
            onApplyValue={onApplyValue}
            onApply={onApply}
            onOpenEditor={onOpenEditor}
          />
          <CaseRelated related={related} busy={busy} onOpenRelated={onOpenRelated} />
          <CaseReject
            rejectChip={rejectChip}
            busy={busy}
            onPickReject={onPickReject}
            onReject={onReject}
          />
        </div>
      </div>
    </article>
  )
}
