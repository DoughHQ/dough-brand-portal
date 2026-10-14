import type { Dispatch, SetStateAction } from 'react'
import {
  brandDecisionLabel,
  formatProductCount,
  safeLinkedInHref,
  safeWebHref,
  type BrandApplication,
  type CatalogCandidate,
} from '@/lib/brandApplications'
import { ApplicationCardActions } from './ApplicationCardActions'
import { ApplicationCardFlags } from './ApplicationCardFlags'
import { ApplicationCardHead } from './ApplicationCardHead'
import { ApplicationCardMeta } from './ApplicationCardMeta'
import type { BrandApplicationDialog } from './brandApplicationDialog'

export default function BrandApplicationCard({
  row,
  impersonating,
  busy,
  setDialog,
  setDialogError,
  setCandidateOverride,
}: {
  row: BrandApplication
  impersonating: boolean
  busy: boolean
  setDialog: Dispatch<SetStateAction<BrandApplicationDialog>>
  setDialogError: Dispatch<SetStateAction<string | null>>
  setCandidateOverride: Dispatch<SetStateAction<CatalogCandidate[] | null>>
}) {
  const netNew = row.selected_brand_id == null
  const linkedInHref = safeLinkedInHref(row.linkedin_url)
  const websiteHref = safeWebHref(row.brand_website)
  const pending = row.status === 'pending'
  const brandLabel = brandDecisionLabel(row)
  const productCount = formatProductCount(row)
  const warningBorder =
    row.already_claimed ||
    row.flagged_not_mine_count > 0 ||
    row.domain_match === false ||
    row.free_email

  return (
    <article
      style={{
        background: 'var(--paper)',
        border: `1px solid ${
          row.already_claimed
            ? 'rgba(192,120,24,0.45)'
            : warningBorder
              ? 'rgba(192,120,24,0.28)'
              : 'var(--ink-10)'
        }`,
        borderRadius: 12,
        padding: '20px 22px',
        opacity: pending ? 1 : 0.78,
      }}
    >
      <ApplicationCardHead row={row} pending={pending} />
      <ApplicationCardFlags row={row} netNew={netNew} />
      <ApplicationCardMeta
        row={row}
        brandLabel={brandLabel}
        productCount={productCount}
        linkedInHref={linkedInHref}
        websiteHref={websiteHref}
      />
      {!pending && row.review_notes ? (
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-50)',
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: 'var(--ink-30)', fontWeight: 500 }}>Review notes: </span>
          {row.review_notes}
        </div>
      ) : null}
      <ApplicationCardActions
        row={row}
        pending={pending}
        busy={busy}
        impersonating={impersonating}
        setDialog={setDialog}
        setDialogError={setDialogError}
        setCandidateOverride={setCandidateOverride}
      />
    </article>
  )
}
