import { BATTLE_OPTS, RESPONDENT_OPTS, chipStyle, filterLabel } from './compareGroupChrome'

export function CompareGroupsRangeFilters({
  minBattles,
  setMinBattles,
  minRespondents,
  setMinRespondents,
}: {
  minBattles: number
  setMinBattles: (value: number) => void
  minRespondents: number
  setMinRespondents: (value: number) => void
}) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={filterLabel}>Battles</span>
        {BATTLE_OPTS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setMinBattles(o.value)}
            style={chipStyle(minBattles === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={filterLabel}>Respondents</span>
        {RESPONDENT_OPTS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setMinRespondents(o.value)}
            style={chipStyle(minRespondents === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </>
  )
}
