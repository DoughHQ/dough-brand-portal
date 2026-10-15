import { inputStyle, labelStyle } from './editModel'
import type { EditDetailsState } from './useEditDetails'

export function AuditNoteField({ note, setNote }: Pick<EditDetailsState, 'note' | 'setNote'>) {
  return (
    <label style={labelStyle}>
      Reason (optional audit note)
      <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
    </label>
  )
}
