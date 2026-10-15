export function CategoryStatStrip({
  productCount,
  totalBattles,
  totalBrands,
  topElo,
  avgWinRate,
}: {
  productCount: number
  totalBattles: number
  totalBrands: number
  topElo: number
  avgWinRate: number
}) {
  const products = { length: productCount }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
      {[
        { label: 'Products battled', value: products.length.toLocaleString() },
        { label: 'Total battles', value: totalBattles.toLocaleString() },
        { label: 'Brands represented', value: totalBrands.toLocaleString() },
        { label: 'Top ELO', value: topElo ? Math.round(Number(topElo)).toLocaleString() : '—' },
        { label: 'Avg win rate', value: `${avgWinRate}%` },
      ].map(stat => (
        <div key={stat.label} style={{
          background: 'var(--paper)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-md)',
          padding: '16px 18px',
        }}>
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 6 }}>{stat.label}</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, color: 'var(--ink)' }}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  )
}
