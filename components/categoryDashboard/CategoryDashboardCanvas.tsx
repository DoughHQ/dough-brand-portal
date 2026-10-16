import EvidenceCharts from '@/components/categoryDashboard/EvidenceCharts'
import EvidenceStrip from '@/components/categoryDashboard/EvidenceStrip'
import FocalDumbbell from '@/components/categoryDashboard/FocalDumbbell'
import MetricStrip from '@/components/categoryDashboard/MetricStrip'
import ModelDrawer from '@/components/categoryDashboard/ModelDrawer'
import OverviewFocalSelect from '@/components/categoryDashboard/OverviewFocalSelect'
import PairwiseHeatmap from '@/components/categoryDashboard/PairwiseHeatmap'
import PreferenceField from '@/components/categoryDashboard/PreferenceField'
import { claimCaption, formatAsOf, formatCount } from '@/lib/categoryReport/copy'
import { relativeTime } from '@/lib/categoryReadiness.shared'
import type { CategoryMode, CategoryReport, CategoryScope } from '@/lib/categoryReport/types'
import { FocalCut } from './FocalCut'
import { GateRefusal } from './GateRefusal'
import { MethodologyFoot } from './MethodologyFoot'

const CANVAS_WIDTH = 960

function isCategoryScope(s: string): s is CategoryScope {
  return s === 'l2' || s === 'l3' || s === 'compare_group'
}

export default function CategoryDashboardCanvas({
  report,
  linkMode = 'preview',
}: {
  report: CategoryReport
  /** Brand live Overview vs admin report-preview harness. */
  linkMode?: 'brand' | 'preview'
}) {
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
              linkMode={linkMode}
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
