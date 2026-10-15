import type { Product } from './l3Model'
import { L3RankRow } from './L3RankRow'
import { useRouter } from 'next/navigation'
import { useEnterImpersonation } from '@/lib/portal/useEnterImpersonation'

export function L3RankTable({ filtered }: { filtered: Product[] }) {
  const router = useRouter()
  const { enterAsBrand, loading: entering } = useEnterImpersonation()
  return (
    <div style={{
      background: 'var(--paper)',
      border: '1px solid var(--ink-10)',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      minHeight: 400,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 44px 1fr 160px 80px 80px 80px 110px 50px',
        padding: '8px 20px',
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--ink-10)',
      }}>
        {['', '#', 'Product', 'Brand', 'Battles', 'Win rate', 'ELO', 'Signal', 'Tier'].map((h, i) => (
          <div key={i} style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--ink-30)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            textAlign: i <= 2 ? 'left' : 'right',
          }}>
            {h}
          </div>
        ))}
      </div>
      {filtered.map((product, i) => (
        <L3RankRow
          key={product.product_id}
          product={product}
          index={i}
          rowCount={filtered.length}
          router={router}
          enterAsBrand={enterAsBrand}
          entering={entering}
        />
      ))}
    </div>
  )
}
