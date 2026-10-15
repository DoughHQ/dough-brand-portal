import { inputStyle, labelStyle, STATUSES, TYPES } from './editModel'
import type { EditDetailsState } from './useEditDetails'

export function GroupMetaFields({
  type,
  setType,
  battleLevel,
  setBattleLevel,
  status,
  setStatus,
}: Pick<
  EditDetailsState,
  'type' | 'setType' | 'battleLevel' | 'setBattleLevel' | 'status' | 'setStatus'
>) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
      <label style={labelStyle}>
        Type
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={inputStyle}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label style={labelStyle}>
        Battle level
        <input
          type="number"
          min={1}
          step={1}
          value={battleLevel}
          onChange={(e) => setBattleLevel(Number(e.target.value))}
          style={inputStyle}
        />
      </label>
      <label style={labelStyle}>
        Status
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
          style={inputStyle}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
