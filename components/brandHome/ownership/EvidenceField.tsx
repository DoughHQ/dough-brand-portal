import type { OwnershipCorrectionState } from './useOwnershipCorrection'

export function EvidenceField({
  evidenceUrl,
  setEvidenceUrl,
}: Pick<OwnershipCorrectionState, 'evidenceUrl' | 'setEvidenceUrl'>) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
          marginBottom: 6,
        }}
      >
        Evidence URL <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
      </div>
      <input
        value={evidenceUrl}
        onChange={(e) => setEvidenceUrl(e.target.value)}
        placeholder="https://…"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '9px 12px',
          borderRadius: 6,
          border: '1px solid var(--ink-10)',
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          color: 'var(--ink)',
          outline: 'none',
        }}
      />
    </div>
  )
}
