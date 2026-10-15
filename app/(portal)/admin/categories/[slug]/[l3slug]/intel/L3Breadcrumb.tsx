'use client'

import { useRouter } from 'next/navigation'

export function L3Breadcrumb({ l2Name, l3Name }: { l2Name: string; l3Name: string }) {
  const router = useRouter()
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 28, fontSize: 12, color: 'var(--ink-50)' }}>
      <span style={{ cursor: 'pointer' }} onClick={() => router.push('/products')}>Products</span>
      <span style={{ color: 'var(--ink-30)' }}>→</span>
      <span
        style={{ cursor: 'pointer' }}
        onClick={() => router.push(`/admin/categories/${encodeURIComponent(l2Name)}`)}
      >
        {l2Name}
      </span>
      <span style={{ color: 'var(--ink-30)' }}>→</span>
      <span style={{ color: 'var(--ink)' }}>{l3Name}</span>
    </div>
  )
}
