import { TOD_OPTIONS, chipStyle, filterLabel, type TodFilter } from './compareGroupChrome'

export function CompareGroupsTodFilter({
  tod,
  setTod,
  hasTodData,
}: {
  tod: TodFilter
  setTod: (value: TodFilter) => void
  hasTodData: boolean
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
        <span style={filterLabel}>Time of day</span>
        {TOD_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            title={
              !hasTodData && o.value !== 'any'
                ? 'Apply the list_compare_groups peak-TOD migration to enable this filter'
                : undefined
            }
            disabled={!hasTodData && o.value !== 'any'}
            onClick={() => setTod(o.value)}
            style={{
              ...chipStyle(tod === o.value),
              opacity: !hasTodData && o.value !== 'any' ? 0.45 : 1,
              cursor: !hasTodData && o.value !== 'any' ? 'not-allowed' : 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {!hasTodData && (
        <p style={{ fontSize: 12, color: 'var(--ink-30)', margin: '0 0 12px' }}>
          Time-of-day filters need the updated list RPC (peak buckets from editorial
          priors). Until that migration is applied, only name/battle/respondent filters
          work.
        </p>
      )}
    </>
  )
}
