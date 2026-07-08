'use client'

import type { ReactNode } from 'react'
import {
  ConfidenceBar,
  MetricHeadline,
  MethodologyDisclosure,
  StatusPill,
} from '@/components/ui'

function PreviewCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--mist)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-3)',
        marginBottom: 'var(--space-3)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          marginBottom: 'var(--space-3)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

const SAMPLE_DISCLOSURE =
  'Respondents compared products they have purchased and consumed in forced-choice battles. Win rates reflect preference under real usage, not stated intent. Engagement bias is monitored and disclosed when present.'

export default function DesignPreviewClient() {
  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        maxWidth: 720,
        margin: '0 auto',
        padding: 'var(--space-4) var(--space-3)',
        color: 'var(--ink)',
      }}
    >
      <header style={{ marginBottom: 'var(--space-4)' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            marginBottom: 'var(--space-1)',
          }}
        >
          Design system
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 400,
            color: 'var(--sage-dark)',
            marginBottom: 'var(--space-2)',
            lineHeight: 1.15,
          }}
        >
          Portal primitives
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.55, margin: 0 }}>
          Precision instrument, not marketing dashboard. Confidence intervals are the signature
          element — everything else stays quiet.
        </p>
      </header>

      <PreviewCard title="Status pills">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <StatusPill status="ready" />
          <StatusPill status="gathering" />
          <StatusPill status="not_started" />
        </div>
      </PreviewCard>

      <PreviewCard title="Metric headline — reportable">
        <MetricHeadline
          estimandLabel="Overall win rate"
          value={0.65}
          ciLow={0.55}
          ciHigh={0.8}
          n_users={42}
          n_decisive={168}
          reportable
        />
      </PreviewCard>

      <PreviewCard title="Metric headline — withheld">
        <MetricHeadline
          estimandLabel="Overall win rate"
          value={null}
          ciLow={null}
          ciHigh={null}
          n_users={18}
          n_decisive={54}
          reportable={false}
          withheldReason="results unlock at 30 comparisons"
        />
      </PreviewCard>

      <PreviewCard title="Confidence bar — winning (reportable)">
        <ConfidenceBar
          label="vs. Kind Peanut Butter"
          sublabel="Same category · forced choice"
          value={0.67}
          ciLow={0.55}
          ciHigh={0.8}
          reportable
        />
      </PreviewCard>

      <PreviewCard title="Confidence bar — below 50% (reportable)">
        <ConfidenceBar
          label="vs. Jif Creamy"
          sublabel="Same category · forced choice"
          value={0.41}
          ciLow={0.28}
          ciHigh={0.54}
          reportable
        />
      </PreviewCard>

      <PreviewCard title="Confidence bar — gathering signal">
        <ConfidenceBar
          label="vs. Skippy Natural"
          sublabel="Reliability anchor"
          value={null}
          ciLow={null}
          ciHigh={null}
          reportable={false}
          withheldReason="18 of 30 comparisons needed"
        />
      </PreviewCard>

      <PreviewCard title="Methodology disclosure">
        <MethodologyDisclosure disclosure={SAMPLE_DISCLOSURE} />
      </PreviewCard>
    </div>
  )
}
