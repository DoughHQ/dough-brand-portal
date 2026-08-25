import type { CSSProperties } from 'react'
import EvidenceCharts from '@/components/categoryDashboard/EvidenceCharts'
import EvidenceStrip from '@/components/categoryDashboard/EvidenceStrip'
import FocalDumbbell from '@/components/categoryDashboard/FocalDumbbell'
import MetricStrip from '@/components/categoryDashboard/MetricStrip'
import ModelDrawer from '@/components/categoryDashboard/ModelDrawer'
import OverviewFocalSelect from '@/components/categoryDashboard/OverviewFocalSelect'
import PairwiseHeatmap from '@/components/categoryDashboard/PairwiseHeatmap'
import PreferenceField from '@/components/categoryDashboard/PreferenceField'
import {
  claimCaption,
  focalLeadSentence,
  formatAsOf,
  formatCount,
} from '@/lib/categoryReport/copy'
import { relativeTime } from '@/lib/categoryReadiness.shared'
import type {
  CategoryMode,
  CategoryReport,
  CategoryScope,
  RankedProduct,
} from '@/lib/categoryReport/types'

const CANVAS_WIDTH = 960

const belowFoldH2: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 18,
  fontWeight: 400,
  color: 'var(--ink)',
  margin: '0 0 8px',
  letterSpacing: '-0.01em',
}

function FocalCut({ report }: { report: CategoryReport }) {
  const focal = report.focal
  if (!focal) return null
  const hasAny = focal.above.length + focal.tied.length + focal.below.length > 0
  if (!hasAny && !focal.method_note) return null

  const groups: { key: string; label: string; rows: RankedProduct[] }[] = [
    { key: 'above', label: 'Ahead of you', rows: focal.above },
    { key: 'tied', label: 'Statistically tied', rows: focal.tied },
    { key: 'below', label: 'Behind you', rows: focal.below },
  ]
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={belowFoldH2}>Versus {focal.name}</h2>
      <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: '0 0 14px', lineHeight: 1.5 }}>
        {focalLeadSentence(focal.above.length, focal.tied.length, focal.below.length)}
      </p>
      {hasAny ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {groups.map((g) => (
            <div key={g.key} style={{ minHeight: 64 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: g.key === 'tied' ? 'var(--sage)' : 'var(--ink-30)',
                  marginBottom: 10,
                }}
              >
                {g.label}
                <span style={{ fontWeight: 400, marginLeft: 6 }}>{g.rows.length}</span>
              </div>
              {g.rows.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--ink-30)' }}>—</div>
              ) : (
                g.rows.map((p) => (
                  <div key={p.product_id} style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 6 }}>
                    {p.name}
                    <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>{p.brand}</div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      ) : null}
      {focal.method_note ? (
        <p style={{ fontSize: 12, color: 'var(--ink-30)', margin: '12px 0 0', lineHeight: 1.5 }}>
          {focal.method_note}
        </p>
      ) : null}
    </section>
  )
}

function GateRefusal({ report }: { report: CategoryReport }) {
  const e = report.evidence
  return (
    <div
      style={{
        background: 'var(--paper)',
        borderRadius: 4,
        padding: '48px 40px',
        boxShadow: '0 0 0 1px var(--mist)',
      }}
    >
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
        Below reporting floor
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 32,
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 12px',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        Not enough distinct people yet
      </h2>
      <p
        style={{
          fontSize: 16,
          color: 'var(--ink-80)',
          lineHeight: 1.55,
          maxWidth: 560,
          margin: '0 0 28px',
        }}
      >
        {report.gate.message ??
          'A brand cannot see a ranking until enough distinct people have battled in this category.'}
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 28,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>Raters</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24 }}>
            {formatCount(e.distinct_raters)}
            <span style={{ fontSize: 14, color: 'var(--ink-30)' }}>
              {' '}
              / {formatCount(e.rater_threshold)}
            </span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>Battles</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24 }}>
            {formatCount(e.battles)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>
            Products battled
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24 }}>
            {formatCount(e.products_battled)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 4 }}>As of</div>
          <div style={{ fontSize: 16, color: 'var(--ink)' }}>{formatAsOf(report.meta.as_of)}</div>
        </div>
      </div>
    </div>
  )
}

function MethodologyFoot({ report, showRanking }: { report: CategoryReport; showRanking: boolean }) {
  return (
    <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--mist)' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
          marginBottom: 8,
        }}
      >
        Methodology
      </div>
      {report.meta.elo_note ? (
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink-50)',
            lineHeight: 1.55,
            margin: '0 0 8px',
            maxWidth: 720,
          }}
        >
          {report.meta.elo_note}
        </p>
      ) : null}
      {report.gate.message && showRanking ? (
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink-50)',
            lineHeight: 1.55,
            margin: '0 0 8px',
            maxWidth: 720,
          }}
        >
          {report.gate.message}
        </p>
      ) : null}
    </div>
  )
}

function isCategoryScope(s: string): s is CategoryScope {
  return s === 'l2' || s === 'l3' || s === 'compare_group'
}

export default function CategoryDashboardCanvas({ report }: { report: CategoryReport }) {
  const isAdmin = report.meta.mode === 'admin'
  /** Brand Overview: destination layout. Admin instrument: denser engine room. */
  const overview = !isAdmin
  const ranking = report.ranking
  const showRanking = ranking != null
  const components = showRanking
    ? [...ranking.components].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    : []
  const separatedKicker =
    report.statistics?.separated_items != null && report.statistics?.items_total != null
      ? `${formatCount(report.statistics.separated_items)} of ${formatCount(report.statistics.items_total)} items separated`
      : null

  const caption =
    isAdmin || showRanking
      ? claimCaption({
          separated_items: report.statistics?.separated_items ?? null,
          items_total: report.statistics?.items_total ?? null,
          components_found: report.statistics?.components_found ?? null,
          items_with_ci: report.statistics?.items_with_ci ?? null,
          distinct_raters: report.evidence.distinct_raters,
          products_with_battles: report.evidence.coverage?.products_with_battles ?? null,
          products_ranked: report.evidence.coverage?.products_ranked ?? null,
          statistics_note: report.statistics?.note ?? null,
        })
      : null

  const focalId =
    report.focal?.product_id ??
    ranking?.components.flatMap((c) => c.products).find((p) => p.is_focal)?.product_id ??
    null
  const focalName =
    report.focal?.name ??
    ranking?.components.flatMap((c) => c.products).find((p) => p.is_focal)?.name ??
    null

  const scopeOk =
    isCategoryScope(report.meta.scope) && report.meta.scope_id != null
      ? { scope: report.meta.scope, scopeId: report.meta.scope_id }
      : null
  const mode: CategoryMode = isAdmin ? 'admin' : 'brand'

  return (
    <div style={{ maxWidth: CANVAS_WIDTH, margin: '0 auto', padding: '36px 32px 96px' }}>
      <header style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
            marginBottom: overview ? 20 : 12,
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 280px' }}>
            {!overview ? (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-30)',
                  marginBottom: 6,
                }}
              >
                {report.meta.scope_name || 'Category'}
              </div>
            ) : null}
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: overview ? 40 : 34,
                fontWeight: 400,
                color: 'var(--ink)',
                margin: '0 0 8px',
                letterSpacing: '-0.03em',
                lineHeight: 1.12,
              }}
            >
              {report.meta.scope_name || 'Untitled category'}
            </h1>
            {overview ? (
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--ink-50)',
                  margin: 0,
                  lineHeight: 1.5,
                  maxWidth: 520,
                }}
              >
                Experienced consumer preference across the category
              </p>
            ) : caption ? (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 17,
                  fontWeight: 400,
                  color: 'var(--ink)',
                  margin: 0,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.4,
                  maxWidth: 720,
                }}
              >
                {caption}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: 0 }}>
                As of {formatAsOf(report.meta.as_of)}
                {report.evidence.last_battle_at
                  ? ` · Last battle ${relativeTime(report.evidence.last_battle_at) || '—'}`
                  : ''}
              </p>
            )}
          </div>
          {overview && scopeOk ? (
            <OverviewFocalSelect
              catalog={report.catalog}
              focal={focalId}
              scope={scopeOk.scope}
              scopeId={scopeOk.scopeId}
              mode={mode}
            />
          ) : null}
        </div>

        {overview ? <MetricStrip report={report} /> : null}

        {overview && caption ? (
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 18,
              fontWeight: 400,
              color: 'var(--ink)',
              margin: '18px 0 0',
              letterSpacing: '-0.015em',
              lineHeight: 1.4,
              maxWidth: 720,
            }}
          >
            {caption}
          </p>
        ) : null}
      </header>

      {!isAdmin && !showRanking ? (
        <GateRefusal report={report} />
      ) : (
        <>
          {showRanking ? (
            <>
              <PreferenceField
                components={components}
                undefeated={ranking.undefeated}
                winless={ranking.winless}
                admin={isAdmin}
                eloTransform={report.statistics?.elo_transform ?? null}
                separatedKicker={separatedKicker}
              />
              {focalId != null && focalName && report.pairwise ? (
                <FocalDumbbell
                  pairwise={report.pairwise}
                  focalProductId={focalId}
                  focalName={focalName}
                />
              ) : null}
              <FocalCut report={report} />
            </>
          ) : isAdmin ? (
            <p style={{ fontSize: 14, color: 'var(--ink-50)', margin: '0 0 32px' }}>
              {report.gate.message ?? 'No ranking in this payload.'}
            </p>
          ) : null}

          {/* Deep dive — admin instrument only */}
          {isAdmin && report.pairwise ? (
            <PairwiseHeatmap pairwise={report.pairwise} ranking={ranking} />
          ) : isAdmin ? (
            <p style={{ fontSize: 13, color: 'var(--ink-30)', marginBottom: 32 }}>
              Pairwise block missing from payload.
            </p>
          ) : null}

          {overview && (showRanking || isAdmin) ? (
            <EvidenceStrip report={report} />
          ) : null}

          {isAdmin ? <EvidenceCharts report={report} /> : null}

          {isAdmin ? <ModelDrawer report={report} defaultOpen /> : null}
        </>
      )}

      <MethodologyFoot report={report} showRanking={showRanking} />
    </div>
  )
}
