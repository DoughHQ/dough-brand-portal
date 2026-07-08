'use client'

import { useRouter } from 'next/navigation'
import type { OperatorDraftMission } from '@/lib/queries'
import OperatorLaunchpad from '../components/OperatorLaunchpad'

function studyLabel(missionType: string, objective: string): string {
  if (missionType === 'product_discovery') return 'Discovery'
  if (missionType === 'brand_challenge' && objective === 'depth') return 'Positioning'
  if (missionType === 'brand_challenge' && objective === 'conquest') return 'Head-to-Head'
  return 'Study'
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  drafts: OperatorDraftMission[]
}

export default function AdminStudiesClient({ drafts }: Props) {
  const router = useRouter()

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 900, margin: '0 auto', padding: '36px 32px' }}>
      <OperatorLaunchpad variant="compact" />

      {drafts.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 400,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              Your drafts
            </h3>
            <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>{drafts.length} in progress</span>
          </div>

          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
            }}
          >
            {drafts.map((draft, i) => (
              <button
                key={draft.mission_id}
                type="button"
                onClick={() => {
                  const params = new URLSearchParams({
                    brandId: String(draft.brand_id),
                    missionId: draft.mission_id,
                  })
                  router.push(`/admin/studies/new?${params.toString()}`)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '16px 20px',
                  border: 'none',
                  borderBottom: i < drafts.length - 1 ? '1px solid var(--ink-10)' : 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>
                    {studyLabel(draft.mission_type, draft.campaign_objective)} · {draft.brand_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-50)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {draft.product_name ?? 'No product selected yet'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 16 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>{relativeTime(draft.created_at)}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--sage)' }}>Continue →</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
