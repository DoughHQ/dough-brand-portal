'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  ConfidenceBar,
  MetricHeadline,
  MethodologyDisclosure,
} from '@/components/ui'
import { formatPct } from '@/lib/portal-ui/format'
import { fetchMissionReport } from '@/lib/missionReport/fetchReport'
import type { MissionReportRow } from '@/lib/missionReport/types'
import { sortAttributeSignals } from '@/lib/missionReport/types'
import { refreshMissionReportAction } from './actions'

interface Props {
  missionId: string
  backHref: string
}

function formatSnapshotDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatRelativeTime(iso: string): string {
  try {
    const then = new Date(iso).getTime()
    const now = Date.now()
    const diffSec = Math.round((now - then) / 1000)
    if (diffSec < 60) return 'just now'
    const diffMin = Math.round(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.round(diffMin / 60)
    if (diffHr < 48) return `${diffHr}h ago`
    const diffDay = Math.round(diffHr / 24)
    return `${diffDay}d ago`
  } catch {
    return iso
  }
}

function ReportSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ height: 36, width: 280, background: 'var(--mist)', borderRadius: 6 }} />
      <div style={{ height: 72, width: 200, background: 'var(--mist)', borderRadius: 6 }} />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: 48,
            background: 'var(--mist)',
            borderRadius: 'var(--radius-control)',
            opacity: 0.5 + i * 0.15,
          }}
        />
      ))}
    </div>
  )
}

function UnavailableState({ backHref }: { backHref: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-4) var(--space-3)',
        border: '1px dashed var(--mist)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--paper)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 400,
          color: 'var(--sage-dark)',
          marginBottom: 'var(--space-2)',
        }}
      >
        This report isn&apos;t available yet.
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--ink-muted)',
          lineHeight: 1.55,
          margin: '0 0 var(--space-3)',
          maxWidth: 420,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        It may still be gathering responses, or your account doesn&apos;t have access.
      </p>
      <Link
        href={backHref}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--sage)',
          textDecoration: 'none',
        }}
      >
        ← Back to studies
      </Link>
    </div>
  )
}

function ReportBody({ report }: { report: MissionReportRow }) {
  const headline = report.provenance_composition?.headline
  const reliability = report.provenance_composition?.reliability
  const competitiveRows = useMemo(
    () => sortAttributeSignals(report.attribute_signals ?? []),
    [report.attribute_signals]
  )

  return (
    <>
      {report.min_cell_size_met === false ? (
        <div
          style={{
            background: 'var(--amber-soft)',
            border: '1px solid rgba(192, 120, 24, 0.22)',
            borderRadius: 'var(--radius-card)',
            padding: 'var(--space-2) var(--space-3)',
            marginBottom: 'var(--space-4)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--amber)',
            lineHeight: 1.55,
          }}
        >
          This study is still gathering responses. Most results below are held back until
          the sample is large enough to report with confidence.
        </div>
      ) : null}

      <MetricHeadline
        estimandLabel="Win rate vs. the category field"
        value={headline?.value ?? null}
        ciLow={headline?.ci_low ?? null}
        ciHigh={headline?.ci_high ?? null}
        n_users={headline?.n_users ?? report.provenance_composition?.n_users ?? null}
        n_decisive={headline?.n_decisive ?? null}
        reportable={headline?.reportable ?? false}
        withheldReason={headline?.withheld_reason}
      />

      <section style={{ marginBottom: 'var(--space-4)' }}>
        <h2
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--sage-dark)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Head-to-head
        </h2>
        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--mist)',
            borderRadius: 'var(--radius-card)',
            padding: 'var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {competitiveRows.length === 0 ? (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: 'var(--ink-muted)',
                margin: 0,
              }}
            >
              No head-to-head pairings in this snapshot yet.
            </p>
          ) : (
            competitiveRows.map((row, idx) => (
              <ConfidenceBar
                key={`${row.opponent_product_id}-${idx}`}
                label={row.opponent_name}
                sublabel={row.opponent_brand}
                value={row.reportable ? row.value : null}
                ciLow={row.ci_low}
                ciHigh={row.ci_high}
                reportable={row.reportable && row.value != null}
                withheldReason={row.withheld_reason ?? undefined}
              />
            ))
          )}
        </div>
      </section>

      {reliability?.reportable && reliability.consistency_rate != null ? (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--ink-muted)',
            marginBottom: 'var(--space-3)',
            lineHeight: 1.5,
          }}
        >
          Instrument reliability: {formatPct(reliability.consistency_rate)} test-retest
          consistency
          {reliability.ci_low != null && reliability.ci_high != null
            ? ` [${formatPct(reliability.ci_low)}–${formatPct(reliability.ci_high)}]`
            : ''}
        </div>
      ) : null}

      {report.engagement_bias_disclosure ? (
        <MethodologyDisclosure disclosure={report.engagement_bias_disclosure} />
      ) : null}
    </>
  )
}

export default function MissionReportClient({ missionId, backHref }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [report, setReport] = useState<MissionReportRow | null>(null)
  const [focalProductName, setFocalProductName] = useState<string | null>(null)

  const loadReport = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.replace('/login')
      return null
    }
    const result = await fetchMissionReport(supabase, missionId)
    if (!result.ok) {
      setError(result.error)
      return null
    }
    setReport(result.report)
    setFocalProductName(result.focalProductName)
    return result.report
  }, [missionId, router])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await loadReport()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [loadReport])

  async function handleRefresh() {
    setRefreshing(true)
    setError(null)
    try {
      await refreshMissionReportAction(missionId)
      await loadReport()
      setToast('Results refreshed.')
      setTimeout(() => setToast(null), 3200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not refresh results')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cream)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: 'var(--space-4) var(--space-3)',
        }}
      >
        <Link
          href={backHref}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--ink-faint)',
            textDecoration: 'none',
            marginBottom: 'var(--space-3)',
            display: 'inline-block',
          }}
        >
          ← Back to studies
        </Link>

        {loading ? (
          <ReportSkeleton />
        ) : error ? (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--clay)' }}>
            {error}
          </p>
        ) : !report ? (
          <UnavailableState backHref={backHref} />
        ) : (
          <>
            <header
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(26px, 5vw, 32px)',
                    fontWeight: 400,
                    color: 'var(--sage-dark)',
                    marginBottom: 6,
                    lineHeight: 1.15,
                  }}
                >
                  {focalProductName ?? 'Focal product'}
                </h1>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    color: 'var(--ink-muted)',
                    margin: 0,
                  }}
                >
                  Preference study · snapshot {formatSnapshotDate(report.snapshot_date)}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-faint)',
                  }}
                >
                  Updated {formatRelativeTime(report.computed_at)}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={refreshing}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--sage-dark)',
                    background: 'var(--paper)',
                    border: '1px solid var(--mist)',
                    borderRadius: 'var(--radius-control)',
                    padding: '8px 14px',
                    cursor: refreshing ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: refreshing ? 0.75 : 1,
                    transition: 'opacity var(--motion-duration) var(--motion-ease)',
                  }}
                >
                  {refreshing ? (
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        border: '2px solid var(--mist)',
                        borderTopColor: 'var(--sage)',
                        borderRadius: '50%',
                        animation: 'portalSpin 0.7s linear infinite',
                      }}
                    />
                  ) : null}
                  {refreshing ? 'Refreshing…' : 'Refresh results'}
                </button>
              </div>
            </header>

            {toast ? (
              <div
                role="status"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--sage-dark)',
                  background: 'var(--sage-soft)',
                  border: '1px solid rgba(62, 107, 74, 0.2)',
                  borderRadius: 'var(--radius-control)',
                  padding: '8px 12px',
                  marginBottom: 'var(--space-3)',
                }}
              >
                {toast}
              </div>
            ) : null}

            <ReportBody report={report} />
          </>
        )}
      </div>
    </div>
  )
}
