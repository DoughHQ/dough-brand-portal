export function L3StatStrip({
  productCount,
  totalBattles,
  meaningfulCount,
  meaningfulPct,
}: {
  productCount: number
  totalBattles: number
  meaningfulCount: number
  meaningfulPct: number
}) {
  const products = { length: productCount }
  const meaningful = { length: meaningfulCount }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
      {[
        { label: 'Products battled', value: products.length },
        { label: 'Total battles', value: totalBattles },
        { label: 'Statistically meaningful', value: `${meaningful.length} of ${products.length}` },
        { label: 'Data coverage', value: `${meaningfulPct}%` },
      ].map(s => (
        <div key={s.label} style={{
          background: 'var(--paper)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-md)',
          padding: '16px 18px',
        }}>
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 6 }}>{s.label}</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, color: 'var(--ink)' }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  )
}
