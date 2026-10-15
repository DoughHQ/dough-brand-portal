'use client'
import type { PortalUser, CategoryStat, MilestoneAlert } from '@/lib/queries'
import { AdminCategoryHeat } from './adminDesk/AdminCategoryHeat'
import { AdminMilestoneAlerts } from './adminDesk/AdminMilestoneAlerts'
import { AdminProductsSearch } from './adminDesk/AdminProductsSearch'
import { useAdminProducts } from './adminDesk/useAdminProducts'

interface Props {
  portalUser: PortalUser
  categoryStats: CategoryStat[]
  milestoneAlerts: MilestoneAlert[]
  /** Honest lag copy for MV-backed category stats. */
  statsLagHint?: string
}

export default function AdminProductsClient({ portalUser: _portalUser, categoryStats, milestoneAlerts, statsLagHint }: Props) {
  const desk = useAdminProducts()

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Admin
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)' }}>
          Products
        </div>
        {statsLagHint ? (
          <p style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 8, lineHeight: 1.45, maxWidth: 560 }}>
            {statsLagHint}
          </p>
        ) : null}
      </div>

      <AdminProductsSearch {...desk} />

      {/* Two column layout: categories + milestone alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        <AdminCategoryHeat categoryStats={categoryStats} router={desk.router} />
        <AdminMilestoneAlerts milestoneAlerts={milestoneAlerts} router={desk.router} />
      </div>

    </div>
  )
}
