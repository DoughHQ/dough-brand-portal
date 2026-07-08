'use client'

import Link from 'next/link'
import type { PortalUser, Brand, BrandMissionListItem } from '@/lib/queries'
import { STUDY_TYPES } from '@/lib/ihut/constants'

interface Props {
  portalUser: PortalUser
  brand: Brand
  missions: BrandMissionListItem[]
  isImpersonating: boolean
}

function wizardStudyLabel(missionType: string, campaignObjective: string): string {
  if (missionType === 'product_discovery') return 'Discovery'
  if (missionType === 'brand_challenge' && campaignObjective === 'depth') return 'Positioning'
  if (missionType === 'brand_challenge' && campaignObjective === 'conquest') return 'Head-to-Head'
  return 'IHUT Study'
}

function statusStyle(status: string): { color: string; background: string } {
  switch (status) {
    case 'draft':
      return { color: 'var(--ink-50)', background: 'var(--surface-1)' }
    case 'active':
      return { color: 'var(--sage)', background: 'var(--sage-pale)' }
    case 'completed':
      return { color: 'var(--ink-30)', background: 'var(--surface-2)' }
    default:
      return { color: 'var(--ink-50)', background: 'var(--surface-1)' }
  }
}

export default function IhutListClient({ brand, missions, isImpersonating }: Props) {
  const newHref = '/ihut/new'

  const drafts = missions.filter((m) => m.status === 'draft')
  const live = missions.filter((m) => m.status !== 'draft')

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 900, margin: '0 auto', padding: '36px 32px' }}>
      {isImpersonating && (
        <div
          style={{
            background: 'var(--amber-pale)',
            border: '1px solid rgba(192,120,24,0.2)',
            borderRadius: 'var(--r-md)',
            padding: '10px 16px',
            marginBottom: 24,
            fontSize: 12,
            color: 'var(--amber)',
          }}
        >
          Viewing as {brand.brand_name} — this is exactly what they see.
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 28,
              fontWeight: 400,
              color: 'var(--ink)',
              marginBottom: 6,
            }}
          >
            IHUT Studies
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55 }}>
            Launch in-home usage tests with real Dough users. Drafts save automatically.
          </p>
        </div>
        <Link
          href={newHref}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'white',
            background: 'var(--sage)',
            borderRadius: 'var(--r-sm)',
            padding: '9px 18px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          + New study
        </Link>
      </div>

      {drafts.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-30)',
              marginBottom: 12,
            }}
          >
            Drafts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {drafts.map((m) => {
              const resumeParam = `?missionId=${m.mission_id}`
              const studyLabel = wizardStudyLabel(m.mission_type, m.campaign_objective)
              return (
                <div
                  key={m.mission_id}
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--ink-10)',
                    borderRadius: 'var(--r-md)',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                        {studyLabel}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: 10,
                          ...statusStyle(m.status),
                        }}
                      >
                        Draft
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>
                      {m.product_name ?? 'No product selected yet'}
                    </div>
                  </div>
                  <Link
                    href={`/ihut/new${resumeParam}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--sage)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Continue setup →
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {live.length > 0 && (
        <section>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-30)',
              marginBottom: 12,
            }}
          >
            Active & completed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {live.map((m) => {
              const studyLabel = wizardStudyLabel(m.mission_type, m.campaign_objective)
              const badge = statusStyle(m.status)
              const reportHref = `/reports/${m.mission_id}`
              return (
                <div
                  key={m.mission_id}
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--ink-10)',
                    borderRadius: 'var(--r-md)',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                        {studyLabel}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: 10,
                          color: badge.color,
                          background: badge.background,
                        }}
                      >
                        {m.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>
                      {m.product_name ?? m.title}
                    </div>
                  </div>
                  <Link
                    href={reportHref}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--sage)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    View report →
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {missions.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--surface-1)',
            borderRadius: 'var(--r-md)',
            border: '1px dashed var(--ink-10)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              color: 'var(--ink)',
              marginBottom: 8,
            }}
          >
            No studies yet
          </div>
          <p style={{ fontSize: 14, color: 'var(--ink-50)', marginBottom: 20, lineHeight: 1.55 }}>
            Launch your first IHUT to learn what occasions, audiences, and competitors your products
            win with.
          </p>
          <Link
            href={newHref}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'white',
              background: 'var(--sage)',
              borderRadius: 'var(--r-sm)',
              padding: '9px 18px',
              textDecoration: 'none',
            }}
          >
            Start a study →
          </Link>
          <div style={{ marginTop: 20, fontSize: 12, color: 'var(--ink-30)' }}>
            Study types: {STUDY_TYPES.map((s) => s.label).join(' · ')}
          </div>
        </div>
      )}
    </div>
  )
}
