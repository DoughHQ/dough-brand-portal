import type { CategoryLauncherRow } from '@/lib/categoryLauncher'
import { SummaryCard } from './SummaryCard'

export function LauncherSummary({
  represented,
  departments,
  owned,
  productsMapped,
  battlesCaptured,
}: {
  represented: number
  departments: number
  owned: CategoryLauncherRow[]
  productsMapped: number
  battlesCaptured: number
}) {
  return (
    <div className="cat-summary">
      <SummaryCard
        label="Categories represented"
        value={represented}
        hint={departments > 0 ? `Across ${departments} department${departments === 1 ? '' : 's'}` : 'No competing categories yet'}
        icon="M4 6h16M4 12h16M4 18h10"
      />
      <SummaryCard
        label="Dashboards unlocked"
        value={owned.length}
        hint={owned.length === 0 ? 'None live yet' : owned.length === 1 ? '1 live overview' : `${owned.length} live overviews`}
        icon="M4 19V5h12v14H4zM16 8h4v11h-4"
      />
      <SummaryCard
        label="Products mapped"
        value={productsMapped}
        hint="In competing categories"
        icon="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      />
      <SummaryCard
        label="Battles captured"
        value={battlesCaptured}
        hint="Across competing categories"
        icon="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5"
      />
    </div>
  )
}
