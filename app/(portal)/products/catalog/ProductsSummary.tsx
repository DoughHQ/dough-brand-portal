import { n, SummaryCard } from './summaryCards'

export function ProductsSummary({
  productCount,
  battledCount,
  categoryCount,
  claimedCount,
  unclaimedCount,
}: {
  productCount: number
  battledCount: number
  categoryCount: number
  claimedCount: number
  unclaimedCount: number
}) {
  return (
    <div className="cat-summary">
      <SummaryCard
        label="Products"
        value={productCount}
        hint="In your catalog"
        icon="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      />
      <SummaryCard
        label="With battle data"
        value={battledCount}
        hint="Products with signal"
        icon="M4 14l4-4 4 3 6-7"
      />
      <SummaryCard
        label="Categories represented"
        value={categoryCount}
        hint="Across your catalog"
        icon="M4 6h16M4 12h16M4 18h10"
      />
      <SummaryCard
        label="Claimed on plan"
        value={claimedCount}
        hint={
          unclaimedCount > 0
            ? `${n(unclaimedCount)} in catalog still unclaimed`
            : productCount > 0
              ? 'All catalog products claimed'
              : 'No catalog products yet'
        }
        icon="M12 8v5l3 2M12 21a9 9 0 1 0-9-9"
      />
    </div>
  )
}
