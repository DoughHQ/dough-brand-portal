import {
  changeSummary,
  liveParentLabel,
  safeEvidenceHref,
  type PendingOwnershipCorrection,
} from '@/lib/ownershipCorrections'

export function OwnershipCorrectionBody({
  row,
  liveNames,
}: {
  row: PendingOwnershipCorrection
  liveNames: Map<number, string>
}) {
  const evidenceHref = safeEvidenceHref(row.evidence_url)
  const liveLabel = liveParentLabel(row, liveNames)

  return (
    <>
      <div
        style={{
          fontSize: 14,
          color: 'var(--ink)',
          fontWeight: 500,
          marginBottom: 12,
          lineHeight: 1.45,
        }}
      >
        {changeSummary(row)}
      </div>

      {row.snapshot_is_stale ? (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'var(--amber-pale, rgba(192,120,24,0.12))',
            border: '1px solid rgba(192,120,24,0.25)',
            fontSize: 13,
            color: 'var(--amber, #a66a14)',
            lineHeight: 1.5,
          }}
        >
          ⚠ The brand’s parent has changed since this was submitted (was{' '}
          {row.current_display_name?.trim() || 'None'}, now {liveLabel}). Re-verify before
          accepting.
        </div>
      ) : null}

      {row.user_notes?.trim() ? (
        <div style={{ fontSize: 13, color: 'var(--ink-50)', marginBottom: 8, lineHeight: 1.5 }}>
          <span style={{ color: 'var(--ink-30)', fontWeight: 500 }}>Notes: </span>
          {row.user_notes.trim()}
        </div>
      ) : null}

      {row.evidence_url?.trim() ? (
        <div style={{ fontSize: 13, marginBottom: 12 }}>
          <span style={{ color: 'var(--ink-30)', fontWeight: 500 }}>Evidence: </span>
          {evidenceHref ? (
            <a
              href={evidenceHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--sage)' }}
            >
              {row.evidence_url.trim()}
            </a>
          ) : (
            <span style={{ color: 'var(--ink-50)' }}>{row.evidence_url.trim()}</span>
          )}
        </div>
      ) : null}
    </>
  )
}
