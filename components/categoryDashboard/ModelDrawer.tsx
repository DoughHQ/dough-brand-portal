'use client'

import { useState } from 'react'
import {
  formatCount,
  formatShare,
  statisticsHeadline,
} from '@/lib/categoryReport/copy'
import type {
  CategoryReport,
  CategoryStatistics,
} from '@/lib/categoryReport/types'

function Field({
  label,
  value,
  note,
}: {
  label: string
  value: string | null
  note: string | null
}) {
  return (
    <div style={{ padding: '8px 0', borderTop: '1px solid var(--ink-10)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-50)' }}>{label}</div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: value != null ? 'var(--ink)' : 'var(--ink-30)',
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'right',
            maxWidth: '70%',
          }}
        >
          {value ?? '—'}
        </div>
      </div>
      {note ? (
        <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 4, lineHeight: 1.45 }}>
          {note}
        </div>
      ) : null}
    </div>
  )
}

function StatisticsFields({ s }: { s: CategoryStatistics }) {
  const headline = statisticsHeadline(s)
  return (
    <>
      {headline ? (
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 18,
            fontWeight: 400,
            color: 'var(--ink)',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
          }}
        >
          {headline}
        </p>
      ) : null}
      <Field label="Model" value={s.model} note={null} />
      <Field label="Elo transform" value={s.elo_transform} note={null} />
      <Field label="Clusters (raters)" value={formatCount(s.n_clusters)} note={null} />
      <Field
        label="Design effect (mean)"
        value={s.design_effect_mean == null ? null : String(s.design_effect_mean)}
        note={s.design_effect_note}
      />
      <Field label="Effective n (total)" value={formatCount(s.effective_n_total)} note={null} />
      <Field label="Components found" value={formatCount(s.components_found)} note={null} />
      <Field label="Separated items" value={formatCount(s.separated_items)} note={null} />
      <Field label="Items with intervals" value={formatCount(s.items_with_ci)} note={null} />
      <Field label="Items total" value={formatCount(s.items_total)} note={s.note} />
    </>
  )
}

export default function ModelDrawer({
  report,
  defaultOpen,
}: {
  report: CategoryReport
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const e = report.evidence

  return (
    <section
      style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 12,
        marginBottom: 28,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 18px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          textAlign: 'left',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-30)',
              marginBottom: 4,
            }}
          >
            Model & estimator
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
            {report.statistics?.model ?? 'Bradley-Terry details'}
          </div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--ink-50)' }}>{open ? 'Hide' : 'Show'}</span>
      </button>
      {open ? (
        <div style={{ padding: '0 18px 16px' }}>
          {report.statistics ? (
            <StatisticsFields s={report.statistics} />
          ) : (
            <Field
              label="Statistics"
              value={null}
              note="Statistics block missing from payload."
            />
          )}
          <Field label="Distinct raters" value={formatCount(e.distinct_raters)} note={null} />
          <Field label="Rater threshold" value={formatCount(e.rater_threshold)} note={null} />
          <Field label="Battles" value={formatCount(e.battles)} note={null} />
          <Field label="Products battled" value={formatCount(e.products_battled)} note={null} />
          <Field
            label="Design effect (evidence)"
            value={e.design_effect_mean == null ? null : String(e.design_effect_mean)}
            note={null}
          />
          {e.coverage ? (
            <>
              <Field
                label="Products ranked"
                value={formatCount(e.coverage.products_ranked)}
                note={null}
              />
              <Field
                label="Products with battles"
                value={formatCount(e.coverage.products_with_battles)}
                note={null}
              />
              <Field
                label="Active in scope"
                value={
                  e.coverage.products_active_in_scope == null
                    ? null
                    : formatCount(e.coverage.products_active_in_scope)
                }
                note={e.coverage.note}
              />
            </>
          ) : null}
          {e.concentration ? (
            <>
              <Field
                label="Top-3 battle share"
                value={formatShare(e.concentration.top3_battle_share)}
                note={null}
              />
              <Field
                label="Battles / product (median)"
                value={
                  e.concentration.battles_per_product_median == null
                    ? null
                    : String(e.concentration.battles_per_product_median)
                }
                note={e.concentration.note}
              />
            </>
          ) : null}
          {e.rater_concentration ? (
            <Field
              label="Max single-rater share"
              value={formatShare(e.rater_concentration.max_single_rater_share)}
              note={e.rater_concentration.note}
            />
          ) : null}
          {e.position_balance ? (
            <>
              <Field
                label="Instrumented battles"
                value={formatCount(e.position_balance.instrumented_battles)}
                note={null}
              />
              <Field
                label="Left-slot win share"
                value={formatShare(e.position_balance.left_slot_win_share)}
                note={e.position_balance.note}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
