import type { OwnershipCorrectionState } from './useOwnershipCorrection'

export function NotesField({
  notes,
  setNotes,
}: Pick<OwnershipCorrectionState, 'notes' | 'setNotes'>) {
  return (
    <div style={{ marginBottom: 12 }}>
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
        Notes <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
        rows={3}
        placeholder="Anything that helps us verify this…"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid var(--ink-10)',
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          color: 'var(--ink)',
          resize: 'vertical',
          outline: 'none',
          lineHeight: 1.5,
        }}
      />
      <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 4, textAlign: 'right' }}>
        {notes.length}/2000
      </div>
    </div>
  )
}
