'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { OperatorDraftMission } from '@/lib/queries'
import type { OperatorStudyRow } from '@/lib/studies/types'
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

function isMultiBrand(studies: OperatorStudyRow[]): boolean {
  const ids = new Set<number>()
  for (const row of studies) {
    if (row.brand_id != null) ids.add(row.brand_id)
  }
  return ids.size > 1
}

function claimProgressLabel(row: OperatorStudyRow): string {
  if (row.total_claims === 0) return 'No responses yet'
  return `${row.completed_claims} / ${row.total_claims} claims`
}

interface Props {
  drafts: OperatorDraftMission[]
  studies: OperatorStudyRow[]
}

export default function AdminStudiesClient({ drafts, studies }: Props) {
  const router = useRouter()
  const showBrand = isMultiBrand(studies)

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
            Published studies
          </h3>
          {studies.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>
              {studies.length} {studies.length === 1 ? 'study' : 'studies'}
            </span>
          )}
        </div>

        {studies.length === 0 ? (
          <div
            style={{
              background: 'var(--surface-1)',
              border: '1px dashed var(--ink-10)',
              borderRadius: 'var(--r-md)',
              padding: '28px 20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: 0, lineHeight: 1.55 }}>
              No published studies yet — launch one above.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
            }}
          >
            {studies.map((row, i) => {
              const muted = row.is_finished
              const titleColor = muted ? 'var(--ink-50)' : 'var(--ink)'
              const metaColor = muted ? 'var(--ink-30)' : 'var(--ink-50)'
              const pill = row.is_finished
                ? { label: 'Finished', color: 'var(--ink-50)', background: 'var(--surface-1)' }
                : { label: 'Active', color: 'var(--sage)', background: 'var(--sage-soft)' }

              return (
                <Link
                  key={row.mission_id}
                  href={`/reports/${row.mission_id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    width: '100%',
                    padding: '16px 20px',
                    borderBottom: i < studies.length - 1 ? '1px solid var(--ink-10)' : 'none',
                    textDecoration: 'none',
                    color: 'inherit',
                    opacity: muted ? 0.72 : 1,
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500, color: titleColor }}>
                        {row.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: 10,
                          color: pill.color,
                          background: pill.background,
                        }}
                      >
                        {pill.label}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: metaColor,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.focal_product_name ?? 'Product pending'}
                      {showBrand && row.brand_name ? ` · ${row.brand_name}` : ''}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-mono, var(--font-sans))',
                        color: metaColor,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {claimProgressLabel(row)}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: muted ? 'var(--ink-30)' : 'var(--sage)' }}>
                      View report →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
