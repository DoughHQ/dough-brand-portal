import { REPORT_TYPE_LABELS } from './reportsModel'

export function ReportsToolbar({
  search,
  setSearch,
  filterType,
  setFilterType,
}: {
  search: string
  setSearch: (value: string) => void
  filterType: string
  setFilterType: (value: string) => void
}) {
  return (
    <div className="reports-toolbar">
      <input
        type="text"
        className="reports-search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search reports…"
      />
      <div className="reports-filters">
        {['all', 'category_ranking', 'health_benchmark', 'brand_scorecard'].map(type => (
          <button
            key={type}
            type="button"
            className={`reports-filter${filterType === type ? ' is-on' : ''}`}
            onClick={() => setFilterType(type)}
          >
            {type === 'all' ? 'All reports' : REPORT_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  )
}
