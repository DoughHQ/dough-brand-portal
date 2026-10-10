'use client'

import type { CSSProperties, ReactNode } from 'react'
import {
  caption,
  chip,
  fieldLabel,
  metricCard,
  metricNumber,
  sectionHeading,
} from '@/lib/productMaster/styles'
import { splitCategoryPath } from './overviewPresentation'

const sectionTitle: CSSProperties = {
  ...sectionHeading,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 4,
}

export function ProposalBadge({ types, match }: { types: Set<string>; match: string }) {
  if (!types.has(match)) return null
  return (
    <span
      style={{
        ...chip,
        marginLeft: 8,
        color: 'var(--amber)',
        background: 'var(--amber-soft, rgba(192,120,24,0.12))',
      }}
    >
      Pending review
    </span>
  )
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 style={sectionTitle}>{children}</h2>
}

export function OverviewHeading({ children }: { children: ReactNode }) {
  return <h2 className="pm-overview-heading">{children}</h2>
}

export function CategoryBreadcrumb({ path }: { path: string | null }) {
  const parts = splitCategoryPath(path)
  if (parts.length === 0) {
    return (
      <div className="pm-overview-path">
        <span className="pm-overview-path-seg">{path ?? 'Not yet categorized'}</span>
      </div>
    )
  }
  return (
    <div className="pm-overview-path">
      {parts.map((part, i) => {
        const last = i === parts.length - 1
        return (
          <span key={`${part}-${i}`}>
            {i > 0 ? <span className="pm-overview-path-sep">›</span> : null}
            <span
              className={
                last ? 'pm-overview-path-seg pm-overview-path-current' : 'pm-overview-path-seg'
              }
            >
              {part}
            </span>
          </span>
        )
      })}
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={metricCard}>
      <div style={{ ...fieldLabel, marginBottom: 6 }}>{label}</div>
      <div style={metricNumber}>{value}</div>
      {sub && <div style={{ ...caption, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}
