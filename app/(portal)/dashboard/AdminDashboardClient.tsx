'use client'

import { useRouter } from 'next/navigation'
import type { PlatformStats } from '@/lib/queries'
import OperatorLaunchpad from '../components/OperatorLaunchpad'

interface Props {
  stats: PlatformStats
}

export default function AdminDashboardClient({ stats }: Props) {
  const router = useRouter()

  const statCards = [
    { label: 'Brands', value: stats.active_brands.toLocaleString() },
    { label: 'Products', value: stats.active_products.toLocaleString() },
    { label: 'Battles', value: stats.total_battles.toLocaleString(), sub: `${stats.battles_7d} this week` },
    { label: 'Users', value: stats.total_users.toLocaleString(), sub: `${stats.active_users_7d} active` },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 960, margin: '0 auto', padding: '36px 32px 48px' }}>
      <OperatorLaunchpad variant="full" />

      <section>
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
            marginBottom: 14,
          }}
        >
          Platform pulse
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-md)',
                padding: '18px 18px',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--ink-50)', marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}>
                {card.value}
              </div>
              {card.sub && (
                <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 5 }}>{card.sub}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'All products', sub: `${stats.products_with_elo.toLocaleString()} with ELO`, href: '/products' },
            { label: 'Corrections', sub: 'Review flagged data', href: '/admin/corrections' },
            { label: 'Studies', sub: 'Drafts & commissioned work', href: '/studies' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.href)}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-md)',
                padding: '18px 18px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ink-30)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ink-10)' }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-30)' }}>{item.sub}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
