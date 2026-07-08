'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { StatusPill } from '@/components/ui'
import type { StatusPillStatus } from '@/components/ui'
import { fetchStudiesIndex } from '@/lib/studies/fetchStudies'
import {
  mapReportStatus,
  type CampaignRow,
  type MissionRow,
  type MissionReportRow,
  type ProductRow,
} from '@/lib/studies/types'

interface Props {
  brandName: string
  brandId: number
}

function StudiesTopBar({ brandName }: { brandName: string }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-2) var(--space-3)',
        borderBottom: '1px solid var(--mist)',
        background: 'var(--paper)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 400,
          color: 'var(--sage-dark)',
          letterSpacing: '-0.02em',
        }}
      >
        dough<span style={{ color: 'var(--ink-faint)' }}>.</span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink-muted)',
        }}
      >
        {brandName}
      </div>
    </header>
  )
}

function CampaignSkeleton() {
  return (
    <section style={{ marginBottom: 'var(--space-4)' }}>
      <div
        style={{
          height: 14,
          width: 180,
          background: 'var(--mist)',
          borderRadius: 4,
          marginBottom: 'var(--space-2)',
        }}
      />
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            height: 56,
            background: 'var(--mist)',
            borderRadius: 'var(--radius-control)',
            marginBottom: 8,
            opacity: 0.55 + i * 0.15,
          }}
        />
      ))}
    </section>
  )
}

function MissionRowView({
  mission,
  product,
  report,
  reportHref,
}: {
  mission: MissionRow
  product: ProductRow | undefined
  report: MissionReportRow | undefined
  reportHref: string | null
}) {
  const status = mapReportStatus(report)
  const pillStatus: StatusPillStatus =
    status === 'ready' ? 'ready' : status === 'gathering' ? 'gathering' : 'not_started'
  const isLinkable = (status === 'ready' || status === 'gathering') && report != null

  const rowInner = (
    <>
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--ink)',
            marginBottom: 2,
          }}
        >
          {mission.title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--ink-muted)',
          }}
        >
          {product?.product_name_short ?? 'Product pending'}
        </div>
      </div>

      <div style={{ flex: '0 0 auto' }}>
        <StatusPill status={pillStatus} />
      </div>

      <div
        style={{
          flex: '0 1 200px',
          textAlign: 'right',
          minWidth: 120,
        }}
      >
        {isLinkable ? (
          <>
            {report?.total_completions != null ? (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--ink-muted)',
                  marginBottom: 4,
                }}
              >
                {report.total_completions} response
                {report.total_completions === 1 ? '' : 's'}
              </div>
            ) : null}
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--sage)',
              }}
            >
              View results →
            </span>
          </>
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: 'var(--ink-faint)',
            }}
          >
            Not launched yet
          </span>
        )}
      </div>
    </>
  )

  const rowStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px 20px',
    padding: '14px 0',
    borderBottom: '1px solid var(--mist)',
    transition: 'background var(--motion-duration) var(--motion-ease)',
  }

  if (isLinkable && reportHref) {
    return (
      <Link
        href={reportHref}
        style={{
          ...rowStyle,
          textDecoration: 'none',
          color: 'inherit',
          margin: '0 calc(-1 * var(--space-2))',
          padding: '14px var(--space-2)',
          borderRadius: 'var(--radius-control)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--mist)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        {rowInner}
      </Link>
    )
  }

  return <div style={rowStyle}>{rowInner}</div>
}

export default function StudiesClient({
  brandName,
  brandId,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [securityViolation, setSecurityViolation] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [missionsByCampaign, setMissionsByCampaign] = useState<
    Record<string, MissionRow[]>
  >({})
  const [reportsByMission, setReportsByMission] = useState<
    Record<string, MissionReportRow>
  >({})
  const [productsById, setProductsById] = useState<Record<number, ProductRow>>({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const result = await fetchStudiesIndex(supabase, brandId)
      if (cancelled) return

      if (!result.ok) {
        if (result.securityViolation) {
          setSecurityViolation(result.detail)
        } else {
          setError(result.error)
        }
        setLoading(false)
        return
      }

      setCampaigns(result.campaigns)
      setMissionsByCampaign(result.missionsByCampaign)
      setReportsByMission(result.reportsByMission)
      setProductsById(result.productsById)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [brandId, router])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <StudiesTopBar brandName={brandName} />

      <div
        style={{
          flex: 1,
          maxWidth: 820,
          width: '100%',
          margin: '0 auto',
          padding: 'var(--space-4) var(--space-3)',
        }}
      >
        <header style={{ marginBottom: 'var(--space-4)' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              fontWeight: 400,
              color: 'var(--sage-dark)',
              marginBottom: 'var(--space-1)',
              lineHeight: 1.15,
            }}
          >
            Studies
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--ink-muted)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Preference results from verified consumers.
          </p>
        </header>

        {securityViolation ? (
          <div
            role="alert"
            style={{
              background: 'var(--clay-soft)',
              border: '1px solid var(--clay)',
              borderRadius: 'var(--radius-card)',
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--clay)',
                marginBottom: 8,
              }}
            >
              Data scope violation detected
            </div>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--ink)',
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {securityViolation}
            </p>
          </div>
        ) : null}

        {error ? (
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--clay)',
              marginBottom: 'var(--space-3)',
            }}
          >
            {error}
          </p>
        ) : null}

        {loading ? (
          <>
            <CampaignSkeleton />
            <CampaignSkeleton />
          </>
        ) : campaigns.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-4) var(--space-3)',
              border: '1px dashed var(--mist)',
              borderRadius: 'var(--radius-card)',
              background: 'var(--paper)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                color: 'var(--sage-dark)',
                marginBottom: 'var(--space-2)',
              }}
            >
              No studies yet.
            </div>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: 'var(--ink-muted)',
                lineHeight: 1.55,
                margin: 0,
                maxWidth: 400,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Your Dough account lead sets up studies for your products. They&apos;ll appear
              here.
            </p>
          </div>
        ) : (
          campaigns.map((campaign) => {
            const missions = missionsByCampaign[campaign.id] ?? []
            return (
              <section key={campaign.id} style={{ marginBottom: 'var(--space-4)' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--sage-dark)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  {campaign.name}
                </h2>
                {missions.length === 0 ? (
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      color: 'var(--ink-faint)',
                      margin: 0,
                    }}
                  >
                    No missions in this campaign yet.
                  </p>
                ) : (
                  <div>
                    {missions.map((mission) => {
                      const report = reportsByMission[mission.id]
                      const product =
                        mission.product_id != null
                          ? productsById[mission.product_id]
                          : undefined
                      const reportHref =
                        report &&
                        (mapReportStatus(report) === 'ready' ||
                          mapReportStatus(report) === 'gathering')
                          ? `/reports/${mission.id}`
                          : null

                      return (
                        <MissionRowView
                          key={mission.id}
                          mission={mission}
                          product={product}
                          report={report}
                          reportHref={reportHref}
                        />
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
