import type { Dispatch, SetStateAction } from 'react'
import type { PendingOwnershipCorrection } from '@/lib/ownershipCorrections'

export function OwnershipReviewNotes({
  row,
  notesById,
  setNotesById,
  busy,
}: {
  row: PendingOwnershipCorrection
  notesById: Record<string, string>
  setNotesById: Dispatch<SetStateAction<Record<string, string>>>
  busy: boolean
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
          marginBottom: 6,
        }}
      >
        Review notes <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
      </label>
      <textarea
        value={notesById[row.correction_id] ?? ''}
        onChange={(e) =>
          setNotesById((prev) => ({
            ...prev,
            [row.correction_id]: e.target.value.slice(0, 2000),
          }))
        }
        rows={2}
        placeholder="Internal note for this decision…"
        disabled={busy}
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
        }}
      />
    </div>
  )
}
