import { chipStyle, filterLabel, type SortPreset } from './compareGroupChrome'

export function CompareGroupsSortBar({
  activePreset,
  applyPreset,
}: {
  activePreset: SortPreset | null
  applyPreset: (preset: SortPreset) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
        marginBottom: 12,
      }}
    >
      <span style={filterLabel}>Sort</span>
      <button
        type="button"
        onClick={() => applyPreset('respondents')}
        style={chipStyle(activePreset === 'respondents')}
      >
        Most respondents
      </button>
      <button
        type="button"
        onClick={() => applyPreset('battles')}
        style={chipStyle(activePreset === 'battles')}
      >
        Most battles
      </button>
      <button
        type="button"
        onClick={() => applyPreset('name')}
        style={chipStyle(activePreset === 'name')}
      >
        Name A–Z
      </button>
    </div>
  )
}
