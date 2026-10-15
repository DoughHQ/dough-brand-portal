export function PrototypesSummary({
  itemCount,
  readyCount,
  needsCount,
}: {
  itemCount: number
  readyCount: number
  needsCount: number
}) {
  return (
    <div className="cat-summary">
      <div className="cat-summary-card">
        <div>
          <div className="cat-summary-label">In library</div>
          <div className="cat-summary-value">{itemCount}</div>
          <div className="cat-summary-hint">Active prototypes</div>
        </div>
      </div>
      <div className="cat-summary-card">
        <div>
          <div className="cat-summary-label">Ready</div>
          <div className="cat-summary-value">{readyCount}</div>
          <div className="cat-summary-hint">Photo + allergens declared</div>
        </div>
      </div>
      <div className="cat-summary-card">
        <div>
          <div className="cat-summary-label">Needs work</div>
          <div className="cat-summary-value">{needsCount}</div>
          <div className="cat-summary-hint">Missing photo or allergens</div>
        </div>
      </div>
    </div>
  )
}
