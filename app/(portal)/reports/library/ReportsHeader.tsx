export function ReportsHeader({ isAdmin, brandName }: { isAdmin: boolean; brandName: string }) {
  return (
    <header className="reports-header">
      <div>
        <div className="reports-eyebrow">
          {isAdmin ? 'Admin' : brandName}
        </div>
        <h1 className="reports-title reports-title-sr">Reports</h1>
        <p className="reports-lede">
          Category-level preference data, ranked by real consumer battles.
          Reports reflect declared preference — not surveys, not panels.
        </p>
      </div>
    </header>
  )
}
