export function L3Title({ l2Name, l3Name }: { l2Name: string; l3Name: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        L3 Category intelligence
      </div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>
        {l3Name}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-30)' }}>
        {l2Name} · Ranked by declared consumer preference
      </div>
    </div>
  )
}
